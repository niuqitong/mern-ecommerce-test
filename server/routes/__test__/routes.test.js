const request = require('supertest');
const app = require('../../app'); // Import the app instance from app.js

describe('brand APIs test', () => {
  let token;
  test('should log in and receive token', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@gmeal.com', // Replace with valid email
        password: 'password' // Replace with valid password
      });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    token = loginResponse.body.token;
    console.log(token);
  });
  
  test('test GET on /api/brand/list', async () => {
    const response = await request(app).get('/api/brand/list');
    // console.log(response.body);

    expect(response.status).toBe(200);
  });

  test('test GET on /api/brand, admin or merchnat', async () => {
    const response = await request(app)
      .get('/api/brand') 
      .set('Authorization', `${token}`);

    expect(response.status).toBe(200);
    // console.log(response.body);
  });

  test('test GET on /api/brand/:id', async () => {
    const response = await request(app)
      .get('/api/brand/644185b81a3bb6581cf98054') 

    expect(response.status).toBe(200);
    // console.log(response.body);

    expect(response.body.brand.name).toBe('Google');
  });

  test('test GET on /api/brand/list/select, admin or merchant', async () => {
    const response = await request(app)
      .get('/api/brand/list/select') 
      .set('Authorization', `${token}`);

    expect(response.status).toBe(200);
    // expect(response.body.brands.length).toBe(7)
    // console.log(response.body.brands);

    // expect(response.body.brand.name).toBe('google');
  });

  test('test PUT(edit) on /api/brand/:id, admin or merchant', async () => {
    const brandData = {
          name: 'GooGle',
          slug: 'google',
          description: "Pixel"
        };
    const response = await request(app)
      .put('/api/brand/644185b81a3bb6581cf98054') 
      .set('Authorization', `${token}`)
      .send({brand: brandData});
    console.log(response.body);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true)
    const brandData1 = {
      name: 'Google',
      slug: 'google',
      description: "Pixel"
    };
    const response1 = await request(app)
      .put('/api/brand/644185b81a3bb6581cf98054') 
      .set('Authorization', `${token}`)
      .send({brand: brandData1});

    expect(response1.status).toBe(200);
    expect(response1.body.success).toBe(true)
    // expect(response.body.brand.name).toBe('google');
  });

  test('test PUT(edit active) on /api/brand/:id/active, admin or merchant', async () => {
    const brandData = {
          isActive: false
        };
    const response = await request(app)
      .put('/api/brand/644185b81a3bb6581cf98054') 
      .set('Authorization', `${token}`)
      .send({brand: brandData});
    console.log(response.body);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true)
    const response1 = await request(app)
      .get('/api/brand/644185b81a3bb6581cf98054') 

    expect(response1.status).toBe(200);
    // console.log(response.body);

    expect(response1.body.brand.isActive).toBe(false);

    const brandData1 = {
      isActive: true
    };
    const response2 = await request(app)
      .put('/api/brand/644185b81a3bb6581cf98054') 
      .set('Authorization', `${token}`)
      .send({brand: brandData1});
    console.log(response.body);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true)

    const response3 = await request(app)
      .get('/api/brand/644185b81a3bb6581cf98054') 

    expect(response3.status).toBe(200);
    // console.log(response.body);

    expect(response3.body.brand.isActive).toBe(true);

    // expect(response.body.brand.name).toBe('google');
  });

  let added_id;

  test('test add brands on POST at /api/brand/add', async () => {
    const brandData = {
      name: 'oracle',
      description: 'mysql',
      isActive: true
    };

    const response = await request(app)
      .post('/api/brand/add') 
      .set('Authorization', `${token}`)
      .send(brandData);

    expect(response.status).toBe(200);
    console.log(response.body);
    added_id = response.body.brand._id;
    // expect(response.body).toMatchObject(brandData);
  });

  test('test delete brands on DELETE at /api/brand/delete/:id', async () => {
    const brandData = {
      name: 'oracle',
      description: 'mysql',
      isActive: true
    };

    const response = await request(app)
      .delete(`/api/brand/delete/${added_id}`) 
      .set('Authorization', `${token}`)
      .send(brandData);

    expect(response.status).toBe(200);
    console.log(response.body);
    // expect(response.body).toMatchObject(brandData);
  });

  

  
});


