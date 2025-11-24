import express from 'express'
import { roomController } from '~/controllers/roomController'
const Router = express.Router()
Router.route('/:id')
  .get(roomController.getRoomByUser)
  .post()

export const roomRoute = Router