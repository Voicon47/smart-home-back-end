import { StatusCodes } from "http-status-codes"
import { userModel } from "~/models/userModel"
import ApiError from "~/utils/ApiError"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { env } from "~/config/environment"
const saltRound = 10

const createNew = async(reqBody) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const hashPassword = await bcrypt.hash(reqBody.password, saltRound);
        const newUser = {
            ...reqBody,
            password : hashPassword
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

const getAllUsersByQuery = async(query) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const users = await userModel.getAllUsersByQuery(query)
        if(!users){
            throw new ApiError(StatusCodes.NOT_FOUND,'User not found!')
        }
        return users
    } catch (error) {
        throw error
    }
}

const getDetails = async(userId) => {
    // eslint-disable-next-line no-useless-catch
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

const loginUser = async(email, password) => {
    try {
        const user = await userModel.findOneByEmail(email)
        if(!user){
            throw new ApiError(StatusCodes.NOT_FOUND,'User not found!')
        } else {
            const isMatchPassword = await bcrypt.compare(password, user.password)
            if(!isMatchPassword) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid password');
            
            const payload = {
                email: user.email
            }
            const accessToken = jwt.sign(
                payload,
                env.JWT_SECRET,
                {
                    expiresIn: env.JWT_EXPIRE
                }
            )
            const refreshToken = jwt.sign(
                payload,
                env.JWT_SECRET,
                {
                    expiresIn:'35d'
                }
            )
            //create token 
            console.log("Create token")
            return {
                status: 200,
                message: "Login successful",
                meta:{
                    accessToken,
                    refreshToken,
                },
                data : {
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role == "admin" ? 0 : 1
                }
            }
        }
    } catch (error) {
        throw error
    }
}

export const userService = {
    createNew,
    getAllUsersByQuery,
    getDetails,
    loginUser
}