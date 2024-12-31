import { StatusCodes } from 'http-status-codes'

const createNew = async (req, res, next) => {
    try {
        console.log(req.body)
        res.status(StatusCodes.CREATED).json({ message: 'POST from Controller: API create new user'})
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            errors: new Error(error).message
        })
    }
}

export const userController = {
    createNew
}