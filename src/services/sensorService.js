// eslint-disable-next-line no-unused-vars
import { StatusCodes } from "http-status-codes"
import { sensorDataModel } from "~/models/sensorDataModel"
import { sensorModel } from "~/models/sensorModel"
// eslint-disable-next-line no-unused-vars
import ApiError from "~/utils/ApiError"
const createNewSocket = async(sensorData, roomId) => {
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

export const sensorService = {
    createNewSocket
}