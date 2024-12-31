
import express from 'express'
import { CONNECT_DB, GET_DB, CLOSE_DB } from '~/config/mongodb'
import exitHook from 'async-exit-hook'
import { env } from './config/environment'
import { APIs_V1 } from './routes/v1/index'
const START_SERVER = () => {
  const app = express()

  const hostname = 'localhost'
  const port = 8017
  console.log('2.Connected to MongoDB Cloud Atlas')

  app.use(express.json())
  app.use('/v1',APIs_V1)
  
  app.listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`3.Hello ${env.AUTHOR}, I am running at ${ hostname }:${ port }/`)
  })

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
