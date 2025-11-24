import Joi from 'joi'
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
// import ApiError from '~/utils/ApiError';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';

//Define Collection (Name & SCheme)

const SENSOR_DATA_COLLECTION_NAME = 'sensor_data'
const SENSOR_DATA_COLLECTION_SCHEME = Joi.object({
    sensorId: Joi.string()
        .required()
        .pattern(OBJECT_ID_RULE)
        .message(OBJECT_ID_RULE_MESSAGE),

    type: Joi.string()
        // .required(
        .valid('DHT11', 'MQ2', 'PIR', 'FLAME') // tùy bạn mở rộng
        .messages({
            'any.only': 'sensor_type không hợp lệ'
        }),

    attribute: Joi.string()
        .required()
        .valid(
            'DHT11',
            'mq2',
            'motion',
            'flame'
        ) // tùy bạn mở rộng
        .messages({
            'any.only': 'attribute không hợp lệ'
        }),

    // value: Joi.number()
    //     .allow(null)
    //     .messages({
    //         'string.base': 'value phải là string'
    //     }),
    value: Joi.alternatives().try(
        Joi.number(),
        Joi.object({
            temperature: Joi.number().allow(null),
            humidity: Joi.number().allow(null),
            mq2: Joi.number().allow(null),
            motion: Joi.number().allow(null),
            flame: Joi.number().allow(null),
        })
    ),
    createdAt: Joi.number()
        // .timestamp('javascript')
        .default(Date.now),

    _destroy: Joi.boolean().default(false)
});

const validateBeforeCreate = async (data) => {
    return await SENSOR_DATA_COLLECTION_SCHEME.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        // console.log('Valid data: ', validData)

        const newSensorDataToAdd = {
            ...validData,
            sensorId: new ObjectId(String(validData.sensorId))
        }
        // console.log('newSensorDataToAdd data: ',newSensorDataToAdd)
        const createdUser = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).insertOne(newSensorDataToAdd)
        return createdUser
    } catch (error) {
        throw new Error(error)
    }
}
const findOneByName = async (nameSensor) => {
    try {
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).findOne({
            name: nameSensor
        })
        // console.log(result)
        return result
    } catch (error) {
        throw new Error(error)
    }
}
const findOneById = async (id) => {
    try {
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).findOne({
            _id: new ObjectId(String(id))
        })
        return result
    } catch (error) {
        throw new Error(error)
    }
}
const getDataById = async (id) => {
    try {
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).find({
            sensorId: new ObjectId(String(id))
        })
        console.log(result.toArray())
        return result.toArray()
    } catch (error) {
        throw new Error(error)
    }
}
const getDataByQuery = async (sensorId, status, query) => {
    try {
        const queryString = query ? String(query) : null;

        // Base match stage for the new structure
        const matchStage = {
            sensorId: new ObjectId(String(sensorId)),
            _destroy: false
        };

        // If user searches something
        if (queryString) {
            matchStage.$or = [
                { type: { $regex: queryString, $options: "i" } },
                { attribute: { $regex: queryString, $options: "i" } },
                { createdAt: { $regex: queryString, $options: "i" } },
                // // Search numeric fields in value object or single number
                // ...(isNumberQuery ? [
                //   { "value.temperature": numericQuery },
                //   { "value.humidity": numericQuery },
                //   { "value.mq2": numericQuery },
                //   { "value.motion": numericQuery },
                //   { "value.flame": numericQuery },
                //   { value: numericQuery } // for single number
                // ] : [
                { "value.temperature": { $regex: queryString, $options: "i" } },
                { "value.humidity": { $regex: queryString, $options: "i" } },
                { "value.mq2": { $regex: queryString, $options: "i" } },
                { "value.motion": { $regex: queryString, $options: "i" } },
                { "value.flame": { $regex: queryString, $options: "i" } }
                // ])
            ];
        }

        const result = await GET_DB()
            .collection(SENSOR_DATA_COLLECTION_NAME)
            .aggregate([
                {
                    // Convert fields to string for regex search and formatting
                    $addFields: {
                        // value: { $toString: "$value" },
                        createdAtDate: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: { $toDate: "$createdAt" },
                                timezone: "Asia/Ho_Chi_Minh"
                            }
                        },
                        createdAtTime: {
                            $dateToString: {
                                format: "%H:%M:%S",
                                date: { $toDate: "$createdAt" },
                                timezone: "Asia/Ho_Chi_Minh"
                            }
                        }
                    }
                },
                { $match: matchStage },
                { $sort: { timestamp: -1 } },
                { $limit: 5 }
            ])
            .toArray();

        return result;
    } catch (error) {
        throw new Error(error);
    }
};


const getDataByYear = async (sensorId, type, year, month, day) => {
    try {
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).aggregate([

            {
                $match: {
                    sensorId: new ObjectId(String(sensorId)),
                    createdAt: {
                        $gte: new Date(year, 0).getTime(), // Start of the day in milliseconds
                        $lt: new Date(year, 11).getTime() // Start of the next day in milliseconds
                    }
                }
            },
            {
                // Step 1: Group by the hour extracted directly from the timestamp
                $group: {
                    _id: {
                        month: {
                            $dateToString: {
                                format: "%m", // Extract hour in 24-hour format
                                date: { $toDate: "$createdAt" },
                                timezone: "Asia/Ho_Chi_Minh" // Vietnam time zone
                            }
                        }
                    },
                    temperatureValue: { $avg: "$temperature" }, // Calculate the average of "value"
                    count: { $sum: 1 } // Optional: Count the number of documents
                }
            },
            {
                $project: {
                    // _id: {$toInt:"$_id.month"},
                    // _id: null,
                    month: { $toInt: "$_id.month" }, // Convert hour string to integer
                    date: {
                        $concat: [
                            year.toString(), "-",
                            month.toString().padStart(2, "0"),
                            day.toString().padStart(2, "0")
                        ]
                    },

                    temperatureValue: { $round: ["$temperatureValue", 2] }, // Round to 2 decimal places
                    count: 1
                }
            },
            {
                // Step 2: Sort the results by hour (optional)
                $sort: { month: 1 }
            }
        ]).toArray();
        console.log(result)
        return result
    } catch (error) {
        throw new Error(error)
    }
}
const getDataByWeek = async (sensorId, year, month, day) => {
    try {
        // Convert input to Date
        const targetDate = new Date(year, month - 1, day);

        // Calculate start (Monday) and end (Sunday) of the week
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...
        const diffToMonday = (dayOfWeek + 6) % 7; // Distance back to Monday
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(0, 0, 0, 0);

        const result = await GET_DB()
            .collection(SENSOR_DATA_COLLECTION_NAME)
            .aggregate([
                {
                    $match: {
                        sensorId: new ObjectId(String(sensorId)),
                        createdAt: {
                            $gte: startOfWeek.getTime(),
                            $lt: endOfWeek.getTime()
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            day: {
                                $dateToString: {
                                    format: "%Y-%m-%d",
                                    date: { $toDate: "$createdAt" },
                                    timezone: "Asia/Ho_Chi_Minh"
                                }
                            }
                        },
                        temperatureValue: { $avg: "$temperature" },
                        humidityValue: { $avg: "$humidity" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        labels: "$_id.day",
                        temperature: { $round: ["$temperatureValue", 2] },
                        humidity: { $round: ["$humidityValue", 2] }
                    }
                },
                {
                    $sort: { labels: 1 }
                }
            ])
            .toArray();

        console.log(result);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};
const getDataByDay = async (sensorId, year, month) => {
    try {
        // Define the start and end of the month
        const startOfMonth = new Date(year, month - 1, 1).getTime();
        const endOfMonth = new Date(year, month, 1).getTime();

        const result = await GET_DB()
            .collection(SENSOR_DATA_COLLECTION_NAME)
            .aggregate([
                {
                    $match: {
                        sensorId: new ObjectId(String(sensorId)),
                        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
                    }
                },
                {
                    // Group by day
                    $group: {
                        _id: {
                            day: {
                                $dateToString: {
                                    format: "%d",
                                    date: { $toDate: "$createdAt" },
                                    timezone: "Asia/Ho_Chi_Minh"
                                }
                            }
                        },
                        temperatureValues: {
                            $avg: "$value.temperature"
                        },
                        humidityValues: {
                            $avg: "$value.humidity"
                        },
                    }
                },
                {
                    $project: {
                        _id: 0,
                        labels: {
                            $concat: [
                                year.toString(), "-",
                                month.toString().padStart(2, "0"), "-",
                                "$_id.day"
                            ]
                        },
                        temperature: {
                            $round: [
                                "$temperatureValues",
                                2
                            ]
                        },
                        humidity: {
                            $round: [
                                "$humidityValues",
                                2
                            ]
                        },
                    }
                },
                { $sort: { labels: 1 } }
            ])
            .toArray();

        console.log(result);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};
// const getDataByDay = async (sensorId, year, month) => {
//     try {
//         // Define the start and end of the month
//         const startOfMonth = new Date(year, month - 1, 1).getTime();
//         const endOfMonth = new Date(year, month, 1).getTime();

//         const result = await GET_DB()
//             .collection(SENSOR_DATA_COLLECTION_NAME)
//             .aggregate([
//                 {
//                     $match: {
//                         sensorId: new ObjectId(String(sensorId)),
//                         createdAt: { $gte: startOfMonth, $lt: endOfMonth }
//                     }
//                 },
//                 {
//                     // Group by day
//                     $group: {
//                         _id: {
//                             day: {
//                                 $dateToString: {
//                                     format: "%d",
//                                     date: { $toDate: "$createdAt" },
//                                     timezone: "Asia/Ho_Chi_Minh"
//                                 }
//                             }
//                         },
//                         temperatureValues: {
//                             $avg: {
//                                 $cond: [
//                                     { $isArray: { $objectToArray: "$value" } }, // value is object
//                                     "$value.temperature",
//                                     null
//                                 ]
//                             }
//                         },
//                         humidityValues: {
//                             $avg: {
//                                 $cond: [
//                                     { $isArray: { $objectToArray: "$value" } }, // value is object
//                                     "$value.humidity",
//                                     null
//                                 ]
//                             }
//                         },
//                     }
//                 },
//                 {
//                     $project: {
//                         _id: 0,
//                         labels: {
//                             $concat: [
//                                 year.toString(), "-",
//                                 month.toString().padStart(2, "0"), "-",
//                                 "$_id.day"
//                             ]
//                         },
//                         temperature: {
//                             $round: [
//                                 { $avg: { $filter: { input: "$temperatureValues", as: "v", cond: { $ne: ["$$v", null] } } } },
//                                 2
//                             ]
//                         },
//                         humidity: {
//                             $round: [
//                                 { $avg: { $filter: { input: "$humidityValues", as: "v", cond: { $ne: ["$$v", null] } } } },
//                                 2
//                             ]
//                         },
//                     }
//                 },
//                 { $sort: { labels: 1 } }
//             ])
//             .toArray();

//         console.log(result);
//         return result;
//     } catch (error) {
//         throw new Error(error);
//     }
// };


const getDataByHour = async (sensorId, year, month, day) => {
    try {
        // Define the time range for the whole day
        const startOfDay = new Date(year, month - 1, day);
        const endOfDay = new Date(year, month, day); // next day start
        // console.log(startOfMonth, endOfMonth)
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).aggregate([
            {
                $match: {
                    sensorId: new ObjectId(String(sensorId)),
                    createdAt: {
                        $gte: startOfDay.getTime(), // Start of the month in milliseconds
                        $lt: endOfDay.getTime() // Start of the next month in milliseconds
                    }
                }
            },
            {
                // Step 1: Group by the hour extracted directly from the timestamp
                $group: {
                    _id: {
                        hour: {
                            $dateToString: {
                                format: "%H", // Extract  format
                                date: { $toDate: "$createdAt" },
                                timezone: "Asia/Ho_Chi_Minh" // Vietnam time zone
                            }
                        }
                    },
                    temperatureValue: { $avg: "$temperature" }, // Calculate the average of "value"
                    humidityValue: { $avg: "$humidity" }, // Calculate the average of "value"
                    // count: { $sum: 1 } // Optional: Count the number of documents
                }
            },
            {
                $project: {
                    _id: 0,
                    // hour: { $toInt: "$_id.hour" }, // Convert hour string to integer
                    // day: { $toInt: "$_id.day" },
                    labels: {
                        $concat: [
                            "$_id.hour", ":00 ",
                            { $toString: day }, "/",
                            { $toString: month }
                        ]
                    },

                    temperature: { $round: ["$temperatureValue", 2] }, // Round to 2 decimal places
                    humidity: { $round: ["$humidityValue", 2] },
                }
            },
            {
                // Step 2: Sort the results by day (optional)
                $sort: { labels: 1 }
            }
        ]).toArray();

        console.log(result)
        return result
    } catch (error) {
        throw new Error(error)
    }
}

export const sensorDataModel = {
    SENSOR_DATA_COLLECTION_NAME,
    SENSOR_DATA_COLLECTION_SCHEME,
    findOneByName,
    findOneById,
    getDataById,
    getDataByQuery,
    getDataByYear,
    getDataByWeek,
    getDataByDay,
    getDataByHour,
    createNew
}

// const matchStage = {
//     sensorId: new ObjectId(String(sensorId)),
//     _destroy: false
// };
// console.log(query)
// // Add $or condition only if query is provided
// if (query) {
//     const numericQuery = parseFloat(query); // Convert query to number if possible

//     matchStage.$or = [
//         { mq2: !isNaN(numericQuery) ? numericQuery : { $regex: query, $options: "i" } },
//         { temperature: !isNaN(numericQuery) ? numericQuery : { $regex: query, $options: "i" } },
//         { humidity: !isNaN(numericQuery) ? numericQuery : { $regex: query, $options: "i" } },
//         { flame: !isNaN(numericQuery) ? numericQuery : { $regex: query, $options: "i" } },
//         { pir: !isNaN(numericQuery) ? numericQuery : { $regex: query, $options: "i" } },
//         { createdAt: !isNaN(numericQuery) ? numericQuery : { $regex: query, $options: "i" } }
//     ];
// }
// const result = await GET_DB()
// .collection(SENSOR_DATA_COLLECTION_NAME)
// .aggregate([
//     { $match: matchStage },
//     { $sort: { createdAt: -1 } }
// ])
// .toArray();

// const result = await GET_DB()
//     .collection(SENSOR_DATA_COLLECTION_NAME)
//     .aggregate([
//         { $match: matchStage },
//         { $sort: { createdAt: -1 } }
//     ])
//     .toArray();