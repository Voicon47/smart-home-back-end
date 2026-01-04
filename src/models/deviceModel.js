import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

const DEVICE_COLLECTION_NAME = 'devices'
const DEVICE_COLLECTION_SCHEME = Joi.object({
    roomId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    name: Joi.string()
        .max(100)
        .required()
        .trim()
        .strict(), // Sensor name, max 100 chars.
    // status: Joi.string()
    //     .valid('ACTIVE', 'INACTIVE', 'MAINTENANCE', '') // Optional improvement if using known statuses
    //     .optional(),
    state: Joi.boolean().default(false),
    type: Joi.string()
        .valid('LIGHT', 'FAN', 'OTHER')
        .required(), // Enum type validation.
    updatedAt: Joi.date().timestamp('javascript').default(null),
    _destroy: Joi.boolean().default(false)

});

const validateBeforeCreate = async (data) => {
    return await DEVICE_COLLECTION_SCHEME.validateAsync(data, { abortEarly: false })
}
const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        // console.log('Valid data: ',validData)

        const newDeviceToAdd = {
            ...validData,
            roomId: new ObjectId(String(validData.roomId))
        }

        const createdDevice = await GET_DB().collection(DEVICE_COLLECTION_NAME).insertOne(newDeviceToAdd)
        return createdDevice
    } catch (error) {
        throw new Error(error)
    }
}
const updateStateDevice = async (id, newState) => {
    try {
        const updatedDevice = await GET_DB().collection(DEVICE_COLLECTION_NAME).findOneAndUpdate(
            { _id: new ObjectId(String(id)) },
            {
                $set: {
                    status: newState,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' } // Return the updated document
        );
        return updatedDevice.value; // Return the updated document
    } catch (error) {
        throw new Error(error)
    }
}

const getAllDevices = async () => {
    try {
        const result = await GET_DB().collection(DEVICE_COLLECTION_NAME).find()
        return result.toArray()
    } catch (error) {
        throw new Error(error)
    }
}

const findOneById = async (id) => {
    try {
        const result = await GET_DB().collection(DEVICE_COLLECTION_NAME).findOne({
            _id: new ObjectId(String(id))
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}

const findOneByName = async (nameDevice) => {
    try {
        const result = await GET_DB().collection(DEVICE_COLLECTION_NAME).findOne({ name: nameDevice })
        return result
    } catch (error) {
        throw new Error(error)
    }
}

export const deviceModel = {
    DEVICE_COLLECTION_SCHEME,
    DEVICE_COLLECTION_NAME,
    getAllDevices,
    findOneById,
    findOneByName,
    updateStateDevice,
    createNew
}