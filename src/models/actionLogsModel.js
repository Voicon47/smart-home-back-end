import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

const ACTION_LOGS_COLLECTION_NAME = 'action_logs'
const ACTION_LOGS_COLLECTION_SCHEME = Joi.object({
    userId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    deviceId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    command: Joi.string()
        .max(100)
        .required()
        .trim()
        .strict(),
    createdAt: Joi.date().timestamp('javascript').default(Date.now),

});

const validateBeforeCreate = async (data) => {
    return await ACTION_LOGS_COLLECTION_SCHEME.validateAsync(data, { abortEarly: false })
}
const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        // console.log('Valid data: ',validData)

        const newLogToAdd = {
            ...validData,
            userId: new ObjectId(String(validData.userId)),
            deviceId: new ObjectId(String(validData.deviceId))
        }

        const createdDevice = await GET_DB().collection(ACTION_LOGS_COLLECTION_NAME).insertOne(newLogToAdd)
        return createdDevice
    } catch (error) {
        throw new Error(error)
    }
}


export const actionLogsModel = {
    ACTION_LOGS_COLLECTION_NAME,
    ACTION_LOGS_COLLECTION_SCHEME,
    createNew
}