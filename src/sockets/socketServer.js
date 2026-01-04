// webSocketServer.js
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique ID generation
import { sensorService } from '~/services/sensorService';
import { deviceService } from '~/services/deviceService';
import { actionLogsService } from '~/services/actionLogsService';

const webSocketServer = (httpServer) => {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/v1'
  });
  const clients = new Map();
  const wssESP32 = new WebSocketServer({
    server: httpServer,
    path: '/ws'
  });
  wss.on('connection', (ws) => {
    const clientId = uuidv4(); // Generate a unique ID for the client
    clients.set(clientId, { ws, role: null }); // Map the client ID to the WebSocket connection
    console.log('WebSocket client connected: ', clientId);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        // console.log(data)
        // Handle initial handshake to set roles
        if (data.type === 'register') {
          const role = data.role; // Expected roles: 'esp32' or 'frontend'
          clients.set(clientId, { ws, role });

          // Acknowledge registration
          ws.send(JSON.stringify({ type: 'register_ack', clientId, role }));
        } else if (data.type === 'control') {
          // Forward messages based on role
          handleClientMessage(clientId, data);
          // ws.send(JSON.stringify("HELLLO"));
        }

      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', error: error.message }));
      }
    });

    ws.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);
      clients.delete(clientId)
    });
  });

  const handleClientMessage = (senderId, data) => {
    const sender = clients.get(senderId);

    if (!sender || !sender.role) {
      console.warn(`Unknown sender: ${senderId}`);
      return;
    }

    if (sender.role === 'esp32') {
      // Forward data to all front-end clients
      broadcastToRole('frontend', data);
      broadcastToRole('app', data);
      // ESP32 sends data to the front-end
      processEsp32Data(data)

    } else if (sender.role === 'frontend') {
      // Front-end sends a command to ESP32
      console.log(`Command from front-end (ID=${senderId}):`, data);
      // Forward command to all ESP32 clients
      broadcastToRole('esp32', data);

      console.log("First")
      //Store action log
      actionLogsService.createNew(data.data)

    }
  };

  const broadcastToRole = (role, message) => {
    for (const [clientId, clientInfo] of clients) {
      // console.log(clientInfo)
      if (clientInfo.role === role && clientInfo.ws.readyState === WebSocket.OPEN) {
        try {
          clientInfo.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Error broadcasting to client ID=${clientId}:`, error);
        }
      }
    }
  };
  const processEsp32Data = async (data) => {
    try {
      const createdAt = Date.now()
      console.log("Data received at:", createdAt);
      // --- handle sensors ---
      if (data.sensors && Array.isArray(data.sensors)) {
        for (const sensor of data.sensors) {
          try {
            await sensorService.createOrUpdateSensor(sensor, data.room, createdAt);
            // console.log("Sensor:", sensor);
          } catch (error) {
            console.error(`Error processing sensor ${sensor.name}:`, error);
          }
        }
      }

      // --- Handle devices ---
      if (data.devices && Array.isArray(data.devices)) {
        for (const device of data.devices) {
          try {
            await deviceService.createOrUpdateDevice(device, data.room);
            // console.log("Device:", device);
          } catch (error) {
            console.error(`Error processing device ${device.name}:`, error);
          }
        }
      }
    } catch (err) {
      console.error("Error processing room data:", err);
    }
  };
};



export default webSocketServer;
