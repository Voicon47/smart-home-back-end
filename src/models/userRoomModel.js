import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';
import { roomModel } from './roomModel';

const USER_ROOM_COLLECTION_NAME = 'user_room'
const USER_ROOM_COLLECTION_SCHEME = Joi.object({
  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  roomId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  // name: Joi.string()
  //   .max(100)
  //   .required()
  //   .trim()
  //   .strict(), // Sensor name, max 100 chars.
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

    const createdDevice = await GET_DB().collection(USER_ROOM_COLLECTION_NAME).insertOne(newDeviceToAdd)
    return createdDevice
  } catch (error) {
    throw new Error(error)
  }
}


const getRoomByUser = async (id) => {
  try {
    const result = await GET_DB().collection(USER_ROOM_COLLECTION_NAME).aggregate([
      {
        $match: {
          userId: id,
          _destroy: false
        }
      },
      {
        $lookup: {
          from: roomModel.ROOM_COLLECTION_NAME,
          localField: "roomId",
          foreignField: "_id",
          as: "rooms"
        }
      },
      {
        $project: {
          rooms: {
            $map: {
              input: "$rooms",
              as: "room",
              in: {
                _id: "$$room._id",
                name: "$$room.name",
                homeId: "$$room.homeId",
              }
            }
          }
        }
      }

    ]).toArray()
    return result[0] || {}
  } catch (error) {
    throw new Error(error)
  }
}

export const userRoomModel = {
  USER_ROOM_COLLECTION_NAME,
  USER_ROOM_COLLECTION_SCHEME,
  getRoomByUser,
  createNew
}