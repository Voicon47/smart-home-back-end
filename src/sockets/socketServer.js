// webSocketServer.js
import { WebSocketServer, WebSocket} from 'ws';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique ID generation
import { sensorService } from '~/services/sensorService';

const webSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ server: httpServer });
  const clients = new Map();

  wss.on('connection', (ws) => {
    const clientId = uuidv4(); // Generate a unique ID for the client
    clients.set(clientId, { ws, role: null }); // Map the client ID to the WebSocket connection
    console.log('WebSocket client connected: ', clientId);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(data)
        // Handle initial handshake to set roles
        if (data.type === 'register') {
          const role = data.role; // Expected roles: 'esp32' or 'frontend'
          clients.set(clientId, { ws, role });
          // console.log(`Client registered: ID=${clientId}, Role=${role}`);

          // Acknowledge registration
          ws.send(JSON.stringify({ type: 'register_ack', clientId, role }));
        } else {
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
    processData(data)
    if (sender.role === 'esp32') {
      // ESP32 sends data to the front-end
      // console.log(`Data from ESP32 (ID=${senderId}):`, data);
      
      // Forward data to all front-end clients
      // broadcastToRole('frontend', { type: 'sensor_data', payload: data });
      broadcastToRole('frontend', data);
    } else if (sender.role === 'frontend') {
      // Front-end sends a command to ESP32
      console.log(`Command from front-end (ID=${senderId}):`, data);
  
      // Forward command to all ESP32 clients
      // broadcastToRole('esp32', { type: 'command', payload: data });
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
  const processData = async (data) => {
    for (const sensor of data.sensors) {
      try {
        await sensorService.createNewSensor(sensor, data.room);
        // console.log("Sensor:", createdSensor);
        // Add your update or creation logic here
      } catch (error) {
        console.error(`Error processing sensor ${sensor.name}:`, error);
      }
    }
  };
};



export default webSocketServer;
