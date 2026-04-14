const request = require('supertest');
const app = require('../server');
require('./setup');

// Helper: register and get token
async function getAuthToken(overrides = {}) {
  const userData = {
    username: overrides.username || 'testuser',
    email: overrides.email || 'test@example.com',
    password: overrides.password || 'password123',
  };

  const res = await request(app).post('/api/auth/register').send(userData);
  return { token: res.body.token, user: res.body.user };
}

// Helper: create a resource
async function createResource(token, overrides = {}) {
  const data = {
    title: overrides.title || 'Test Resource',
    description: overrides.description || 'A detailed description for testing purposes.',
    category: overrides.category || 'Backend',
    difficulty: overrides.difficulty || 'Beginner',
    link: overrides.link || 'https://example.com',
    tags: overrides.tags || 'node,express',
    rating: overrides.rating || '4',
  };

  return request(app)
    .post('/api/resources')
    .set('Authorization', `Bearer ${token}`)
    .field('title', data.title)
    .field('description', data.description)
    .field('category', data.category)
    .field('difficulty', data.difficulty)
    .field('link', data.link)
    .field('tags', data.tags)
    .field('rating', data.rating);
}

describe('Resource CRUD Endpoints', () => {
  let token;

  beforeEach(async () => {
    const auth = await getAuthToken();
    token = auth.token;
  });

  describe('POST /api/resources', () => {
    it('should create a resource with valid data', async () => {
      const res = await createResource(token);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Resource');
      expect(res.body.data.category).toBe('Backend');
      expect(res.body.data.tags).toEqual(['node', 'express']);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.owner).toBeDefined();
    });

    it('should reject creation without auth token', async () => {
      const res = await request(app)
        .post('/api/resources')
        .field('title', 'No Auth')
        .field('description', 'Should fail without token')
        .field('category', 'Backend')
        .field('difficulty', 'Beginner')
        .field('rating', '3');

      expect(res.statusCode).toBe(401);
    });

    it('should reject resource with invalid category', async () => {
      const res = await createResource(token, { category: 'InvalidCat' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject resource with title too short', async () => {
      const res = await createResource(token, { title: 'AB' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/resources', () => {
    it('should return empty array when no resources exist', async () => {
      const res = await request(app).get('/api/resources');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.totalResources).toBe(0);
    });

    it('should return paginated resources', async () => {
      await createResource(token, { title: 'Resource One' });
      await createResource(token, { title: 'Resource Two' });

      const res = await request(app).get('/api/resources?page=1&limit=1');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.totalResources).toBe(2);
      expect(res.body.totalPages).toBe(2);
    });

    it('should filter by category', async () => {
      await createResource(token, { title: 'Backend Resource', category: 'Backend' });
      await createResource(token, { title: 'AI Resource', category: 'AI' });

      const res = await request(app).get('/api/resources?category=AI');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('AI');
    });

    it('should search by title', async () => {
      await createResource(token, { title: 'Node.js Guide', tags: 'javascript' });
      await createResource(token, { title: 'Python Tutorial', tags: 'python' });

      const res = await request(app).get('/api/resources?search=Node');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Node.js Guide');
    });
  });

  describe('GET /api/resources/:id', () => {
    it('should return a single resource by ID', async () => {
      const created = await createResource(token);
      const id = created.body.data._id;

      const res = await request(app).get(`/api/resources/${id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(id);
    });

    it('should return 400 for invalid ObjectId', async () => {
      const res = await request(app).get('/api/resources/invalidid123');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('should return 404 for non-existent resource', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/resources/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/resources/:id', () => {
    it('should update own resource', async () => {
      const created = await createResource(token);
      const id = created.body.data._id;

      const res = await request(app)
        .put(`/api/resources/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Updated Title')
        .field('description', 'An updated detailed description for testing.')
        .field('category', 'AI')
        .field('difficulty', 'Advanced')
        .field('link', 'https://updated.example.com')
        .field('rating', '5')
        .field('tags', 'updated,tags');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.category).toBe('AI');
    });
  });

  describe('DELETE /api/resources/:id', () => {
    it('should delete own resource', async () => {
      const created = await createResource(token);
      const id = created.body.data._id;

      const res = await request(app)
        .delete(`/api/resources/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's gone
      const check = await request(app).get(`/api/resources/${id}`);
      expect(check.statusCode).toBe(404);
    });
  });
});
