import express from 'express'
import { deviceController } from '~/controllers/deviceController'
const Router = express.Router()
Router.route('/')
    .get(deviceController.getAllDevice)
    .post()
Router.route('/schedule')
    .get(deviceController.getAllScheduleByRoom)
    .post(deviceController.createNewSchedule)
export const deviceRoute = Router