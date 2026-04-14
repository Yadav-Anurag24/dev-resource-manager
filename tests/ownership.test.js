const request = require('supertest');
const app = require('../server');
require('./setup');

// Helper: register and get token + user
async function registerUser(username, email) {
  const res = await request(app).post('/api/auth/register').send({
    username,
    email,
    password: 'password123',
  });
  return { token: res.body.token, user: res.body.user };
}

// Helper: create a resource
async function createResource(token, title) {
  const res = await request(app)
    .post('/api/resources')
    .set('Authorization', `Bearer ${token}`)
    .field('title', title || 'Ownership Test Resource')
    .field('description', 'A detailed description for ownership testing.')
    .field('category', 'Backend')
    .field('difficulty', 'Beginner')
    .field('link', 'https://example.com')
    .field('rating', '3');

  return res.body.data;
}

describe('Resource Ownership & Authorization', () => {
  let userA, userB;

  beforeEach(async () => {
    userA = await registerUser('userA', 'a@example.com');
    userB = await registerUser('userB', 'b@example.com');
  });

  describe('Update authorization', () => {
    it('should allow owner to update their resource', async () => {
      const resource = await createResource(userA.token, 'UserA Resource');

      const res = await request(app)
        .put(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .field('title', 'Updated by Owner')
        .field('description', 'Updated description by the resource owner.')
        .field('category', 'Backend')
        .field('difficulty', 'Beginner')
        .field('link', 'https://example.com')
        .field('rating', '4');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Updated by Owner');
    });

    it('should reject User B from updating User A resource (403)', async () => {
      const resource = await createResource(userA.token, 'UserA Resource');

      const res = await request(app)
        .put(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .field('title', 'Hijacked Title')
        .field('description', 'Trying to hijack the resource description.')
        .field('category', 'Backend')
        .field('difficulty', 'Beginner')
        .field('link', 'https://example.com')
        .field('rating', '1');

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not authorized/i);
    });
  });

  describe('Delete authorization', () => {
    it('should allow owner to delete their resource', async () => {
      const resource = await createResource(userA.token, 'To Be Deleted');

      const res = await request(app)
        .delete(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject User B from deleting User A resource (403)', async () => {
      const resource = await createResource(userA.token, 'Protected Resource');

      const res = await request(app)
        .delete(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${userB.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not authorized/i);
    });
  });

  describe('Unauthenticated access', () => {
    it('should reject create without auth token (401)', async () => {
      const res = await request(app)
        .post('/api/resources')
        .field('title', 'No Auth Resource')
        .field('description', 'Trying to create without being logged in.')
        .field('category', 'Backend')
        .field('difficulty', 'Beginner')
        .field('link', 'https://example.com')
        .field('rating', '2');

      expect(res.statusCode).toBe(401);
    });

    it('should reject update without auth token (401)', async () => {
      const resource = await createResource(userA.token, 'Auth Required');

      const res = await request(app)
        .put(`/api/resources/${resource._id}`)
        .field('title', 'Unauthorized Update')
        .field('description', 'Trying to update without being logged in.')
        .field('category', 'Backend')
        .field('difficulty', 'Beginner')
        .field('link', 'https://example.com')
        .field('rating', '1');

      expect(res.statusCode).toBe(401);
    });

    it('should reject delete without auth token (401)', async () => {
      const resource = await createResource(userA.token, 'Auth Required');

      const res = await request(app)
        .delete(`/api/resources/${resource._id}`);

      expect(res.statusCode).toBe(401);
    });

    it('should allow GET (read) without auth', async () => {
      await createResource(userA.token, 'Public Resource');

      const res = await request(app).get('/api/resources');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });
});
