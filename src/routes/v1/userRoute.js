import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userController } from '~/controllers/userController'
import { userValidation } from '~/validations/userValidation'

const Router = express.Router()

Router.route('/')
    .get()
    .post(userValidation.createNew, userController.createNew)
Router.route('/search')
    .get()
    .post(userController.getAllUsersByQuery)
    
Router.route('/:id')
    .get(userController.getDetails)
    .put()
export const userRoute = Router