import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

const NOTIFICATION_COLLECTION_NAME = 'notifications'
const NOTIFICATION_COLLECTION_SCHEME = Joi.object({
  roomId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  description: Joi.string()
    .max(100)
    .required()
    .trim()
    .strict(),
  status: Joi.string()
    .valid('Warning', 'Danger')
    .required(), // Enum type validation.
  createdAt: Joi.number()
    .default(Date.now),
  _destroy: Joi.boolean().default(false)

});

const validateBeforeCreate = async (data) => {
  return await NOTIFICATION_COLLECTION_SCHEME.validateAsync(data, { abortEarly: false })
}
const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    // console.log('Valid data: ',validData)

    const newLogToAdd = {
      ...validData,
    }

    const createdNotification = await GET_DB().collection(NOTIFICATION_COLLECTION_NAME).insertOne(newLogToAdd)
    return createdNotification
  } catch (error) {
    throw new Error(error)
  }
}

const getAllByRoomId = async (roomId) => {
  try {
    if (!OBJECT_ID_RULE.test(roomId)) {
      throw new Error(OBJECT_ID_RULE_MESSAGE);
    }

    const notifications = await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .find(
        { roomId: new ObjectId(String(roomId)), _destroy: false },
        { projection: { _id: 0, roomId: 1, description: 1, status: 1 } })
      .sort({ createdAt: -1 }) // mới nhất lên đầu
      .toArray();
    console.log('Notifications: ', notifications);
    return notifications;
  } catch (error) {
    throw new Error(error);
  }
};

export const notificationModel = {
  NOTIFICATION_COLLECTION_NAME,
  NOTIFICATION_COLLECTION_SCHEME,
  createNew,
  getAllByRoomId, // <- export the new function
};