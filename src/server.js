
import express from 'express'
import cors from 'cors'
import { CONNECT_DB, GET_DB, CLOSE_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from './config/environment'
import { APIs_V1 } from './routes/v1/index'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'

const START_SERVER = () => {
  const app = express()

  ///Cors handling
  app.use(cors(corsOptions))
  console.log('2.Connected to MongoDB Cloud Atlas')

  //Enable req.body json data
  app.use(express.json())
  
  //Use APIs v1
  app.use('/v1',APIs_V1)

  //Middleware
  app.use(errorHandlingMiddleware)

  // Production enviroment
  if(env.BUILD_MODE === 'production'){
    app.listen(process.env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`3.Prodcution: Hello ${env.AUTHOR}, I am running at Port:${ process.env.PORT }/`)
    })
  } else {
    ///Local dev enviroment
    app.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      // eslint-disable-next-line no-console
      console.log(`3.Local Dev: Hello ${env.AUTHOR}, I am running at ${ process.env.LOCAL_DEV_APP_HOST }:${ process.env.LOCAL_DEV_APP_PORT }/`)
    })
  }

  

  exitHook(() => {
    console.log(`Exit app`)
    console.log('4.Disconected from MongoDB Cloud Atlas....')
    CLOSE_DB()
    console.log('5.Disconected from MongoDB Cloud Atlas')
  })
}

CONNECT_DB()
  .then(() => console.log('1.Connecting to Mongo Atlas Cloud'))
  .then(() => START_SERVER())
  .catch(error => {
    console.error(error)
    // process.exit(0)
  })
