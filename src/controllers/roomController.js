import { StatusCodes } from 'http-status-codes'
import { roomService } from '~/services/roomService'
// import { roomService } from '~/services/roomService'


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
const getRoomByUser = async (req, res, next) => {
  try {
    const email = req.params.id
    // console.log("email:", email)
    const rooms = await roomService.getRoomByUser(email)
    console.log("Rooms in controller:", rooms)
    res.status(StatusCodes.OK).json(rooms)
  } catch (error) {
    next(error)
  }
}

export const roomController = {
  getRoomByUser,
  createNewSchedule,
  getAllScheduleByRoom,


}