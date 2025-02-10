import { sensorDataModel } from "~/models/sensorDataModel"
import { sensorModel } from "~/models/sensorModel"


const getDataByHour = async(sensorId,year,month,day) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const sensorType = await sensorModel.findOneById(sensorId)
        console.log(sensorType.type)
        const getNewData = await sensorDataModel.getDataByDay(sensorId,sensorType.type,year,month,day)
        return getNewData
    } catch (error) {
        throw error
    }
}
const getDataById = async(sensorId) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const existSensor = await sensorModel.findOneById(sensorId)
        if(existSensor){
            const getData = await sensorDataModel.getDataById(sensorId)
            return getData
        }else{
            throw new ApiError(StatusCodes.NOT_FOUND,'Sensor not found')
        }
        // return getData
    } catch (error) {
        throw error
    }
}

export const sensorDataService = {
    getDataById,
    getDataByHour,
}