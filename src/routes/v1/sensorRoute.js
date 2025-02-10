import express from 'express'
import { sensorController } from '~/controllers/sensorController'
const Router = express.Router()

Router.route('/')
    .get(sensorController.getAllSensors)
    // .post(userValidation.createNew, userController.createNew)

export const sensorRoute = Router