using System.Text.Json;

namespace SmartHome_BackEnd.Entities
{
    public class WebSocketMessage<T>
    {
        public WebSocketMessage(string type,T data) 
        { 
            Type = type;
            Data = data;
        } 
        public string Type { get; set; } // Message type identifier
        public T? Data { get; set; } // The actual data (untyped for flexibility)
    }
}
