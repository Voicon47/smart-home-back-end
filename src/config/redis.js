import Redis from "ioredis"
import ApiError from "~/utils/ApiError";

const REDIS_CONNECT_TIMEOUT = 5000; // Timeout before retrying connection
const REDIS_CONNECT_MESSAGE = {
    code: -99,
    message: {
      vn: 'Redis gặp lỗi ',
      en: 'Redis service error!',
    },
  };
let redisClient,connectionTimeout;

const handleTimeoutError = () => {
    connectionTimeout = setTimeout(() => {
        // throw new ApiError(REDIS_CONNECT_MESSAGE.code, REDIS_CONNECT_MESSAGE.message.vn)
        throw new Error("Redis error")
    }, REDIS_CONNECT_TIMEOUT)
}
// Function to handle Redis connection events
const handleEventConnection = (client) => {
  client.on('connect', () => {
    console.log('Redis Connection Status: Connected');
    clearTimeout(connectionTimeout)
  });

  client.on('ready', () => {
    console.log('Redis Connection Status: Ready');
  });

  client.on('error', (err) => {
    // console.error(`Redis Connection Status: Error - ${err}`);
    handleTimeoutError()
  });

  client.on('close', () => {
    // console.log('Redis Connection Status: Closed');
  });

  client.on('reconnecting', () => {
    console.log('Redis Connection Status: Reconnecting...');
    clearTimeout(connectionTimeout)
  });

  client.on('end', () => {
    console.log('Redis Connection Status: Disconnected');
    handleTimeoutError()
  });
};


export const CONNECT_REDIS = async () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: '127.0.0.1',
      port: 6379,
      // retryStrategy: (times) => {
      //   console.warn(`🔄 Redis Reconnect Attempt: ${times}`);
      //   return times > 10 ? null : Math.min(50 * Math.pow(2, times), REDIS_CONNECT_TIMEOUT);
      // },
      enable_offline_queue: false
    });

     handleEventConnection(redisClient);
  }
  return redisClient;
};

export const GET_REDIS = () => {
    if (!redisClient || redisClient.status === 'end' || redisClient.status === 'reconnecting') {
        console.warn('⚠️ Redis is not connected. Call CONNECT_REDIS first.');
        // throw new Error('Must connect to Redis first!')
        return null
    }
    console.log("Weird")
    return redisClient;
}

export const CLOSE_REDIS = async () => {
  console.log("Close redis")
    if (redisClient) {
        await redisClient.quit();
        console.log('🛑 Redis Connection Closed.');
        redisClient = null;
    } else {
        console.warn('⚠️ Redis is not connected.');
    }
}