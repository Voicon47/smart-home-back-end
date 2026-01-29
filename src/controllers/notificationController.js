import { StatusCodes } from 'http-status-codes'
// import { notificationModel } from '~/models/notificationModel'
import { notificationService } from '~/services/notificationService'

const getAllNotification = async (req, res, next) => {
  try {
    const roomId = req.params.id
    console.log("RoomId:", roomId)
    const notifications = await notificationService.getAllNotifications(roomId)
    res.status(StatusCodes.OK).json(notifications)
  } catch (error) {
    next(error)
  }
}
export const notificationController = {
  getAllNotification,
  // createNewSchedule,
  // getAllScheduleByRoom

}