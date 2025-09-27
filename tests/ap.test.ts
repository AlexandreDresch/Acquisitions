import request from 'supertest'
import app from '../src/app'

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return status OK with timestamp and uptime', async () => {
      const response = await request(app).get('/health').expect(200)

      expect(response.body).toHaveProperty('status', 'OK')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
    })
  })

  describe('GET /nonexistent', () => {
    it('should return 404 for nonexistent endpoint', async () => {
      const response = await request(app).get('/nonexistent').expect(404)

      expect(response.body).toHaveProperty('message', 'Endpoint not found')
    })
  })
})
