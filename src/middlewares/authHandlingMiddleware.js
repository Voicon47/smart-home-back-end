import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { env } from '~/config/environment'

export const authHandlingMiddleware = (req, res, next) => {
    const white_list = ["/", "/register","/login","/login-google", "/sensorData", "/sensor"]
    if(white_list.find(value => '/v1/user' + value === req.originalUrl || '/v1' + value === req.originalUrl)) {
        next()
    } else {
        if(req?.headers?.authorization?.split(' ')?.[1]) {
            const token = req.headers.authorization.split(' ')?.[1]
            
            const decode = jwt.verify(token, env.JWT_SECRET)
            console.log("Decode: ", decode)
            next()
        } else {
            return res.status(StatusCodes.UNAUTHORIZED).json({message: "Token not found!"})
        }
    }
    
}