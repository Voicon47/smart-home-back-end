import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoute } from './userRoute'
import { sensorDataRoute } from './sensorDataRoute'
import { sensorRoute } from './sensorRoute'

const Router = express.Router()

Router.get('/status',(req, res) => {
    res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use.'})
})

Router.use('/users', userRoute)
Router.use('/sensorData', sensorDataRoute)
Router.use('/sensor', sensorRoute)
export const APIs_V1 = Router