import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'
// import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
    try {
        ///Navigate data to service 
        const createdUser = await userService.createNew(req.body)

        res.status(StatusCodes.CREATED).json(createdUser)
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

export const userController = {
    createNew,
    getDetails
}