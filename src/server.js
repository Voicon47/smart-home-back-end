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

const START_SERVER = async () => {
  try {
    console.log('1. Connecting to MongoDB Atlas...');
    await CONNECT_DB();
    console.log('✅ 2. Connected to MongoDB Cloud Atlas');

    console.log('1.1 Connecting to Redis...');
    await CONNECT_REDIS();
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
