import { StatusCodes } from 'http-status-codes'
import { sensorDataService } from '~/services/sensorDataService'
import { sensorService } from '~/services/sensorService'

const createNew = async (req, res, next) => {
    try {
        ///Navigate data to service 
        const createdUser = await sensorDataService.createNew(req.body)

        res.status(StatusCodes.CREATED).json(createdUser)
    } catch (error) {
        next(error)
    }
}
const getDetails = async (req, res, next) => {
    try {
        const sensorId = req.params.id 
        const user = await sensorDataService.getDetails(sensorId)

        res.status(StatusCodes.OK).json(user)
    } catch (error) {
        next(error)
    }
}

const getDataByHour = async (req, res, next) => {
    try {
        const sensorId = req.query.sensorId || null; // Default to null if not provided
        const year = req.query.year ? parseInt(req.query.year, 10) : 0;
        const month = req.query.month ? parseInt(req.query.month, 10) : 0;
        const day = req.query.day ? parseInt(req.query.day, 10) : 0;
        console.log(month)
        console.log("SensorId: ",sensorId,"Year: ", year, "Month: ",month,"Day: ", day)
        const data = await sensorDataService.getDataByHour(sensorId,year,month,day)

        res.status(StatusCodes.OK).json(data)
    } catch (error) {
        next(error)
    }
}

const getAllSensors = async (req, res, next) => {
    try {
        const sensors = await sensorService.getAllSensors()
        res.status(StatusCodes.OK).json(sensors)
    } catch (error) {
        next(error)
    }
}
export const sensorController = {
    getAllSensors
}