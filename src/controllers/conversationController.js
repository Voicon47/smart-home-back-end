import { StatusCodes } from 'http-status-codes'
// import { deviceService } from '~/services/deviceService'

const getConversation = async (req, res, next) => {
    try {
        const devices = await conversationService.getConservation()
        res.status(StatusCodes.OK).json(devices)
    } catch (error) {
        next(error)
    }
}

export const conservationController = {
    getConversation,

}