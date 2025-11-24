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
        const { sensorId, status, query, type } = req.body
        const data = await sensorDataService.getDataByQuery(sensorId, status, query, type)
        // const data = await sensorDataService.getDataById(sensorId)

        res.status(StatusCodes.OK).json(data)
    } catch (error) {
        next(error)
    }
}
const getChartData = async (req, res, next) => {
    try {
        const { sensorId, year, month, day, type } = req.body;
        console.log(month)
        console.log("SensorId: ", sensorId, "Year: ", year, "Month: ", month, "Day: ", day, "Type: ", type)
        const data = await sensorDataService.getChartData("677faf7339a557ec6c1a9262", year, month, day, type)

        res.status(StatusCodes.OK).json(data)
    } catch (error) {
        next(error)
    }
}

export const sensorDataController = {
    createNew,
    getDataById,
    getDataByQuery,
    getChartData,
    getDetails
}