import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API responses
const handlers = [
  // Authentication endpoints
  rest.post('/api/login', (req, res, ctx) => {
    const { email, password } = req.body;
    
    if (email === 'chp1@mms.org' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          access_token: 'valid.jwt.token',
          token_type: 'bearer',
          user: {
            id: 1,
            email: 'chp1@mms.org',
            role: 'chp'
          }
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        detail: 'Incorrect email or password'
      })
    );
  }),

  rest.post('/api/logout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Logged out successfully' })
    );
  }),

  // Pill detection endpoints
  rest.post('/api/upload', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        pill_count: 25,
        confidence: 0.85,
        detections: [
          { x: 100, y: 100, width: 50, height: 50, confidence: 0.9 }
        ]
      })
    );
  }),

  // Records endpoints
  rest.get('/api/records', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          patient_id: 'PAT001',
          supplement_id: 'IRON001',
          pill_count: 25,
          confidence: 0.85,
          source: 'ai',
          created_at: '2024-01-01T00:00:00Z'
        }
      ])
    );
  }),

  rest.post('/api/records', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 2,
        ...req.body,
        created_at: new Date().toISOString()
      })
    );
  }),

  // Patients endpoints
  rest.get('/api/patients', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'PAT001',
          name: 'John Doe',
          age: 30,
          gender: 'male',
          phone: '1234567890',
          address: '123 Main St'
        }
      ])
    );
  }),

  // Supplements endpoints
  rest.get('/api/supplements', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'IRON001',
          name: 'Iron Supplement',
          barcode: 'IRON001',
          description: 'Iron supplement for anemia'
        }
      ])
    );
  }),

  rest.get('/api/supplements/:barcode', (req, res, ctx) => {
    const { barcode } = req.params;
    
    if (barcode === 'IRON001') {
      return res(
        ctx.status(200),
        ctx.json({
          id: 'IRON001',
          name: 'Iron Supplement',
          barcode: 'IRON001',
          description: 'Iron supplement for anemia'
        })
      );
    }
    
    return res(
      ctx.status(404),
      ctx.json({ detail: 'Supplement not found' })
    );
  }),

  // Analytics endpoints
  rest.get('/api/analytics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        total_records: 100,
        ai_count: 80,
        manual_count: 20,
        average_confidence: 0.85,
        daily_counts: [
          { date: '2024-01-01', count: 10 },
          { date: '2024-01-02', count: 15 }
        ]
      })
    );
  }),

  // Health check endpoint
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ status: 'healthy' })
    );
  }),

  // Error handlers
  rest.all('*', (req, res, ctx) => {
    console.warn(`No handler found for ${req.method} ${req.url}`);
    return res(
      ctx.status(404),
      ctx.json({ detail: 'Not found' })
    );
  }),
];

export const server = setupServer(...handlers);
