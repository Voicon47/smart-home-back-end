import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {

    const correctCondition = Joi.object({
        userName: Joi.string()
            .alphanum()
            .min(3)
            .max(30)
            // .required()
            .messages({
                "string.alphanum": "Username must contain only letters and numbers.",
                "string.min": "Username must be at least 3 characters long.",
                "string.max": "Username must not exceed 30 characters.",
            }),
        password: Joi.string()
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,30}$/)
            .required()
            .messages({
                "string.pattern.base":
                    "Password must be 8-30 characters long, include at least one uppercase letter, one lowercase letter, and one number.",
                "any.required": "Password is required.",
                "string.empty": "Password is not allowed to be empty"
            }),
        email: Joi.string()
            .email()
            .required()
            .trim()
            .strict()
            .messages({
                "string.email": "Please enter a valid email address.",
                "any.required": "Email is required.",
                "string.empty": "Email is not allowed to be empty"
            }), // Email validation.

    })
    try {
        // console.log("IN")
        console.log(req.body)
        await correctCondition.validateAsync(req.body, { abortEarly: false })
        next()

    } catch (error) {
        const errorMessage = new Error(error).message
        const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
        next(customError)
    }

}

export const userValidation = {
    createNew
}