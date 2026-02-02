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
    user: 'vandinhdung2003@gmail.com',
    pass: 'vcim zier heyi muuh',
  },
});

const thresholds = {
  'MQ2': {
    mq2: { maxWarning: 1300, maxDanger: 1600 }
  },
  'DHT11': {
    temperature: { maxWarning: 35, maxDanger: 40 }, // Example: temperature in Celsius
    humidity: { minWarning: 30, maxWarning: 70, minDanger: 20, maxDanger: 85 }, // Example: humidity percentage
  },
  'PZEM': {
    voltage: { minWarning: 235, maxWarning: 240, minDanger: 245, maxDanger: 254 }, // Example: voltage in V
    current: { maxWarning: 2, maxDanger: 5 }, // Example: current in A
    power: { maxWarning: 400, maxDanger: 1000 }, // Example: power in W
    // frequency: { minWarning: 49, maxWarning: 51, minDanger: 48, maxDanger: 52 }, // Example: frequency in Hz
    // pf: { minWarning: 0.9, minDanger: 0.8 }, // Example: power factor (lower is worse)
    // energy: skipped as it's cumulative
  },
  // FLAME handled separately as boolean-like (0 = safe, non-zero = danger)
};
/////

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

    } else if (sender.role === 'frontend' || sender.role === 'app') {
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
  const sendNotificationToFrontend = (notification) => {
    broadcastToRole("frontend", {
      type: "notification",
      data: notification,
    });

    broadcastToRole("app", {
      type: "notification",
      data: notification,
    });
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
              if (sensor.value !== 1) {
                status = 'danger';
                message = `FLAME sensor ${sensor.name} detected flame (value: ${sensor.value})`;
              }
            } else if (['MQ2', 'DHT11'].includes(sensor.type) && sensor.value !== null) {
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

      // Send  if there are alerts
      if (alerts.length > 0) {
        //Send email
        console.log("Danger alert", alerts)
        const emailBody = alerts.map(a => `
        <div class="alert-detail ${a.status}">
          <strong>${a.status.toUpperCase()}</strong><br/>
          ${a.message}
        </div>
      `).join('');
        const overallStatus = alerts.some(a => a.status === 'danger') ? 'danger' : 'warning';
        await sendEmail(overallStatus, emailBody, data.room);

        //Send socket message
        const createdAt = Date.now();

        alerts.forEach(alert => {
          sendNotificationToFrontend({
            room: data.room,
            status: alert.status === "danger" ? "Danger" : "Warning",
            description: alert.message,
            createdAt,
          });
        });
      }
    } catch (err) {
      console.error("Error processing room data:", err);
    }
  };

};



export default webSocketServer;


// Function to send email alert
const sendEmail = async (status, body, room) => {
  const timestamp = new Date().toISOString();
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f6f8;
        padding: 20px;
      }
      .container {
        max-width: 650px;
        background: #ffffff;
        margin: auto;
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      h2 {
        margin-top: 0;
      }
      .danger-title {
        color: #c0392b;
      }
      .warning-title {
        color: #d35400;
      }
      .alert-detail {
        margin: 12px 0;
        padding: 12px;
        border-left: 5px solid;
        border-radius: 4px;
      }
      .danger {
        background: #fdecea;
        border-color: #c0392b;
      }
      .warning {
        background: #fff6e5;
        border-color: #f39c12;
      }
      .meta {
        color: #666;
        font-size: 14px;
        margin-bottom: 16px;
      }
      .footer {
        margin-top: 24px;
        font-size: 13px;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2 class="${status === 'danger' ? 'danger-title' : 'warning-title'}">
        ${status.toUpperCase()} Alert – Room ${room}
      </h2>
  
      <div class="meta">
        <strong>Room ID:</strong> ${room}<br/>
        <strong>Timestamp:</strong> ${new Date().toISOString()}
      </div>
  
      ${body}
  
      <div class="footer">
        ⚠️ This is an automated alert from the IoT Monitoring System.<br/>
        Please investigate immediately if the issue persists.
      </div>
    </div>
  </body>
  </html>
  `;
  const mailOptions = {
    from: process.env.EMAIL_USER || 'vandinhdung2003@gmail.com',
    to: process.env.ALERT_RECIPIENT || 'perrydinh169@gmail.com', // Configure recipient
    subject: `${status.toUpperCase()} Alert in Room ${room}`,
    // text: `Alert details:\n${body}\n\nTimestamp: ${new Date().toISOString()}`,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`${status.toUpperCase()} email alert sent for room ${room}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



