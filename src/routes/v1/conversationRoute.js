import express from 'express'
const Route = express.Router()

Route.route('/')
    .get(() => {console.log("Conversation")})
    .post()

export const conversationRoute = Route