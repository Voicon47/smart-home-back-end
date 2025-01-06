import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userController } from '~/controllers/userController'
import { userValidation } from '~/validations/userValidation'

const Router = express.Router()

Router.route('/')
    .get((req, res) => {
        res.status(StatusCodes.OK).json({ message: 'GET from Validation: API get list users'})
    })
    .post(userValidation.createNew, userController.createNew)

Router.route('/:id')
    .get(userController.getDetails)
    .put()
export const userRoute = Router