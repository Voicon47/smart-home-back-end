import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { userRoute } from './userRoute'
import { sensorDataRoute } from './sensorData'

const Router = express.Router()

Router.get('/status',(req, res) => {
    res.status(StatusCodes.OK).json({ message: 'APIs V1 are ready to use.'})
})

Router.use('/users', userRoute)
Router.use('/sensorData', sensorDataRoute)
export const APIs_V1 = Router