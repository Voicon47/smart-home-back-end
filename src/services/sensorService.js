// eslint-disable-next-line no-unused-vars
import { StatusCodes } from "http-status-codes"
import { GET_REDIS } from "~/config/redis";
import { sensorDataModel } from "~/models/sensorDataModel"
import { sensorModel } from "~/models/sensorModel"
// eslint-disable-next-line no-unused-vars
import ApiError from "~/utils/ApiError"


const SENSOR_CACHE_KEY = 'all_sensors';
const CACHE_EXPIRATION = 60 * 5; // 5 minutes (adjust as needed)

const createNewSensor = async(sensorData, roomId) => {
    // const type = data.type || "OTHER"
    // eslint-disable-next-line no-unused-vars
    const { type, name,...data } = sensorData;
    
    const newSensor = {
        name: sensorData.name, // Use the key as the sensor's name
        type, // Type of the sensor
        roomId, // Room ID associated with the sensor
      };
    // console.log(data)
    // eslint-disable-next-line no-useless-catch
    try {
        ///Check exist 
        const existSensor = await sensorModel.findOneByName(newSensor.name)
        if(existSensor) {
            /// Update to sensor data
            const newSensorData = {
                sensorId: String(existSensor._id),
                ...data
            }
            const createdSensorData = await sensorDataModel.createNew(newSensorData)
            return createdSensorData
        } else {
            // Create new sensor
            const createdSensor = await sensorModel.createNew(newSensor)
            return createdSensor
        }
    } catch (error) {
        throw error
    }
}

const getAllSensors = async() =>{
    try {
        const redisClient = GET_REDIS();
        if (redisClient) {
            const cachedData = await redisClient.get(SENSOR_CACHE_KEY);
            if (cachedData) {
              console.log('📦 Fetching sensors from Redis cache');
              return JSON.parse(cachedData);
            }
        }
        // Fetching from Database
        const sensors = await sensorModel.getAllSensors()
        // Store the result in Redis cache with expiration time
        if (redisClient) {
            await redisClient.set(SENSOR_CACHE_KEY, JSON.stringify(sensors), 'EX', CACHE_EXPIRATION);
            console.log('✅ Sensors cached in Redis.');
        }
        return sensors
    } catch (error) {
        throw error
    }
}
export const sensorService = {
    createNewSensor,
    getAllSensors
}