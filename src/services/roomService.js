import { StatusCodes } from 'http-status-codes'
import { roomModel } from '~/models/roomModel'
import { userModel } from '~/models/userModel'
import { userRoomModel } from '~/models/userRoomModel'
import ApiError from '~/utils/ApiError'
const getRoomByUser = async (email) => {
  try {
    const user = await userModel.findOneByEmail(email)
    console.log("User", user)
    if (user) {
      const allRooms = await userRoomModel.getRoomByUser(user._id)
      // if (!rooms) {
      //   throw new ApiError(StatusCodes.NOT_FOUND, 'Rooms not found!')
      // }

      console.log("Rooms", allRooms)
      return allRooms
    } else {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Not found!')
    }
  } catch (error) {
    throw error
  }
}

const getAllRoomsByQuery = async (query) => {
  try {
    const rooms = await roomModel.getAllRoomsByQuery(query)
    if (!rooms) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Room found!')
    }
    return rooms
  } catch (error) {
    throw error
  }
}

const createNew = async (data) => {
  try {
    const existRoom = await roomModel.findRoomByName(data.name)
    if (existRoom) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Room existed")
    }
    const newRoom = {
      name: data.name,
      homeId: "677d0b16cc13de58fab8e372"
    }
    console.log("Service")
    const createdRoom = await roomModel.createNew(newRoom)
    const createdRoomFull = await roomModel.findRoomById(createdRoom._id)
    return createdRoomFull
  } catch (error) {
    throw error
  }
}


const deleteRoomById = async (roomId) => {
  try {
    const deletedRoom = await roomModel.deleteRoomById(roomId)
    console.log("Room Service: ", deletedRoom)
    if (!deletedRoom) {
      throw ApiError(StatusCodes.NOT_FOUND, "Room not found")
    }
    return deletedRoom
  } catch (error) {
    throw error
  }
}


export const roomService = {
  createNew,
  getRoomByUser,
  getAllRoomsByQuery,
  deleteRoomById

}