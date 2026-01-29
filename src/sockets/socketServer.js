// webSocketServer.js
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique ID generation
import { sensorService } from '~/services/sensorService';
import { deviceService } from '~/services/deviceService';
import { actionLogsService } from '~/services/actionLogsService';
import nodemailer from 'nodemailer'; // Added for SMTP email sending

// Configure Nodemailer transporter (use environment variables for security in production)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Replace with your email service
  auth: {
    user: process.env.EMAIL_USER || 'vandinhdung2003@gmail.com',
    pass: process.env.EMAIL_PASS || 'vcim zier heyi muuh',
  },
});


const thresholds = {
  'MQ2': {
    mq2: { maxWarning: 300, maxDanger: 500 }
  },
  'DHT11': {
    temperature: { maxWarning: 30, maxDanger: 35 }, // Example: temperature in Celsius
    humidity: { minWarning: 30, maxWarning: 70, minDanger: 20, maxDanger: 80 }, // Example: humidity percentage
  },
  'PZEM': {
    voltage: { minWarning: 210, maxWarning: 230, minDanger: 200, maxDanger: 240 }, // Example: voltage in V
    current: { maxWarning: 2, maxDanger: 5 }, // Example: current in A
    power: { maxWarning: 400, maxDanger: 1000 }, // Example: power in W
    frequency: { minWarning: 49, maxWarning: 51, minDanger: 48, maxDanger: 52 }, // Example: frequency in Hz
    pf: { minWarning: 0.9, minDanger: 0.8 }, // Example: power factor (lower is worse)
    // energy: skipped as it's cumulative
  },
  // FLAME handled separately as boolean-like (0 = safe, non-zero = danger)
};

const webSocketServer = (httpServer) => {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws'
  });
  const clients = new Map();

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
      // processEsp32Data(testData)
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
      let alerts = []; // Collect alerts for email
      if (data.sensors && Array.isArray(data.sensors)) {
        for (const sensor of data.sensors) {
          try {
            await sensorService.createOrUpdateSensor(sensor, data.room, createdAt);
            // console.log("Sensor:", sensor);

            // Check for exceeding limits
            let status = 'safe';
            let message = '';

            if (sensor.type === 'FLAME') {
              if (sensor.value !== 0) {
                status = 'danger';
                message = `FLAME sensor ${sensor.name} detected flame (value: ${sensor.value})`;
              }
            } else if (['MQ2', 'DHT11', 'PZEM'].includes(sensor.type) && sensor.value !== null) {
              let values = sensor.value;
              // For MQ2, wrap the single value as an object for consistency
              if (sensor.type === 'MQ2') {
                values = { mq2: sensor.value };
              }
              // Assume for DHT11 and PZEM, value is already an object

              if (typeof values === 'object') {
                for (const subkey in values) {
                  const val = values[subkey];
                  const thresh = thresholds[sensor.type][subkey];
                  if (!thresh) continue;

                  let localStatus = 'safe';
                  let reason = '';

                  // Check danger thresholds
                  if (('minDanger' in thresh && val < thresh.minDanger)) {
                    localStatus = 'danger';
                    reason = `below danger min ${thresh.minDanger}`;
                  } else if (('maxDanger' in thresh && val > thresh.maxDanger)) {
                    localStatus = 'danger';
                    reason = `above danger max ${thresh.maxDanger}`;
                  }
                  // Check warning thresholds if not danger
                  else if (('minWarning' in thresh && val < thresh.minWarning)) {
                    localStatus = 'warning';
                    reason = `below warning min ${thresh.minWarning}`;
                  } else if (('maxWarning' in thresh && val > thresh.maxWarning)) {
                    localStatus = 'warning';
                    reason = `above warning max ${thresh.maxWarning}`;
                  }

                  if (localStatus !== 'safe') {
                    message += (message ? '; ' : '') + `${subkey} ${val} is ${reason}`;
                    // Upgrade overall status: danger takes precedence over warning
                    if (localStatus === 'danger') {
                      status = 'danger';
                    } else if (status === 'safe') {
                      status = 'warning';
                    }
                  }
                }
              }

              if (status !== 'safe') {
                message = `${sensor.type} sensor ${sensor.name}: ${message}`;
              }
            }

            if (status !== 'safe') {
              alerts.push({ status, message });
            }
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

      // Send email if there are alerts
      if (alerts.length > 0) {
        const emailBody = alerts.map(a => `${a.status.toUpperCase()}: ${a.message}`).join('\n');
        const overallStatus = alerts.some(a => a.status === 'danger') ? 'danger' : 'warning';
        await sendEmail(overallStatus, emailBody, data.room);
      }
    } catch (err) {
      console.error("Error processing room data:", err);
    }
  };

  // Function to send email alert
  const sendEmail = async (status, body, room) => {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your.email@gmail.com',
      to: process.env.ALERT_RECIPIENT || 'recipient@email.com', // Configure recipient
      subject: `${status.toUpperCase()} Alert in Room ${room}`,
      text: `Alert details:\n${body}\n\nTimestamp: ${new Date().toISOString()}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`${status.toUpperCase()} email alert sent for room ${room}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
};



export default webSocketServer;
