import { StatusCodes } from 'http-status-codes'
import { deviceService } from '~/services/deviceService'

const getAllDevice = async (req, res, next) => {
    try {
        const devices = await deviceService.getAllDevices()
        res.status(StatusCodes.OK).json(devices)
    } catch (error) {
        next(error)
    }
}

const createNewSchedule = async (req, res, next) => {
    try {
        // const {deviceId, startTime, endTime, dayActive} = req.body
        // console.log(deviceId,startTime,endTime,dayActive)
        const createdSchedule = await deviceService.createNewSchedule(req.body)
        res.status(StatusCodes.OK).json(createdSchedule)
    } catch (error) {
        next(error)
    }
}

const getAllScheduleByRoom = async (req, res, next) => {
    try {
        const schedules = await deviceService.getAllScheduleByRoom()
        res.status(StatusCodes.OK).json(schedules)
    } catch (error) {
        next(error)
    }
}
export const deviceController = {
    getAllDevice,
    createNewSchedule,
    getAllScheduleByRoom

}