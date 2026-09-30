import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Part 1: API Integration Tests', () => {
  let userId: number;

  beforeEach(async () => {
    const response = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
      });

    expect(response.status).toBe(201);
    userId = response.body.id;
  });

  // TODO: Student implementation - Part 1: Integration Testing
  // Test user creation (POST /users)
  it('creates a user', async () => {
    const response = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({
        name: 'Another Test User',
        email: `another-${Date.now()}@example.com`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Another Test User');
  });

  // Test ticket creation (POST /tickets)
  it('creates a ticket', async () => {
    const response = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({
        title: 'Test Ticket',
        description: 'Created during integration testing',
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Ticket');
    expect(response.body.creator_id).toBe(userId);
  });

  // Test auth middleware rejection (401 when X-User-Id is missing or invalid)
  it('rejects a POST request without authentication', async () => {
    const response = await request(app).post('/tickets').send({
      title: 'Unauthorized Ticket',
      description: 'This should not be created',
    });

    expect(response.status).toBe(401);
  });

  // Test 404 responses for non-existent users and tickets
  it('returns 404 for a non-existent user', async () => {
    const response = await request(app).get('/users/99999999');

    expect(response.status).toBe(404);
  });

  it('returns 404 for a non-existent ticket', async () => {
    const response = await request(app).get('/tickets/99999999');

    expect(response.status).toBe(404);
  });

  // Test pagination and filtering on GET /tickets
  it('supports pagination on GET /tickets', async () => {
    await request(app).post('/tickets').set('X-User-Id', String(userId)).send({
      title: 'Pagination Ticket 1',
      description: null,
    });

    await request(app).post('/tickets').set('X-User-Id', String(userId)).send({
      title: 'Pagination Ticket 2',
      description: null,
    });

    const response = await request(app).get('/tickets?limit=2&offset=0');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('supports filtering tickets by status', async () => {
    await request(app).post('/tickets').set('X-User-Id', String(userId)).send({
      title: 'TODO Ticket',
      description: 'Ticket for filtering test',
    });

    const response = await request(app).get('/tickets?status=TODO');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);

    for (const ticket of response.body) {
      expect(ticket.status).toBe('TODO');
    }
  });
});
