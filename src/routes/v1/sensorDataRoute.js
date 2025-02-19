import express from 'express'
import { sensorDataController } from '~/controllers/sensorDataController'
// import { StatusCodes } from 'http-status-codes'
import { sensorDataValidation } from '~/validations/sensorDataValidation'
// import { userValidation } from '~/validations/userValidation'

const Router = express.Router()

// Router.route('/')
//     // .post(sensorDataValidation.createNew, sensorDataController.createNew)

Router.route('/')
    .get(sensorDataController.getDataByHour)
    .post(sensorDataController.getDataByQuery)
Router.route('/:id')
    .get(sensorDataController.getDataById)
export const sensorDataRoute = Router