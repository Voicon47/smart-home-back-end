
import express from 'express'
import cors from 'cors'
import { CONNECT_DB,  CLOSE_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from './config/environment'
import { APIs_V1 } from './routes/v1/index'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'
// import { sensorModel } from './models/sensorModel'
// import { sensorService } from './services/sensorService'
import webSocketServer from './sockets/socketServer'
import { authHandlingMiddleware } from './middlewares/authHandlingMiddleware'


const START_SERVER = () => {
  const app = express()

  ///Cors handling
  app.use(cors(corsOptions))
  console.log('2.Connected to MongoDB Cloud Atlas')

  //Enable req.body json data
  app.use(express.json())
  
  // Authorization 
  app.use(authHandlingMiddleware)

  //Use APIs v1
  app.use('/v1',APIs_V1)

  //Middleware
  app.use(errorHandlingMiddleware)

  //====================== HTTP SERVER ============================//
  // Start HTTP server
  // console.log(env.LOCAL_DEV_APP_PORT)
  const server = app.listen(env.LOCAL_DEV_APP_PORT || process.env.PORT, () => {
    const host = env.BUILD_MODE === 'production' ? 'Production' : 'Local Dev'
    const port = env.BUILD_MODE === 'production' ? process.env.PORT : env.LOCAL_DEV_APP_PORT
    console.log(`3.${host}: Hello ${env.AUTHOR}, I am running at Port:${port}/`)
  })
  // // Production enviroment
  // if(env.BUILD_MODE === 'production'){
  //   app.listen(process.env.PORT, () => {
  //     // eslint-disable-next-line no-console
  //     console.log(`3.Prodcution: Hello ${env.AUTHOR}, I am running at Port:${ process.env.PORT }/`)
  //   })
  // } else {
  //   ///Local dev enviroment
  //   app.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
  //     // eslint-disable-next-line no-console
  //     console.log(`3.Local Dev: Hello ${env.AUTHOR}, I am running at ${ process.env.LOCAL_DEV_APP_HOST }:${ process.env.LOCAL_DEV_APP_PORT }/`)
  //   })
  // }

  //====================== WEBSOCKET SERVER ============================//
  webSocketServer(server)
  // const message = `{
  //   "room": "677d0d50cc13de58fab8e379",
  //   "sensors": [
  //     { "name":"mq2_1","type":"MQ-2","mq2": 256 },
  //     { "name":"dht11_1","type":"DHT11","temperature": 30.8, "humidity": 64 },
  //     { "name":"flame_1","type":"FLAME","flame": 1 }
  //   ],
  //   "devices": { "light_1": { "status": "on" }, "fan_1": { "status": "on" } }
  // }`;
  
  // const data = JSON.parse(message);  // Parse the string to convert it into an object
  
  // console.log(data.sensors[0]);  // Now you can access properties on the object
  // // Loop through sensors
  // const processSensors = async (data) => {
  //   for (const sensor of data.sensors) {
  //     try {
  //       const createdSensor = await sensorService.createNewSocket(sensor, data.room);
  //       console.log("Sensor:", createdSensor);
  //       // Add your update or creation logic here
  //     } catch (error) {
  //       console.error(`Error processing sensor ${sensor.name}:`, error);
  //     }
  //   }
  // };
  
  
  // processSensors(data);

  // Loop through devices
  // console.log("\nDevice Data:");
  // for (const [key, value] of Object.entries(data.devices)) {
  //   console.log(`${key}:`, value);
  // }
  // sensorModel.findOneByName(message.sensors)
  // const wss = new WebSocketServer({ server })
  // wss.on('connection', (ws) => {
  //   console.log('WebSocket client connected.')

  //   ws.on('message', async (message) => {
  //     try {
  //       // Example: Handle incoming API request via WebSocket
  //       const data = JSON.parse(message)
  //       console.log('Received message:', data)
  //       // const parsedData = JSON.parse(data.data);
  //       // console.log("Data: ", parsedData);
  //       if (data.type === 'apiCall') {
  //         // Simulate DB access or other API logic
  //         // const response = await GET_DB().collection('example').findOne({ key: data.payload })
  //         const response = 'Hello client'
  //         ws.send(JSON.stringify({ type: 'response', data: response }))
  //       }
  //     } catch (error) {
  //       console.error('Error handling WebSocket message:', error)
  //       ws.send(JSON.stringify({ type: 'error', error: error.message }))
  //     }
  //   })

  //   ws.on('close', () => {
  //     console.log('WebSocket client disconnected.')
  //   })
  // })
  //====================== EXIT ==================================//
  exitHook(() => {
    console.log(`Exit app`)
    console.log('4.Disconected from MongoDB Cloud Atlas....')
    CLOSE_DB()
    console.log('5.Disconected from MongoDB Cloud Atlas')
  })
}

CONNECT_DB()
  .then(() => console.log('1.Connecting to Mongo Atlas Cloud'))
  .then(() => START_SERVER())
  .catch(error => {
    console.error(error)
    // process.exit(0)
  })
