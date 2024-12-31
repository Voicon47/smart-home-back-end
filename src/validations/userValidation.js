import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'

const createNew = async (req, res, next) => {
    const correctCondition = Joi.object({
        userName: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            "string.alphanum": "Username must contain only letters and numbers.",
            "string.min": "Username must be at least 3 characters long.",
            "string.max": "Username must not exceed 30 characters.",
            "any.required": "Username is required.",
            "string.empty": "Username is not allowed to be empty"
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
    })
    try {
        await correctCondition.validateAsync(req.body, {abortEarly: false})
        next()
        
    } catch (error) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            errors: new Error(error).message
        })
    }
    
}

export const userValidation = {
    createNew
}