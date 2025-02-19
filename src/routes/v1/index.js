import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoute } from './userRoute'
import { sensorDataRoute } from './sensorDataRoute'
import { sensorRoute } from './sensorRoute'
import { deviceRoute } from './deviceRoute'

const Router = express.Router()

Router.get('/status',(req, res) => {
    res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use.'})
})

Router.use('/user', userRoute)
Router.use('/sensorData', sensorDataRoute)
Router.use('/sensor', sensorRoute)
Router.use('/device',deviceRoute)
export const APIs_V1 = Router