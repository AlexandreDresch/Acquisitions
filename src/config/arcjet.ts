import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node'
import config from './config.ts'

const aj = arcjet({
  key: config.arcjetKey,
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
    }),
    slidingWindow({
      mode: 'LIVE',
      interval: '2s',
      max: 5,
    }),
  ],
})

export default aj
