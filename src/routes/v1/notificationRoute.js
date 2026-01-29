import express from 'express'
import { notificationController } from '~/controllers/notificationController'
const Router = express.Router()
Router.route('/:id')
  .get(notificationController.getAllNotification)
  .post()

export const notificationRoute = Router