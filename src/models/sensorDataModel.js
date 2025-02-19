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
const getDataByQuery = async (sensorId, status, query) => {
    try {
        // Ensure query is always a string (if provided)
        const queryString = query ? String(query) : null;

        // Base match stage
        const matchStage = {
            sensorId: new ObjectId(String(sensorId)),
            _destroy: false
        };

        // If query exists, add regex filtering
        if (queryString) {
            matchStage.$or = [
                { mq2: { $regex: queryString, $options: "i" } },
                { temperature: { $regex: queryString, $options: "i" } },
                { humidity: { $regex: queryString, $options: "i" } },
                { flame: { $regex: queryString, $options: "i" } },
                { pir: { $regex: queryString, $options: "i" } },
                { createdAt: { $regex: queryString, $options: "i" } }
            ];
        }

        const result = await GET_DB()
            .collection(SENSOR_DATA_COLLECTION_NAME)
            .aggregate([
                // Convert numeric fields to string for regex matching
                { 
                    $addFields: { 
                        mq2: { $toString: "$mq2" },
                        temperature: { $toString: "$temperature" },
                        humidity: { $toString: "$humidity" },
                        flame: { $toString: "$flame" },
                        pir: { $toString: "$pir" },
                        createdAt: { $toString: "$createdAt" },
                        // Convert `createdAt` timestamp to Date and Time
                        createdAtDate: { 
                            $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" }, timezone: "Asia/Ho_Chi_Minh" }
                        },
                        createdAtTime: { 
                            $dateToString: { format: "%H:%M:%S", date: { $toDate: "$createdAt" }, timezone: "Asia/Ho_Chi_Minh" }
                        }
                    }
                },
                { $match: matchStage }, // Apply match conditions dynamically
                { $sort: { createdAt: -1 } },
                { $limit: 5}
            ])
            .toArray();

        console.log(result.length);
        return result;
    } catch (error) {
        throw new Error(error);
    }
};


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
    getDataByQuery,
    getDataByYear,
    getDataByMonth,
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