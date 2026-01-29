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
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),

  _destroy: Joi.boolean().default(false)

});

const validateBeforeCreate = async (data) => {
  return await ROOM_COLLECTION_SCHEME.validateAsync(data, { abortEarly: false })
}
const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    console.log('Valid data: ', validData)

    const newRoomToAdd = {
      ...validData,
      homeId: new ObjectId(String(validData.homeId))
    }

    const createdRoom = await GET_DB().collection(ROOM_COLLECTION_NAME).insertOne(newRoomToAdd)
    console.log(createdRoom)
    return createdRoom
  } catch (error) {
    throw new Error(error)
  }
}

const findRoomById = async (roomId) => {
  try {
    const pipeline = [
      {
        $match: {
          _id: new ObjectId(String(roomId)),
          _destroy: false
        }
      },
      {
        $lookup: {
          from: 'homes',
          localField: 'homeId',
          foreignField: '_id',
          as: 'home'
        }
      },
      {
        $unwind: {
          path: '$home',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          homeName: '$home.name'
        }
      },
      { $limit: 1 }
    ]

    const result = await GET_DB()
      .collection(ROOM_COLLECTION_NAME)
      .aggregate(pipeline)
      .toArray()

    // trả về 1 object hoặc null
    return result[0]
  } catch (error) {
  }
}

const findRoomByName = async (roomName) => {
  try {
    const result = await GET_DB().collection(ROOM_COLLECTION_NAME).findOne({
      name: roomName,
      _destroy: false
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const deleteRoomById = async (roomId) => {
  try {
    const result = await GET_DB()
      .collection(ROOM_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(String(roomId)),
          _destroy: false
        },
        {
          $set: {
            _destroy: true,
            updatedAt: Date.now()
          }
        },
        {
          returnDocument: 'after'
        }
      )
    console.log(result)
    return result
  } catch (error) {
    throw new Error(error)
  }
}
const getAllRoomsByQuery = async (query) => {

  try {
    const searchText = String(query).trim()
    console.log(searchText)

    const pipeline = [
      // chỉ lấy room chưa bị xóa
      {
        $match: { _destroy: false }
      },

      // join homes
      {
        $lookup: {
          from: 'homes',
          localField: 'homeId',
          foreignField: '_id',
          as: 'home'
        }
      },

      // chuyển home từ array → object
      {
        $unwind: {
          path: '$home',
          preserveNullAndEmptyArrays: true
        }
      }
    ]

    // search theo room.name HOẶC home.name
    if (searchText !== '') {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: searchText, $options: 'i' } },        // room name
            { 'home.name': { $regex: searchText, $options: 'i' } }  // home name
          ]
        }
      })
    }

    // select field trả về
    pipeline.push(
      {
        $project: {
          _id: 1,
          name: 1,
          homeName: '$home.name'
        }
      },
      // { $sort: { createdAt: -1 } },
      { $limit: 20 }
    )

    const result = await GET_DB()
      .collection(ROOM_COLLECTION_NAME)
      .aggregate(pipeline)
      .toArray()
    console.log(result)
    return result
  } catch (error) {
    throw new Error(error)
  }
}
export const roomModel = {
  ROOM_COLLECTION_NAME,
  ROOM_COLLECTION_SCHEME,
  getAllRoomsByQuery,
  createNew,
  findRoomByName,
  findRoomById,
  deleteRoomById,
}