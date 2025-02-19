import { StatusCodes } from 'http-status-codes'
import { deviceService } from '~/services/deviceService'

const getDevice = async (req, res, next) => {
    try {
        const devices = await deviceService.getDevice()
        res.status(StatusCodes.OK).json(devices)
    } catch (error) {
        next(error)
    }
}

export const deviceController = {
    getDevice,

}