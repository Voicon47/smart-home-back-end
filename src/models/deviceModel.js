import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

const DEVICE_COLLECTION_NAME = 'devices'
const DEVICER_COLLECTION_SCHEME = Joi.object({
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
    status: Joi.boolean().default(false),
    type: Joi.string()
        .valid('DHT11', 'MQ-2', 'FLAME', 'PIR', 'OTHER')
        .required(), // Enum type validation.
    _destroy: Joi.boolean().default(false)
        
});

const getAllDevices = async() => {
    try {
        const result = await GET_DB().collection(DEVICE_COLLECTION_NAME).find()
        return result.toArray()
    } catch (error) {
        throw new Error(error)
    }
}

const getDeviceById = async(id) => {
    try {
        const result = await GET_DB().collection(DEVICE_COLLECTION_NAME).findOne({
            _id: new ObjectId(String(id))
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}
export const deviceModel = {
    DEVICER_COLLECTION_SCHEME,
    DEVICE_COLLECTION_NAME,
    getAllDevices,
    getDeviceById
}