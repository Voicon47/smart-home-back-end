using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHome_BackEnd.Data;
using SmartHome_BackEnd.Entities;
using System;
using System.Collections.Concurrent;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace SmartHome_BackEnd.Controllers
{
    [Route("api/ws")]
    public class TestWebSocketController : ControllerBase
    {
        private readonly DataContext _context;
        private static ConcurrentBag<WebSocket> _sockets = new ConcurrentBag<WebSocket>();  // To store all connected WebSockets
        public TestWebSocketController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task Get()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
                _sockets.Add(webSocket);  // Add new WebSocket to the list
                await HandleWebSocketAsync(webSocket);
            }
            else
            {
                HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            }
        }

        private async Task HandleWebSocketAsync(WebSocket webSocket)
        {
            var buffer = new byte[1024 * 4];

            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    _sockets = new ConcurrentBag<WebSocket>(_sockets.Where(socket => socket != webSocket));  // Remove WebSocket on close
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by client", CancellationToken.None);
                }
                else if (result.MessageType == WebSocketMessageType.Text)
                {
                    var receivedData = Encoding.UTF8.GetString(buffer, 0, result.Count);

                    // Deserialize sensor data
                    var message = JsonSerializer.Deserialize<WebSocketMessage<JsonElement>>(receivedData);
                    if (message != null)
                    {
                        switch (message.Type)
                        {
                            case "SensorData":
                                if(!message.Data.ToString().Equals("null"))
                                {
                                    Sensor sensorData = JsonSerializer.Deserialize<Sensor>(message.Data.ToString());
                                    await SaveSensorData(sensorData);
                                    await BroadcastSensorDataAsync(sensorData);

                                    var responseData = Encoding.UTF8.GetBytes("Data received and saved!");
                                    await webSocket.SendAsync(new ArraySegment<byte>(responseData), WebSocketMessageType.Text, true, CancellationToken.None);
                                }
                                break;
                            case "Light":
                                var signal = message.Data.ToString();
                                await SendSignal(signal);

                                break;
                            default:
                                Console.WriteLine("Unknown message type received");
                                break;
                        }
                       
                    }

                    
                }
            }
        }
        private async Task BroadcastSensorDataAsync(Sensor sensorData)
        {
            var responseMessage = new WebSocketMessage<Sensor>("SensorData", sensorData);
            // Serialize sensor data to JSON
            var responseData = JsonSerializer.Serialize(responseMessage);
            var buffer = Encoding.UTF8.GetBytes(responseData);

            // Broadcast the data to all connected clients
            foreach (var socket in _sockets)
            {
                if (socket.State == WebSocketState.Open)
                {
                    await socket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
        }

        private async Task  SaveSensorData(Sensor sensor)
        {
            _context.Sensors.Add(sensor);
            await _context.SaveChangesAsync();
            Console.WriteLine($"Saved to DB: {sensor}");
        }

        private async Task SendSignal(string message)
        {
            if (message.StartsWith("Light_"))
            {
                string lightCommand = message.Substring(6); // Extract light command (on/off)
                var responseMessage = new WebSocketMessage<string>("Light", $"Light_{lightCommand}");

                var responseData = JsonSerializer.Serialize(responseMessage);
                var buffer = Encoding.UTF8.GetBytes(responseData);
                foreach (var socket in _sockets)
                {
                    if (socket.State == WebSocketState.Open)
                    {
                        await socket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                    }
                }
            }
        }
    }
}
