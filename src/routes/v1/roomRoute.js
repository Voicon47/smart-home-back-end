import express from 'express'
import { roomController } from '~/controllers/roomController'
const Router = express.Router()

Router.route('/')
  .get()
  .post(roomController.createNew)
Router.route('/search')
  .get(roomController.getAllRoomsByQuery)
Router.route('/:id')
  .get(roomController.getRoomByUser)
  .post()
  .delete(roomController.deleteRoomById)

export const roomRoute = Router