import { StatusCodes } from 'http-status-codes'
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

export const roomService = {
  getRoomByUser,

}