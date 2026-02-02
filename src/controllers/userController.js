import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'
// import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
    try {
        ///Navigate data to service 
        console.log("Controller", req.body)
        const createdUser = await userService.createNew(req.body)

        res.status(StatusCodes.CREATED).json(createdUser)
    } catch (error) {
        next(error)
    }
}
const getAllUsersByQuery = async (req, res, next) => {
    try {
        console.log(req.body.query)
        const query = req.body.query
        const user = await userService.getAllUsersByQuery(query)
        res.status(StatusCodes.OK).json(user)
    } catch (error) {
        next(error)
    }
}

const getDetails = async (req, res, next) => {
    try {
        const userId = req.params.id
        const user = await userService.getDetails(userId)

        res.status(StatusCodes.OK).json(user)
    } catch (error) {
        next(error)
    }
}

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body
        const user = await userService.loginUser(email, password)

        res.status(StatusCodes.OK).json(user)
    } catch (error) {
        next(error)
    }
}

const loginUserWithGoogle = async (req, res, next) => {
    try {
        console.log(req.body.idToken)
        const user = await userService.loginUserWithGoogle(req.body.idToken)
        res.status(StatusCodes.OK).json(user)
    } catch (error) {
        next(error)
    }
}

const deleteUserById = async (req, res, next) => {
    try {
        ///Navigate data to service 
        const userId = req.params.id
        const deletedUser = await userService.deleteUserById(userId)
        console.log(deletedUser)
        res.status(StatusCodes.OK).json(deletedUser)
    } catch (error) {
        next(error)
    }
}

export const userController = {
    createNew,
    getAllUsersByQuery,
    getDetails,
    loginUser,
    loginUserWithGoogle,
    deleteUserById
}