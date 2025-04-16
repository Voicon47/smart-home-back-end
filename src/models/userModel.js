import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
// import { sensorModel } from './sensorModel';

//Define Collection (Name & SCheme)

const USER_COLLECTION_NAME = 'users'
const USER_COLLECTION_SCHEME = Joi.object({
    userName: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        // .required()
        .trim()
        .strict(),

    password: Joi.string()
        .required()
        .trim()
        .strict(), // Password: at least 1 uppercase, 1 lowercase, 1 number, 8-30 chars.

    email: Joi.string()
        .email()
        .required()
        .trim()
        .strict(), // Email validation.

    fullName: Joi.string()
        // .pattern(/^[\p{L}\p{M}\s'.-]+$/u) // Supports Vietnamese and other Unicode letters
        .min(2)
        .max(50)
        .trim()
        .strict()
        .optional()
        .default(null),

    phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .optional()
        .trim()
        .strict()
        .default(null), // Optional phone number in E.164 format.

    imgUrl: Joi.string()
        .uri()
        .optional()
        .trim()
        .strict()
        .default(null), // Optional URL for profile picture.

    status: Joi.string()
        .valid('active', 'inactive', 'banned')
        .default('active')
        .trim()
        .strict(), // Status with a default value.

    role: Joi.string()
        .valid('user', 'admin', 'moderator')
        .default('user')
        .trim()
        .strict(), // Role with a default value.
    
    createdAt: Joi.date().timestamp('javascript').default(Date.now),

    updatedAt: Joi.date().timestamp('javascript').default(null),
    ///columnOrder: Join.array().items(Join.string()).default([])
    _destroy: Joi.boolean().default(false)
});

const validateBeforeCreate = async (data) => {
    return await USER_COLLECTION_SCHEME.validateAsync(data, {abortEarly: false})
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        console.log('Valid data: ',validData)

        const createdUser = await GET_DB().collection(USER_COLLECTION_NAME).insertOne(validData)
        return createdUser
    } catch (error) {
        // console.log(error)
        throw new Error(error) 
    }
}

const findOneById = async (id) => {
    try {
        const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({
            _id: new ObjectId(String(id))
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}
const findOneByEmail = async (id) => {
    try {
        const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({
            email: id,
            _destroy: false
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}
const getAllUsersByQuery = async (query) => {
    
    try {
        const matchStage = {
            status: "active",
            _destroy: false
        };

        // If query is provided, apply search filters
        if (query && query.trim() !== "") {
            matchStage.$or = [
                { userName: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { fullName: { $regex: query, $options: "i" } },
                { phone: { $regex: query, $options: "i" } }
            ];
        }

        const result = await GET_DB()
            .collection(USER_COLLECTION_NAME)
            .aggregate([
                { $match: matchStage },
                { $sort: { createAt: -1 } }, // Sort by most recent
                { $limit: 20 } // Limit results for pagination
            ])
            .toArray(); // Convert cursor to an array

        return result;
    } catch (error) {
        throw new Error(error)
    }
}
const getDetails = async (id) => {
    
    try {
        const result = await GET_DB().collection(USER_COLLECTION_NAME).findOne({
            _id: new ObjectId(String(id))
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}
// const loginUser = async(email, password) => {
//     try {
        
//     } catch (error) {
//         throw new Error(error)
//     }
// }

export const userModel = {
    USER_COLLECTION_NAME,
    USER_COLLECTION_SCHEME,
    createNew,
    findOneById,
    getAllUsersByQuery,
    getDetails,
    findOneByEmail
}
