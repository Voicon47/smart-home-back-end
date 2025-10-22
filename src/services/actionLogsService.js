import { StatusCodes } from 'http-status-codes'
import { actionLogsModel } from '~/models/actionLogsModel'
import ApiError from '~/utils/ApiError'

const createNew = async (data) => {
  try {
    const { deviceId, userId, state } = data
    const dataToAdd = {
      userId,
      deviceId,
      command: data.state
    }
    const createdLog = await actionLogsModel.createNew(dataToAdd)
    return createdLog
  } catch (error) {
    throw error
  }
}


export const actionLogsService = {
  createNew
}