// tests/backend/projects.test.ts
// MultiSaaS — Project API Tests

import request from 'supertest'
import app from '../../backend/src/app'

const MOCK_TOKEN = 'Bearer mock-test-token'

// Mock auth middleware for tests
jest.mock('../../backend/src/middleware/auth', () => ({
  ...jest.requireActual('../../backend/src/middleware/auth'),
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user', email: 'test@example.com', role: 'OWNER' }
    next()
  },
}))

describe('GET /api/projects', () => {
  it('returns list of projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', MOCK_TOKEN)
      .expect(200)

    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
  })
})

describe('GET /api/projects/:id/revenue', () => {
  it('returns revenue data for mock project', async () => {
    const res = await request(app)
      .get('/api/projects/mock-1/revenue')
      .set('Authorization', MOCK_TOKEN)
      .expect(200)

    expect(res.body.data).toHaveProperty('monthly')
    expect(res.body.data).toHaveProperty('summary')
    expect(res.body.source).toBe('mock')
  })
})

describe('GET /api/projects/:id/expenses', () => {
  it('returns expense data for mock project', async () => {
    const res = await request(app)
      .get('/api/projects/mock-1/expenses')
      .set('Authorization', MOCK_TOKEN)
      .expect(200)

    expect(res.body.data).toHaveProperty('monthly')
    expect(res.body.data.monthly.length).toBe(12)
  })
})

describe('GET /api/dashboard/global', () => {
  it('returns aggregated global dashboard data', async () => {
    const res = await request(app)
      .get('/api/dashboard/global')
      .set('Authorization', MOCK_TOKEN)
      .expect(200)

    const { summary } = res.body.data
    expect(summary).toHaveProperty('totalMrr')
    expect(summary).toHaveProperty('totalArr')
    expect(summary.totalMrr).toBeGreaterThan(0)
  })
})

describe('Health check', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health').expect(200)
    expect(res.body.status).toBe('ok')
  })
})
