import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

const ROOM_COLLECTION_NAME = 'rooms'
const ROOM_COLLECTION_SCHEME = Joi.object({
  homeId: Joi.string()
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
  _destroy: Joi.boolean().default(false)

});

const validateBeforeCreate = async (data) => {
  return await ROOM_COLLECTION_SCHEME.validateAsync(data, { abortEarly: false })
}
const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    // console.log('Valid data: ',validData)

    const newDeviceToAdd = {
      ...validData,
      roomId: new ObjectId(String(validData.roomId))
    }

    const createdDevice = await GET_DB().collection(ROOM_COLLECTION_NAME).insertOne(newDeviceToAdd)
    return createdDevice
  } catch (error) {
    throw new Error(error)
  }
}


export const roomModel = {
  ROOM_COLLECTION_NAME,
  ROOM_COLLECTION_SCHEME,
  createNew
}