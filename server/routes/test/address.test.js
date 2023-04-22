const request = require('supertest');
const app = require('../../app'); // Import the app instance from app.js

describe('Sample test for a specific route', () => {
  test('should return a 200 status and a JSON object with a message', async () => {
    const response = await request(app).get('/api/brand/list');
    console.log(response.body)

    expect(response.status).toBe(200);
  });
});

describe('Sample test for a logging in', () => {
  test('should login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password' });
    const token = response.body.token;
    console.log(response)
    console.log(token)
  });
});



// // Import your route modules here
// const addressRoute = require('../server/routes/api/address');

// // Use the route modules here
// app.use('/api/address', addressRoute);

// describe('Address API', () => {
//   let token;

//   beforeAll(async () => {
//     // Log in with a user account and get a JWT token
//     const response = await request(app)
//       .post('/api/auth/login')
//       .send({ email: 'user@example.com', password: 'password' });
//     token = response.body.token;
//     console.log(token)
//   });

//   test('POST /api/address/add should add a new address', async () => {
//     const newAddress = {
//       street: '123 Main St',
//       city: 'Anytown',
//       state: 'CA',
//       zip: '12345'
//     };

//     const response = await request(app)
//       .post('/api/address/add')
//       .send(newAddress)
//       .set('Authorization', `Bearer ${token}`);

//     expect(response.status).toBe(200);
//     expect(response.body.success).toBe(true);
//     expect(response.body.address.street).toBe('123 Main St');
//   });

// });
