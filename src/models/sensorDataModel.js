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
    createdAt: Joi.date()
        .timestamp('javascript')
        .default(Date.now),

    temperature: Joi.number()
        .precision(2)
        .optional()
        .allow(null)
        .default(null), // Optional field for DHT11.

    humidity: Joi.number()
        .precision(2)
        .optional()
        .allow(null)
        .default(null), // Optional field for DHT11.

    mq2: Joi.number()
        .precision(2)
        .optional()
        .allow(null)
        .default(null), // Optional field for MQ-2.

    flame: Joi.number()
        .optional()
        .allow(null) // Optional field for Flame sensor.
        .custom((value) => {
            // Convert the flame value according to the logic
            return value === 1 ? false : true; // Flame detected (1 -> false)
            // No flame detected (0 -> true)
        })
        .default(null),

    pir: Joi.boolean()
        .optional()
        .allow(null)
        .default(null), // Optional field for PIR sensor (TRUE/FALSE).
    _destroy: Joi.boolean().default(false)
});
const validateBeforeCreate = async (data) => {
    return await SENSOR_DATA_COLLECTION_SCHEME.validateAsync(data, {abortEarly: false})
}

const createNew = async (data) => {
    try {
        const validData = await validateBeforeCreate(data)
        // console.log('Valid data: ',validData)

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
const getDataByYear = async (sensorId,type,year,month,day) => {
    try {
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).aggregate([

            {
                $match: { 
                    sensorId: new ObjectId(String(sensorId)) ,
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
const getDataByMonth = async (sensorId,type,year,month,day) => {
    try {
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).aggregate([

            {
                $match: { 
                    sensorId: new ObjectId(String(sensorId)) ,
                    createdAt: {
                        $gte: new Date(year, month - 1, 1).getTime(), // Start of the day in milliseconds
                        $lt: new Date(year, month - 1, 31).getTime() // Start of the next day in milliseconds
                    }
                }
            },
            {
                // Step 1: Group by the hour extracted directly from the timestamp
                $group: {
                    _id: {
                        day: {
                            $dateToString: {
                                format: "%d", // Extract hour in 24-hour format
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
                    _id: 0,
                    day: { $toInt: "$_id.day" }, // Convert hour string to integer
                    date: {
                        $concat: [
                            year.toString(), "-",
                            month.toString().padStart(2, "0"), "-",
                            day.toString().padStart(2, "0")
                        ]
                    },
                    
                    temperatureValue: { $round: ["$temperatureValue", 2] }, // Round to 2 decimal places
                    count: 1
                }
            },
            {
            // Step 2: Sort the results by hour (optional)
            $sort: { day: 1 }
            }
        ]).toArray();
        console.log(result)
        return result
    } catch (error) {
        throw new Error(error)
    }
}

// [
//     {
//         "count": 368,
//         "date": "2025-1-9",
//         "temperatureValue": 30.81
//     },
//     {
//         "count": 7,
//         "date": "2025-1-10",
//         "temperatureValue": 29.8
//     }
// ]
const getDataByDay = async (sensorId,type,year,month,day) => {
    try {
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).aggregate([
            {
                $match: { 
                    sensorId: new ObjectId(String(sensorId)) ,
                    createdAt: {
                        $gte: new Date(year, month - 1, day).getTime(), // Start of the day in milliseconds
                        $lt: new Date(year, month - 1, day + 1).getTime() // Start of the next day in milliseconds
                    }
                }
            },
            {
                // Step 1: Group by the hour extracted directly from the timestamp
                $group: {
                    _id: {
                        hour: {
                            $dateToString: {
                                format: "%H", // Extract hour in 24-hour format
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
                    _id: 0,
                    hour: { $toInt: "$_id.hour" }, // Convert hour string to integer
                    date: {
                        $concat: [
                            year.toString(), "-",
                            month.toString().padStart(2, "0"), "-",
                            day.toString().padStart(2, "0")
                        ]
                    },
                    
                    temperatureValue: { $round: ["$temperatureValue", 2] }, // Round to 2 decimal places
                    count: 1
                }
            },
            {
            // Step 2: Sort the results by hour (optional)
            $sort: { hour: 1 }
            }
        ]).toArray();

        // switch (type) {
        //     case "DHT11":
        //         break;
        //     case "MQ-2":
        //         break;
        //     case "FLAME":
                
        //         break;
        //     default:
            
        // }
        console.log(result)
        return result
    } catch (error) {
        throw new Error(error)
    }
}

const getDataByHour = async (sensorId,type,year,month,day) => {
    try {
        // Get current time
        const currentTime = Date.now();

        // Calculate time window (15 minutes before current time)
        const timeWindow = currentTime - (15 * 60 * 1000);

        // Query MongoDB to find records for the given sensorId within the time window
        const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).find({
            sensorId: new ObjectId(String(sensorId)) ,
            createdAt: { $gte: timeWindow, $lte: currentTime }
        });

        // const result = await GET_DB().collection(SENSOR_DATA_COLLECTION_NAME).aggregate([
        //     {
        //         $match: { 
        //             sensorId: new ObjectId(String(sensorId)) ,
        //             createdAt: {
        //                 $gte: new Date(year, month - 1, day, hour, minute - 15).getTime(), // Start of the day in milliseconds
        //                 $lt: new Date(year, month - 1, day, hour, minute ).getTime() // Start of the next day in milliseconds
        //             }
        //         }
        //     },
            
        //     {
        //     // Step 2: Sort the results by hour (optional)
        //     $sort: { hour: 1 }
        //     }
        // ]).toArray();

        // switch (type) {
        //     case "DHT11":
        //         break;
        //     case "MQ-2":
        //         break;
        //     case "FLAME":
                
        //         break;
        //     default:
            
        // }
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
    getDataByYear,
    getDataByMonth,
    getDataByDay,
    getDataByHour,
    createNew
}

