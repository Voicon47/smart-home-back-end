import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import { env } from '~/config/environment'

// export const authHandlingMiddleware = (req, res, next) => {
//     const white_list = ["/", "/register", "/login", "/login-google", "/sensorData", "/sensorData/chartData", "/sensor"]
//     if (white_list.find(value => '/v1/user' + value === req.originalUrl || '/v1' + value === req.originalUrl)) {
//         next()
//     } else {
//         if (req?.headers?.authorization?.split(' ')?.[1]) {
//             const token = req.headers.authorization.split(' ')?.[1]

//             const decode = jwt.verify(token, env.JWT_SECRET)
//             console.log("Decode: ", decode)
//             next()
//         } else {
//             return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token not found!" })
//         }
//     }

// }
export const authHandlingMiddleware = (req, res, next) => {
    const white_list = [
        "/",
        "/register",
        "/login",
        "/login-google",
        "/sensorData",
        "/sensor",
        "/room",
        "/notification"
    ];
    // if (
    //     req.headers.upgrade?.toLowerCase() === 'websocket' ||
    //     req.originalUrl.startsWith('/ws')
    // ) {
    //     return next();
    // }
    const url = req.originalUrl.replace('/v1', '');
    console.log("URL: ", url);
    const isWhitelisted = white_list.some(wl => url.startsWith(wl));

    if (isWhitelisted) {
        return next();
    }



    // Authentication
    const token = req.headers.authorization?.split(' ')?.[1];
    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token not found!" });
    }

    try {
        const decode = jwt.verify(token, env.JWT_SECRET);
        console.log("Decode: ", decode);
        next();
    } catch (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token!" });
    }
}
