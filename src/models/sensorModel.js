import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

//Define Collection (Name & SCheme)

const SENSOR_COLLECTION_NAME = 'sensors'
const SENSOR_COLLECTION_SCHEME = Joi.object({
    roomId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    name: Joi.string()
        .max(100)
        .required()
        .trim()
        .strict(), // Sensor name, max 100 chars.

    type: Joi.string()
        .valid('DHT11', 'MQ-2', 'FLAME', 'PIR', 'PZEM', 'OTHER')
        .required(), // Enum type validation.
    _destroy: Joi.boolean().default(false)

});
const validateBeforeCreate = async (data) => {
    return await SENSOR_COLLECTION_SCHEME.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        // console.log('Valid data: ',validData)

        const newSensorToAdd = {
            ...validData,
            roomId: new ObjectId(String(validData.roomId))
        }

        const createdUser = await GET_DB().collection(SENSOR_COLLECTION_NAME).insertOne(newSensorToAdd)
        return createdUser
    } catch (error) {
        throw new Error(error)
    }
}
const findOneByName = async (nameSensor) => {
    try {
        const result = await GET_DB().collection(SENSOR_COLLECTION_NAME).findOne({
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
        const result = await GET_DB().collection(SENSOR_COLLECTION_NAME).findOne({
            _id: new ObjectId(String(id))
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}
const getAllSensors = async () => {
    try {
        const result = await GET_DB().collection(SENSOR_COLLECTION_NAME).find()
        // console.log(result.)
        return result.toArray()
    } catch (error) {
        throw new Error(error)
    }
}
export const sensorModel = {
    SENSOR_COLLECTION_NAME,
    SENSOR_COLLECTION_SCHEME,
    findOneByName,
    findOneById,
    getAllSensors,
    createNew
}
