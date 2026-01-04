import { StatusCodes } from "http-status-codes"
import { sensorDataModel } from "~/models/sensorDataModel"
import { sensorModel } from "~/models/sensorModel"


const getChartData = async (sensorId, year, month, day, type) => {
    try {
        // const existSensor = await sensorModel.findOneById(sensorId)
        // if(existSensor){
        //     const getData = await sensorDataModel.getDataById(sensorId)
        //     return getData
        // }else{
        //     throw new ApiError(StatusCodes.NOT_FOUND,'Sensor not found')
        // }
        console.log("Type: ", type)
        switch (type) {
            case 'daily':
                const getDailyData = await sensorDataModel.getDataByHour(sensorId, year, month, day)
                console.log(getDailyData)
                return getDailyData
            case 'weekly':
                const getWeeklyData = await sensorDataModel.getDataByWeek(sensorId, year, month, day)
                return getWeeklyData
            case 'monthly':
                const getMonthlyData = await sensorDataModel.getDataByDay(sensorId, year, month)
                return getMonthlyData
            case 'yearly':
                const getYearlyData = await sensorDataModel.getDataByMonth(sensorId, year)
                return getYearlyData
            case 'default':
                break;
        }
    } catch (error) {
        throw error
    }
}
const getDataByHour = async (sensorId, year, month, day) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const sensorType = await sensorModel.findOneById(sensorId)
        console.log(sensorType.type)
        const getNewData = await sensorDataModel.getDataByDay(sensorId, sensorType.type, year, month, day)
        return getNewData
    } catch (error) {
        throw error
    }
}
const getDataById = async (sensorId) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const existSensor = await sensorModel.findOneById(sensorId)
        if (existSensor) {
            const getData = await sensorDataModel.getDataById(sensorId)
            return getData
        } else {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sensor not found')
        }
        // return getData
    } catch (error) {
        throw error
    }
}
const getDataByQuery = async (sensorId, status, query, type) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const existSensor = await sensorModel.findOneById(sensorId)
        if (existSensor) {
            const getData = await sensorDataModel.getDataByQuery(sensorId, status, query, type)
            return getData
        } else {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sensor not found')
        }
        // return getData
    } catch (error) {
        throw error
    }
}

const getPzemData = async (sensorId) => {
    try {
        const existSensor = await sensorModel.findOneById(sensorId)
        if (existSensor) {
            const getData = await sensorDataModel.getPzemDataById(sensorId)
            console.log("Service getPzemData: ", getData)
            return getData
        } else {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sensor not found')
        }
        // return getData
    } catch (error) {
        throw error
    }
}

export const sensorDataService = {
    getDataById,
    getDataByHour,
    getDataByQuery,
    getPzemData,
    getChartData
}