import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';
import { deviceModel } from './deviceModel';

const DEVICE_SCHEDULE_COLLECTION_NAME = 'device_schedule'
const DEVICER_SCHEDULE_COLLECTION_SCHEME = Joi.object({
    deviceId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    startTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/) // Matches HH:mm 24-hour time format
        .required(),

    endTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/) // Matches HH:mm
        .required(),

    dayActive: Joi.array()
        .items(Joi.string().trim())
        .max(100)
        .required(),

    status: Joi.boolean().default(true),

    _destroy: Joi.boolean().default(false)
        
});
const validateBeforeCreate = async (data) => {
    return await DEVICER_SCHEDULE_COLLECTION_SCHEME.validateAsync(data, {abortEarly: false})
}
const findScheduleByQuery = async (deviceId, startTime, endTime, dayActive) => {
    try {
        const query = {
            deviceId: new ObjectId(String(deviceId)),
            startTime: startTime,             // must be "10:00"
            endTime: endTime,                 // must be "22:30"
            dayActive: { $in: dayActive }              // must be "Monday,Wednesday"
        };

        console.log("Query:", query);
        const result = await GET_DB().collection(DEVICE_SCHEDULE_COLLECTION_NAME).findOne(query)
        return result
    } catch (error) {
        throw new Error(error)
    }

}

const createNewSchedule = async (data) => {

    try {
        const validData = await validateBeforeCreate(data)

        const newScheduleToAdd = {
            ...validData,
            deviceId: new ObjectId(String(validData.deviceId))
        }
        const createdSchedule = await GET_DB().collection(DEVICE_SCHEDULE_COLLECTION_NAME).insertOne(newScheduleToAdd)
        return createdSchedule
    } catch (error) {
        throw new Error(error)
    }

}

const getAllScheduleByRoom = async (roomId) => {
    try {
        const result = await GET_DB().collection(deviceModel.DEVICE_COLLECTION_NAME).aggregate([
            {
                $match: {
                    roomId : new ObjectId(String(roomId)),
                    _destroy: false
                }
            },
            {
                $lookup: {
                  from: DEVICE_SCHEDULE_COLLECTION_NAME,          // name of schedule collection
                  localField: "_id",                // device._id
                  foreignField: "deviceId",         // schedule.deviceId
                  as: "schedules"
                }
              },
              {
                $project: {
                  name: 1,
                  type: 1,
                  status: 1,
                  roomId: 1,
                  schedules: 1
                }
              }

        ]).toArray()
        return result
    } catch (error) {
        throw new Error(error)
    }
}

const findOneById = async(scheduleId) => {
    try {
        const result = await GET_DB().collection(DEVICE_SCHEDULE_COLLECTION_NAME).findOne({
            _id : new ObjectId(String(scheduleId))
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}

export const deviceScheduleModel = {
    DEVICER_SCHEDULE_COLLECTION_SCHEME,
    DEVICE_SCHEDULE_COLLECTION_NAME,
    findScheduleByQuery,
    createNewSchedule,
    getAllScheduleByRoom,
    findOneById
}