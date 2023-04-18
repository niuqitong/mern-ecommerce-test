const request = require('supertest');
const app = require('../../app'); // Import the app instance from app.js

describe('Sample test for a specific route', () => {
  test('should return a 200 status and a JSON object with a message', async () => {
    const response = await request(app).get('/api/brand/list');

    expect(response.status).toBe(200);
  });
});


