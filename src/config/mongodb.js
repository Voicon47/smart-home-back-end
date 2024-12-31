
import {MongoClient, ServerApiVersion} from 'mongodb'
import { env } from './environment'
let smartHomeDatabaseInstance = null
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const mongoClientInstance = new MongoClient(env.MONGODB_URI,{
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})
// Connect to database
export const CONNECT_DB = async() => {
    await mongoClientInstance.connect()
    smartHomeDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
}

export const GET_DB = () => {
    if(!smartHomeDatabaseInstance) throw new Error('Must connect to database first!')
        return smartHomeDatabaseInstance
}

export const CLOSE_DB = async () => {
    await mongoClientInstance.close()
}