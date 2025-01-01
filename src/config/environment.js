import 'dotenv/config'

export const env = {
    MONGODB_URI: process.env.MONGODB_URI,
    DATABASE_NAME: process.env.DATABASE_NAME,

    APP_HOST: process.env.LOCAL_DEV_APP_HOST,
    APP_PORT: process.env.LOCAL_DEV_APP_PORT,

    BUILD_MODE: process.env.BUILD_MODE,

    AUTHOR: process.env.AUTHOR
}