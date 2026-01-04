import { StatusCodes } from 'http-status-codes'
import { deviceModel } from '~/models/deviceModel'
import { deviceScheduleModel } from '~/models/deviceScheduleModel'
import ApiError from '~/utils/ApiError'
const getAllDevices = async () => {
    try {
        const devices = deviceModel.getAllDevices()
        if (!devices) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Device not found!')
        }
        return devices
    } catch (error) {
        throw error
    }
}

const createNewSchedule = async (data) => {
    try {
        const { deviceId, startTime, endTime, dayActive } = data
        const existSchedule = await deviceScheduleModel.findScheduleByQuery(deviceId, startTime, endTime, dayActive)
        console.log(existSchedule)
        if (existSchedule) {
            throw new ApiError(StatusCodes.CONFLICT, "Schedule already exists")
        } else {
            const createdSchedule = await deviceScheduleModel.createNewSchedule(data)

            const getNewSchedule = await deviceScheduleModel.findOneById(createdSchedule.insertedId)

            return getNewSchedule
        }

    } catch (error) {
        throw error
    }
}

const getAllScheduleByRoom = async () => {
    try {
        const schedules = await deviceScheduleModel.getAllScheduleByRoom("677d0d50cc13de58fab8e379") // Suppose deviceId
        if (!schedules) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Shedule not found!')
        }
        return schedules
    } catch (error) {
        throw error
    }
}
const createOrUpdateDevice = async (deviceData, roomId) => {
    const { id, type, name, status } = deviceData;

    const newDevice = {
        id: id,
        name: name,
        type, // Type of the sensor
        roomId, // Room ID associated with the sensor
        status
    };
    try {
        ///Check exist 
        const existDevice = await deviceModel.findOneById(newDevice.id)
        if (existDevice) {
            if (existDevice.status !== status) {
                // Update state
                const updatedDevice = await deviceModel.updateStateDevice(existDevice._id, status)
                return updatedDevice
            }
        } else {
            // Create new device
            const createdSensor = await deviceModel.createNew(newDevice)
            return createdSensor
        }
    } catch (error) {
        throw error
    }
}
export const deviceService = {
    getAllDevices,
    createNewSchedule,
    getAllScheduleByRoom,
    createOrUpdateDevice
}