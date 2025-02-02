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
    .put()
export const sensorDataRoute = Router