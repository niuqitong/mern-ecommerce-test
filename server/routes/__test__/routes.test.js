const request = require('supertest');
const app = require('../../app'); // Import the app instance from app.js
const Brand = require('../../models/brand'); // Import the Brand model

describe('brand APIs test', () => {
  let token;
  let original = {
    brands: [
      {
        isActive: true,
        merchant: [Object],
        _id: '643ed057d6da8e1305b3c9c8',
        name: 'samsung',
        description: 'samsung eletronnics',
        created: '2023-04-18T17:16:07.358Z',
        slug: 'samsung',
        __v: 0
      },
      {
        isActive: true,
        merchant: null,
        _id: '643ed0a9d6da8e1305b3c9ca',
        name: 'intel',
        description: 'processors',
        created: '2023-04-18T17:17:29.579Z',
        slug: 'intel',
        __v: 0
      },
      {
        isActive: true,
        merchant: null,
        _id: '643ef303575cd0194b8b429f',
        name: 'nvidia',
        description: 'gpu vendor',
        created: '2023-04-18T19:44:03.584Z',
        slug: 'nvidia',
        __v: 0
      },
      {
        isActive: true,
        merchant: null,
        _id: '64418216ee2a1756c41e95f9',
        name: 'dell',
        description: 'pc vendor',
        created: '2023-04-20T18:19:02.070Z',
        slug: 'dell',
        __v: 0
      },
      {
        isActive: true,
        merchant: null,
        _id: '6441846689919157854b872b',
        name: 'hp',
        description: 'printers',
        created: '2023-04-20T18:28:54.464Z',
        slug: 'hp',
        __v: 0
      },
      {
        isActive: true,
        merchant: null,
        _id: '644185b81a3bb6581cf98054',
        name: 'Google',
        description: 'Pixel',
        created: '2023-04-20T18:34:32.880Z',
        slug: 'google',
        __v: 0
      }
    ]
  }
  test('admin token', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@gmeal.com', // Replace with valid email
        password: 'password' // Replace with valid password
      });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    token = loginResponse.body.token;
    // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NDE3ZjAyNDIxN2Y2NTY1NDA5ODBiMiIsImlhdCI6MTY4MjA4NDkwMiwiZXhwIjoxNjgyNjg5NzAyfQ.lMx3gqhSw4qx-EClPZBsu_nySmYGWwTxlvFRsPrPgJ0
  });
  
  
  test('test GET on /api/brand/list', async () => {
    const response = await request(app).get('/api/brand/list');
    
    // console.log(response.body);
    expect(response.status).toBe(200);
    // console.log(response.body)
    // expect(response.body.brands.length).toBe(original.brands.length);

  });
  test('Simulate error at api/brand/list', async () => {
    jest.spyOn(Brand, 'find').mockImplementationOnce(() => {
      throw new Error('Simulated error');
    });

    const response = await request(app).get('/api/brand/list');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Your request could not be processed. Please try again.'
    );
  });


  test('test admin GET on /api/brand, admin', async () => {
    const response = await request(app)
      .get('/api/brand') 
      .set('Authorization', `${token}`);

    expect(response.status).toBe(200);
  });
  let merchant_token;
  test('merchant token', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'retail@asus.com', // Replace with valid email
        password: 'password' // Replace with valid password
      });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    merchant_token = loginResponse.body.token;
  });
  test('test merchant GET on /api/brand', async () => {
    const response = await request(app)
      .get('/api/brand') 
      .set('Authorization', `${merchant_token}`);

    expect(response.status).toBe(200);
  });
  test('Simulate error at api/brand', async () => {
    jest.spyOn(Brand, 'find').mockImplementationOnce(() => {
      throw new Error('Simulated error');
    });

    const response = await request(app)
      .get('/api/brand')
      .set('Authorization', `${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Your request could not be processed. Please try again.'
    );
  });


  test('test GET on /api/brand/:id, success', async () => {
    const response = await request(app)
      .get('/api/brand/644185b81a3bb6581cf98054') 

    expect(response.status).toBe(200);
    expect(response.body.brand.name).toBe('Google');
  });
  test('test GET on /api/brand/:id, non-existent', async () => {
    const response = await request(app)
      .get('/api/brand/644185b81a3bb6581cf98001') 

    expect(response.status).toBe(404);
  });
  test('Simulate error at api/brand/:id', async () => {
    // jest.spyOn(Brand, 'findOne').mockImplementationOnce(() => {
    //   throw new Error('Simulated error');
    // });

    const response = await request(app)
      .get('/api/brand/sdf')
      .set('Authorization', `${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Your request could not be processed. Please try again.'
    );
  });


  test('test GET on /api/brand/list/select, admin', async () => {
    const response = await request(app)
      .get('/api/brand/list/select') 
      .set('Authorization', `${token}`);

    expect(response.status).toBe(200);
  });
  test('test GET on /api/brand/list/select, merchant', async () => {
    const response = await request(app)
      .get('/api/brand/list/select') 
      .set('Authorization', `${merchant_token}`);

    expect(response.status).toBe(200);
  });
  test('test GET on /api/brand/list/select, admin', async () => {
    jest.spyOn(Brand, 'find').mockImplementationOnce(() => {
      throw new Error('Simulated error');
    });
    const response = await request(app)
      .get('/api/brand/list/select') 
      .set('Authorization', `${token}`);

    expect(response.status).toBe(400);
  });


  test('test PUT(edit) on /api/brand/:id', async () => {
    const brandData = {
          name: 'GooGle',
          slug: 'google',
          description: "Pixel"
        };
    const response = await request(app)
      .put('/api/brand/644185b81a3bb6581cf98054') 
      .set('Authorization', `${token}`)
      .send({brand: brandData});
    
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

    const brandData2 = {
      name: 'some',
      slug: 'google',
      description: "Pixel"
    };
    const response2 = await request(app)
      .put('/api/brand/643ed057d6da8e1305b3c9c8') 
      .set('Authorization', `${token}`)
      .send({brand: brandData2});

    expect(response2.status).toBe(400);
    expect(response2.body.error).toBe(
      'Slug is already in use.'
    );
    jest.spyOn(Brand, 'findOne').mockImplementationOnce(() => {
      throw new Error('Simulated error');
    });
    const brandData3 = {
      name: 'Google',
      slug: 'google',
      description: "Pixel"
    };
    const response3 = await request(app)
      .put('/api/brand/644185b81a3bb6581cf98054') 
      .set('Authorization', `${token}`)
      .send({brand: brandData3});

    expect(response3.status).toBe(400);
    expect(response3.body.error).toBe(
      'Your request could not be processed. Please try again.'
    );
  });
  test('test PUT(edit active) on /api/brand/:id/active', async () => {
    const brandData = {
          isActive: false
        };
    const response = await request(app)
      .put('/api/brand/643ed057d6da8e1305b3c9c8/active') 
      .set('Authorization', `${token}`)
      .send({brand: brandData});
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true)
    const response1 = await request(app)
      .get('/api/brand/643ed057d6da8e1305b3c9c8') 

    expect(response1.status).toBe(200);

    expect(response1.body.brand.isActive).toBe(false);

    const brandData1 = {
      isActive: true
    };
    const response2 = await request(app)
      .put('/api/brand/643ed057d6da8e1305b3c9c8/active') 
      .set('Authorization', `${token}`)
      .send({brand: brandData1});
    // console.log(response.body);

    expect(response2.status).toBe(200);
    expect(response2.body.success).toBe(true)

    const response3 = await request(app)
      .get('/api/brand/643ed057d6da8e1305b3c9c8') 

    expect(response3.status).toBe(200);
    expect(response3.body.brand.isActive).toBe(true);

    jest.spyOn(Brand, 'findOneAndUpdate').mockImplementationOnce(() => {
      throw new Error('Simulated error');
    });
    const response4 = await request(app)
      .put('/api/brand/643ed057d6da8e1305b3c9c8/active')
      .set('Authorization', `${token}`)
      .send({brand: brandData1});

    expect(response4.status).toBe(400);
    expect(response4.body.error).toBe(
      'Your request could not be processed. Please try again.'
    );

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
    added_id = response.body.brand._id;
  });
  test('failed add brands on POST at /api/brand/add', async () => {
    const brandData = {
      description: 'null',
      isActive: true
    };

    const response = await request(app)
      .post('/api/brand/add') 
      .set('Authorization', `${token}`)
      .send(brandData);

    expect(response.status).toBe(400);

  });
  test('Simulate error when adding a brand', async () => {
    // Mock the Brand.save() function to throw an error
    jest.spyOn(Brand.prototype, 'save').mockImplementationOnce(() => {
      throw new Error('Simulated error');
    });

    const brandData = {
      name: 'tesla',
      description: 'car',
      isActive: true
    };

    const response = await request(app)
      .post('/api/brand/add')
      .set('Authorization', `${token}`)
      .send(brandData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Your request could not be processed. Please try again.'
    );
  });

  test('test delete brands on DELETE at /api/brand/delete/:id', async () => {

    const response = await request(app)
      .delete(`/api/brand/delete/${added_id}`) 
      .set('Authorization', `${token}`)

    expect(response.status).toBe(200);
    expect(response.body.brand.deletedCount).toBe(1);


    jest.spyOn(Brand, 'deleteOne').mockImplementationOnce(() => {
      throw new Error('Simulated error');
    });

    const response1 = await request(app)
      .delete(`/api/brand/delete/6442a143d94990721b2f7bd2`) // asus
      .set('Authorization', `${token}`)

    expect(response1.status).toBe(400);

    const response2 = await request(app)
      .delete(`/api/brand/delete/${added_id}`) 
      .set('Authorization', `${token}`)

  });
});