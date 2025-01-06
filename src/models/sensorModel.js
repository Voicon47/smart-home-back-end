import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

//Define Collection (Name & SCheme)

const SENSOR_COLLECTION_NAME = 'sensors'
const SENSOR_COLLECTION_SCHEME = Joi.object({
    roomId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),
    name: Joi.string()
        .max(100)
        .required()
        .trim()
        .strict(), // Sensor name, max 100 chars.

    type: Joi.string()
        .valid('DHT11', 'MQ-2', 'Flame', 'PIR', 'Other')
        .required(), // Enum type validation.
});

export const sensorModel = {
    SENSOR_COLLECTION_NAME,
    SENSOR_COLLECTION_SCHEME
}
