import { StatusCodes } from "http-status-codes"
import { userModel } from "~/models/userModel"
import ApiError from "~/utils/ApiError"

const createNew = async(reqBody) => {
    try {
        const newUser = {
            ...reqBody
        }
        //// Call to Model
        const createdUser = await userModel.createNew(newUser)
        // console.log(createdUser)
        ///Get data 
        const getNewUser = await userModel.findOneById(createdUser.insertedId)
        // console.log(getNewUser)
        return getNewUser
    } catch (error) {
        throw error
    }
}

const getDetails = async(userId) => {
    try {
        const user = await userModel.getDetails(userId)
        if(!user){
            throw new ApiError(StatusCodes.NOT_FOUND,'User not found!')
        }
        return user
    } catch (error) {
        throw error
    }
}
export const userService = {
    createNew,
    getDetails
}