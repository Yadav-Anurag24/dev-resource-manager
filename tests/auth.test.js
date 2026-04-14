const request = require('supertest');
const app = require('../server');
require('./setup');

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('testuser');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user.role).toBe('user');
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        username: 'user1',
        email: 'dup@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/register').send({
        username: 'user2',
        email: 'dup@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing username', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'notanemail',
        password: 'password123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('loginuser');
    });

    it('should reject wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nope@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
