import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
    try {
        console.log(req.body)
        throw new ApiError(StatusCodes.BAD_REQUEST,'Elephant47 test error')
        //res.status(StatusCodes.CREATED).json({ message: 'POST from Controller: API create new user'})
    } catch (error) {
        next(error)
    }
}

export const userController = {
    createNew
}