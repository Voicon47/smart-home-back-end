import { StatusCodes } from "http-status-codes"
import { userModel } from "~/models/userModel"
import ApiError from "~/utils/ApiError"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { env } from "~/config/environment"
import admin from "~/config/firebase"
const saltRound = 10

const createNew = async (reqBody) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const existUser = await userModel.findOneByEmail(reqBody.email)
        if (existUser) {
            throw new ApiError(StatusCodes.CONFLICT, 'User exisst!')
        } else {
            const hashPassword = await bcrypt.hash(reqBody.password, saltRound);
            const newUser = {
                ...reqBody,
                password: hashPassword
            }
            //// Call to Model
            const createdUser = await userModel.createNew(newUser)
            // console.log(createdUser)
            ///Get data 
            const getNewUser = await userModel.findOneById(createdUser.insertedId)
            // console.log(getNewUser)
            return getNewUser
        }
    } catch (error) {
        throw error
    }
}

const getAllUsersByQuery = async (query) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const users = await userModel.getAllUsersByQuery(query)
        if (!users) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
        }
        return users
    } catch (error) {
        throw error
    }
}

const getDetails = async (userId) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const user = await userModel.getDetails(userId)
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
        }
        return user
    } catch (error) {
        throw error
    }
}

const loginUser = async (email, password) => {
    try {
        const user = await userModel.findOneByEmail(email)
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
        } else {
            const isMatchPassword = await bcrypt.compare(password, user.password)
            if (!isMatchPassword) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid password');

            const payload = {
                email: user.email
            }
            const accessToken = jwt.sign(
                payload,
                env.JWT_SECRET,
                {
                    expiresIn: env.JWT_EXPIRE
                }
            )
            const refreshToken = jwt.sign(
                payload,
                env.JWT_SECRET,
                {
                    expiresIn: '35d'
                }
            )
            //create token 
            console.log("Create token")
            return {
                status: 200,
                message: "Login successful",
                meta: {
                    accessToken,
                    refreshToken,
                },
                data: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName || "Guest",
                    role: user.role == "admin" ? 0 : 1
                }
            }
        }
    } catch (error) {
        throw error
    }
}
const loginUserWithGoogle = async (idToken) => {
    try {
        //1. Verify Firebase ID token
        // console.log("Begin google")
        const decoded = await admin.auth().verifyIdToken(idToken);
        // console.log(decoded);
        // const email = decoded.email;
        // const fullName = decoded.name || "Google User";
        // const imgUrl = decoded.picture || "";
        //2. Check if user already exists in MongoDb
        let user = await userModel.findOneByEmail(decoded.email);

        //3. create new User
        if (!user) {
            console.log("Begin create new user", user)
            const firebaseUid = decoded.uid;
            const newUser = {
                email: decoded.email,
                fullName: decoded.name || "Firebase User",
                imgUrl: decoded.picture || "",
                password: await bcrypt.hash(firebaseUid, saltRound), // placeholder, unused
            };
            console.log(newUser)
            const createdUser = await userModel.createNew(newUser);
            console.log("Having createUser")
            user = await userModel.findOneById(createdUser.insertedId);
        }
        console.log("Check end")
        return generateLoginFirebaseResponse(user);
    } catch (error) {
        throw error
    }
}
// Helper: JWT response
const generateLoginFirebaseResponse = (user) => {
    const payload = {
        email: user.email
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRE
    });

    const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: "35d"
    });

    return {
        status: 200,
        message: "Login successful",
        meta: {
            accessToken,
            refreshToken
        },
        data: {
            email: user.email,
            fullName: user.fullName,
            role: user.role === "admin" ? 0 : 1
        }
    };
};

export const userService = {
    createNew,
    getAllUsersByQuery,
    getDetails,
    loginUser,
    loginUserWithGoogle
}