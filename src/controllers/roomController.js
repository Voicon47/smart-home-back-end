import { StatusCodes } from 'http-status-codes'
import { roomModel } from '~/models/roomModel'
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

const getAllRoomsByQuery = async (req, res, next) => {
  try {
    const { query } = req.query
    console.log("Query", req.query)
    const rooms = await roomService.getAllRoomsByQuery(query)
    console.log(rooms)
    res.status(StatusCodes.OK).json(rooms)
  } catch (error) {
    next(error)
  }
}

const createNew = async (req, res, next) => {
  try {
    ///Navigate data to service 
    const createdRoom = await roomService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdRoom)
  } catch (error) {
    next(error)
  }
}

const deleteRoomById = async (req, res, next) => {
  try {
    ///Navigate data to service 
    const roomId = req.params.id
    const deletedRoom = await roomService.deleteRoomById(roomId)
    console.log(deleteRoomById)
    res.status(StatusCodes.OK).json(deletedRoom)
  } catch (error) {
    next(error)
  }
}

export const roomController = {
  getRoomByUser,
  createNew,
  createNewSchedule,
  getAllRoomsByQuery,
  getAllScheduleByRoom,
  deleteRoomById


}