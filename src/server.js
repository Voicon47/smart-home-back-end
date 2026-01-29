import express from 'express';
import cors from 'cors';
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb';
import exitHook from 'async-exit-hook';
import { env } from './config/environment';
import { APIs_V1 } from './routes/v1/index';
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware';
import { corsOptions } from './config/cors';
import webSocketServer from './sockets/socketServer';
import { authHandlingMiddleware } from './middlewares/authHandlingMiddleware';
import { CLOSE_REDIS, CONNECT_REDIS } from './config/redis';

const dataTest = {
  "room": "677d0d50cc13de58fab8e379",
  "type": "control",
  "sensors": [
    {
      "id": "677faf7339a557ec6c1a9261",
      "name": "mq2_1",
      "type": "MQ2",
      "attribute": "mq2",
      "value": 350
    },
    {
      "id": "677faf7339a557ec6c1a9262",
      "name": "dht11_1",
      "type": "DHT11",
      "attribute": "DHT11",
      "value": {
        "temperature": 36.5,
        "humidity": 85.0
      }
    },
    {
      "id": "677faf7339a557ec6c1a9263",
      "name": "flame_1",
      "type": "FLAME",
      "attribute": "flame",
      "value": 1
    },
    {
      "id": "693bcdda40320085812c0d55",
      "name": "pzem_1",
      "type": "PZEM",
      "attribute": "energy",
      "value": {
        "voltage": 245.0,
        "current": 3.5,
        "power": 500.0,
        "energy": 15.0,
        "frequency": 50.0,
        "pf": 0.85
      }
    }
  ],
  "devices": [
    {
      "id": "67fd7fb65b36734899138d6f",
      "name": "light_1",
      "type": "LIGHT",
      "status": "on"
    },
    {
      "id": "67a976200157d298f7c949c8",
      "name": "fan_1",
      "type": "FAN",
      "status": "off"
    }
  ]
}

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
/////
import nodemailer from 'nodemailer'; // Added for SMTP email sending

// Configure Nodemailer transporter (use environment variables for security in production)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Replace with your email service
  auth: {
    user: process.env.EMAIL_USER || 'vandinhdung2003@gmail.com',
    pass: process.env.EMAIL_PASS || 'vcim zier heyi muuh',
  },
});
///////
// Function to send email alert
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

const START_SERVER = async () => {
  try {
    console.log('1. Connecting to MongoDB Atlas...');
    await CONNECT_DB();
    console.log('✅ 2. Connected to MongoDB Cloud Atlas');

    console.log('1.1 Connecting to Redis...');
    // await CONNECT_REDIS();
    console.log('✅ 2. Connected to Redis');

    const app = express();

    // CORS handling
    app.use(cors(corsOptions));

    // Enable req.body JSON data
    app.use(express.json());

    // Authorization
    app.use(authHandlingMiddleware);

    // Use APIs v1
    app.use('/v1', APIs_V1);

    // Middleware
    app.use(errorHandlingMiddleware);

    // Start HTTP server
    const server = app.listen(env.LOCAL_DEV_APP_PORT || process.env.PORT, () => {
      const host = env.BUILD_MODE === 'production' ? 'Production' : 'Local Dev';
      const port = env.BUILD_MODE === 'production' ? process.env.PORT : env.LOCAL_DEV_APP_PORT;
      console.log(`✅ 3. ${host}: Hello ${env.AUTHOR}, I am running at Port: ${port}/`);
    });

    // processEsp32Data(dataTest)
    // WebSocket Server
    webSocketServer(server);

    // Graceful Shutdown Handling
    exitHook(async () => {
      console.log('⚠️ Exit signal received. Cleaning up resources...');

      console.log('⏳ Closing MongoDB Connection...');
      await CLOSE_DB();
      console.log('✅ 4. Disconnected from MongoDB Cloud Atlas.');

      console.log('⏳ Closing Redis Connection...');
      await CLOSE_REDIS();
      console.log('✅ 5. Disconnected from Redis.');

      console.log('🛑 Server stopped.');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1); // Ensure app stops if database connection fails
  }
};

// Start the server
START_SERVER();


const processEsp32Data = async (data) => {
  try {
    const createdAt = Date.now()
    console.log("Data received at:", createdAt);
    // --- handle sensors ---
    let alerts = []; // Collect alerts for email
    if (data.sensors && Array.isArray(data.sensors)) {
      for (const sensor of data.sensors) {
        try {
          // await sensorService.createOrUpdateSensor(sensor, data.room, createdAt);
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
          // await deviceService.createOrUpdateDevice(device, data.room);
          // console.log("Device:", device);
        } catch (error) {
          console.error(`Error processing device ${device.name}:`, error);
        }
      }
    }

    // Send email if there are alerts
    if (alerts.length > 0) {
      const emailBody = alerts.map(a => `
        <div class="alert-detail ${a.status}">
          <strong>${a.status.toUpperCase()}</strong><br/>
          ${a.message}
        </div>
      `).join('');
      const overallStatus = alerts.some(a => a.status === 'danger') ? 'danger' : 'warning';
      await sendEmail(overallStatus, emailBody, data.room);
    }
  } catch (err) {
    console.error("Error processing room data:", err);
  }
};