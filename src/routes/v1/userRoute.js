import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userController } from '~/controllers/userController'
import { userValidation } from '~/validations/userValidation'

const Router = express.Router()

Router.route('/register')
    .get()
    .post(userValidation.createNew, userController.createNew)
Router.route('/login')
    .get()
    .post(userController.loginUser)
    Router.route('/login-google')
    .get()
    .post(userController.loginUserWithGoogle)
Router.route('/search')
    .get()
    .post(userController.getAllUsersByQuery)

Router.route('/:id')
    .get(userController.getDetails)
    .put()
export const userRoute = Router