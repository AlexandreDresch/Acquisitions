import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config()
dotenv.config({ path: resolve(process.cwd(), '.env.test') })
