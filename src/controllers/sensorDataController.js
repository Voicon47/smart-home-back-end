import { StatusCodes } from 'http-status-codes'
import { sensorDataService } from '~/services/sensorDataService'

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
const getDataById = async (req, res, next) => {
    try {
        const sensorId = req.params.id 
        // console.log(sensorId)
        const data = await sensorDataService.getDataById(sensorId)
        
        res.status(StatusCodes.OK).json(data)
    } catch (error) {
        next(error)
    }
}
const getDataByQuery = async (req, res, next) => {
    try {
         
        console.log(req.body)
        const {sensorId, status, query} = req.body
        const data = await sensorDataService.getDataByQuery(sensorId, status, query)
        // const data = await sensorDataService.getDataById(sensorId)
        
        res.status(StatusCodes.OK).json(data)
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

export const sensorDataController = {
    createNew,
    getDataById,
    getDataByQuery,
    getDataByHour,
    getDetails
}