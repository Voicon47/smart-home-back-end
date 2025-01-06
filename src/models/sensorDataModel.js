import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

//Define Collection (Name & SCheme)

const SENSOR_DATA_COLLECTION_NAME = 'sensors_data'
const SENSOR_DATA_COLLECTION_SCHEME = Joi.object({
    sensorId: Joi.string()
            .required()
            .pattern(OBJECT_ID_RULE)
            .message(OBJECT_ID_RULE_MESSAGE),
    timestamp: Joi.date()
        .iso()
        .required(), // Timestamp in ISO format.

    temperature: Joi.number()
        .precision(2)
        .optional()
        .allow(null), // Optional field for DHT11.

    humidity: Joi.number()
        .precision(2)
        .optional()
        .allow(null), // Optional field for DHT11.

    gasConcentration: Joi.number()
        .precision(2)
        .optional()
        .allow(null), // Optional field for MQ-2.

    flameIntensity: Joi.number()
        .precision(2)
        .optional()
        .allow(null), // Optional field for Flame sensor.

    motionDetected: Joi.boolean()
        .optional()
        .allow(null), // Optional field for PIR sensor (TRUE/FALSE).
});

export const SensorDataModel = {
    SENSOR_DATA_COLLECTION_NAME,
    SENSOR_DATA_COLLECTION_SCHEME
}