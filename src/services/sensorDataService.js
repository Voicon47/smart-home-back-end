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


export const sensorDataService = {
    getDataByHour,
}