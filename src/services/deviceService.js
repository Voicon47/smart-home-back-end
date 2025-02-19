import { StatusCodes } from 'http-status-codes'
import { deviceModel } from '~/models/deviceModel'
const getAllDevices = async() => {
    try {
        const devices = deviceModel.getAllDevices() 
        if(!devices){
            throw new ApiError(StatusCodes.NOT_FOUND,'Device not found!')
        }
        return devices
    } catch (error) {
        throw error
    }
}

export const deviceService = {
    getAllDevices,
}