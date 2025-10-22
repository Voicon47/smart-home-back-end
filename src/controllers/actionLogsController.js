import { StatusCodes } from 'http-status-codes'
import { actionLogsService } from '~/services/actionLogsService'


const createNew = async (req, res, next) => {
  try {
    const createdActionLogs = await actionLogsService.createNew(req.body)
    res.status(StatusCodes.OK).json(createdActionLogs)
  } catch (error) {
    next(error)
  }
}
export const actionLogsController = {
  createNew

}