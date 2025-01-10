import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

//Define Collection (Name & SCheme)

const SENSOR_DATA_COLLECTION_NAME = 'sensor_data'
const SENSOR_DATA_COLLECTION_SCHEME = Joi.object({
    sensorId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    createdAt: Joi.date()
        .timestamp('javascript')
        .default(Date.now),

    temperature: Joi.number()
        .precision(2)
        .optional()
        .allow(null)
        .default(null), // Optional field for DHT11.

    humidity: Joi.number()
        .precision(2)
        .optional()
        .allow(null)
        .default(null), // Optional field for DHT11.

    mq2: Joi.number()
        .precision(2)
        .optional()
        .allow(null)
        .default(null), // Optional field for MQ-2.

    flame: Joi.number()
        .optional()
        .allow(null) // Optional field for Flame sensor.
        .custom((value, helpers) => {
            // Convert the flame value according to the logic
            return value === 1 ? false : true; // Flame detected (1 -> false)
            // No flame detected (0 -> true)
        })
        .default(null),

    pir: Joi.boolean()
        .optional()
        .allow(null)
        .default(null), // Optional field for PIR sensor (TRUE/FALSE).
    _destroy: Joi.boolean().default(false)
});
const validateBeforeCreate = async (data) => {
    return await SENSOR_DATA_COLLECTION_SCHEME.validateAsync(data, {abortEarly: false})
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        // console.log('Valid data: ',validData)

        const newSensorDataToAdd = {
            ...validData,
            sensorId: new ObjectId(String(validData.sensorId))
        }
        // console.log('newSensorDataToAdd data: ',newSensorDataToAdd)
        const createdUser = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).insertOne(newSensorDataToAdd)
        return createdUser
    } catch (error) {
        throw new Error(error) 
    }
}
const findOneByName = async (nameSensor) => {
    try {
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).findOne({
            name: nameSensor
        })
        // console.log(result)
        return result
    } catch (error) {
        throw new Error(error)
    }
}
const findOneById = async (id) => {
    try {
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).findOne({
            _id: new ObjectId(String(id))
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}
export const sensorDataModel = {
    SENSOR_DATA_COLLECTION_NAME,
    SENSOR_DATA_COLLECTION_SCHEME,
    findOneByName,
    findOneById,
    createNew
}