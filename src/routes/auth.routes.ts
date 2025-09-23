import express from 'express'
import { AuthController } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/sign-up', AuthController.signUp)

router.post('sign-in', (req, res) => {
  res.status(200).send('User signed in')
})

router.post('sign-out', (req, res) => {
  res.status(200).send('User signed out')
})

export default router
