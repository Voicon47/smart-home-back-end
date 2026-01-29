import { StatusCodes } from 'http-status-codes'
import { deviceModel } from '~/models/deviceModel'
import { deviceScheduleModel } from '~/models/deviceScheduleModel'
import { notificationModel } from '~/models/notificationModel'
import ApiError from '~/utils/ApiError'
const getAllNotifications = async (roomId) => {
  try {
    const notifications = notificationModel.getAllByRoomId(roomId)
    if (!notifications) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'notification not found!')
    }
    return notifications
  } catch (error) {
    throw error
  }
}


export const notificationService = {
  getAllNotifications,
}