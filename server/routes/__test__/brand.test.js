const request = require("supertest");
const app = require("../../app"); // Import the app instance from app.js
const Brand = require("../../models/brand"); // Import the Brand model
const User = require("../../models/user")
const Product = require("../../models/product")
const Merchant = require("../../models/merchant")

const jwt = require('jsonwebtoken');
const { ROLES } = require('../../constants');
const bcrypt = require('bcryptjs');
const { ObjectId } = require("mongoose");
const mongoose = require('mongoose');


describe("brand APIs test", () => {
  let original;
  let brand1;
  let brand;
  let merchant;

  let userToken, adminToken, merchant_token;
  let user, admin, mockMerchant, user_cart;

  beforeAll(async () => {

    try {
      await User.deleteMany({});
      await Merchant.deleteMany({});
      await Brand.deleteMany({});
      await Product.deleteMany({});

      admin = new User({
        email: "admin@gmeal.com",
        password: "password",
        firstName: "admin",
        lastName: "admin",
        role: ROLES.Admin,
      });
      const existingUser = await User.findOne({ email: admin.email });
      // console.log("existingUser", existingUser);
      if (existingUser) throw new Error("user collection is seeded!");
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(admin.password, salt);
      admin.password = hash;
      await admin.save();

      user = new User({
        name: "Test User",
        email: "qitong.niu@gmail.com",
        password: "password",
        role: ROLES.Member,
      });
      const salt1 = await bcrypt.genSalt(10);
      const hash1 = await bcrypt.hash(user.password, salt1);
      user.password = hash1;
      await user.save();

      mockMerchant = new User( {
        email: "merchant@gmeal.com",
        password: "password",
        firstName: "MER",
        lastName: "chant",
        role: ROLES.Merchant,
        status: "Approved",
        isActive: true
      });
      const salt3 = await bcrypt.genSalt(10);
      const hash3 = await bcrypt.hash(mockMerchant.password, salt3);
      mockMerchant.password = hash3;
      await mockMerchant.save();

      merchant = new Merchant({
        isActive: true,
        status: "Approved",
        name: "retailor",
        email: "merchant@gmeal.com",
        business: "shave shake"
      })
      

      brand = new Brand({
        name: "adsf",
        description: "asdf ads fa dfa",
        slug: "nqt",
        isActive: true
      });
      
      brand.merchant = merchant._id;
      await brand.save();
      mockMerchant.brand = brand._id;
      mockMerchant.merchant = merchant._id;
      merchant.brand = brand._id;
      merchant.brandName = brand.name;
      await mockMerchant.save();
      await merchant.save();
      brand1 = new Brand({
        name: "brand1",
        description: "brand1",
        slug: "brand1",
        isActive: true
      });
      await brand1.save();

      console.log(brand);
      let mock_product = new Product({
        description: "a big memory",
        isActive: true,
        texable: true,
        name: "memory bar",
        price: 1,
        quantity: 1,
        sku: "002",
        texable: 1
      })
      mock_product.brand = brand._id;
      
      await mock_product.save();

    } catch (error) {
      console.log(error);
      return null;
    }

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@gmeal.com",
      password: "password",
    });
    adminToken = loginResponse.body.token;

    const userLoginResponse = await request(app).post("/api/auth/login").send({
      email: "qitong.niu@gmail.com",
      password: "password",
    });
    userToken = userLoginResponse.body.token;

    const anotherResponse = await request(app).post("/api/auth/login").send({
      email: "merchant@gmeal.com",
      password: "password",
    });
    merchant_token = anotherResponse.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Brand.deleteMany({});
    await Product.deleteMany({});
    await Merchant.deleteMany({});
  });

  
  test("test GET on /api/brand/list", async () => {
    const response = await request(app).get("/api/brand/list");

    expect(response.status).toBe(200);
    expect(response.body.brands.length).toBe(2);
  });
  test("Simulate error at api/brand/list", async () => {
    jest.spyOn(Brand, "find").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });

    const response = await request(app).get("/api/brand/list");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });

  test("test admin GET on /api/brand, admin", async () => {
    const response = await request(app)
      .get("/api/brand")
      .set("Authorization", `${adminToken}`);

    expect(response.status).toBe(200);
  });
  test("test merchant GET on /api/brand", async () => {
    const response = await request(app)
      .get("/api/brand")
      .set("Authorization", `${merchant_token}`);

    expect(response.status).toBe(200);
  });
  test("Simulate error at api/brand", async () => {
    jest.spyOn(Brand, "find").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });

    const response = await request(app)
      .get("/api/brand")
      .set("Authorization", `${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });

  test("test GET on /api/brand/:id, success", async () => {
    const response = await request(app).get(
      `/api/brand/${brand._id}`
    );

    expect(response.status).toBe(200);
    expect(response.body.brand.name).toBe(`${brand.name}`);
  });
  test("simulate error, test GET on /api/brand/:id, non-existent", async () => {
    const response = await request(app).get(
      "/api/brand/nonsense"
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });

  test("test GET on /api/brand/:id, non-existent", async () => {
    const response = await request(app).get(
      "/api/brand/644457e8dbedd7b7702e1890"
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Cannot find brand with the id: 644457e8dbedd7b7702e1890."
    );
  });


  test("test GET on /api/brand/list/select, admin", async () => {
    const response = await request(app)
      .get("/api/brand/list/select")
      .set("Authorization", `${adminToken}`);

    expect(response.status).toBe(200);
  });
  test("test GET on /api/brand/list/select, merchant", async () => {
    const response = await request(app)
      .get("/api/brand/list/select")
      .set("Authorization", `${merchant_token}`);

    expect(response.status).toBe(200);
  });
  test("test GET on /api/brand/list/select, admin", async () => {
    jest.spyOn(Brand, "find").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });
    const response = await request(app)
      .get("/api/brand/list/select")
      .set("Authorization", `${adminToken}`);

    expect(response.status).toBe(400);
  });

  test("test PUT(edit) on /api/brand/:id", async () => {
    // change
    const brandData = {
      name: "GooGle",
      slug: `${brand.slug}`,
      description: "Pixel",
    };
    const response = await request(app)
      .put(`/api/brand/${brand._id}`)
      .set("Authorization", `${adminToken}`)
      .send({ brand: brandData });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    // restore
    const brandData1 = {
      name: `${brand.name}`,
      slug: `${brand.slug}`,
      description: `${brand.description}`,
    };
    const response1 = await request(app)
      .put(`/api/brand/${brand._id}`)
      .set("Authorization", `${adminToken}`)
      .send({ brand: brandData1 });

    expect(response1.status).toBe(200);
    expect(response1.body.success).toBe(true);
    
    // non-existent
    const brandData2 = {
      name: `${brand.name}`,
      slug: `${brand.slug}`,
      description: "Pixel",
    };
    const response2 = await request(app)
      .put(`/api/brand/${brand1._id}`)
      .set("Authorization", `${adminToken}`)
      .send({ brand: brandData2 });

    expect(response2.status).toBe(400);
    expect(response2.body.error).toBe("Slug is already in use.");

    // error
    jest.spyOn(Brand, "findOne").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });
    const brandData3 = {
      name: "Google",
      slug: "google",
      description: "Pixel",
    };
    const response3 = await request(app)
      .put(`/api/brand/${brand1._id}`)
      .set("Authorization", `${adminToken}`)
      .send({ brand: brandData3 });

    expect(response3.status).toBe(400);
    expect(response3.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });


  test("test PUT(edit active) on /api/brand/:id/active", async () => {
    // deactivate
    const brandData = {
      isActive: false,
    };
    const response = await request(app)
      .put(`/api/brand/${brand._id}/active`)
      .set("Authorization", `${adminToken}`)
      .send({ brand: brandData });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    const response1 = await request(app).get(
      `/api/brand/${brand._id}`
    );

    expect(response1.status).toBe(200);

    expect(response1.body.brand.isActive).toBe(false);

    // activate
    const brandData1 = {
      isActive: true,
    };
    const response2 = await request(app)
      .put(`/api/brand/${brand._id}/active`)
      .set("Authorization", `${adminToken}`)
      .send({ brand: brandData1 });

    expect(response2.status).toBe(200);
    expect(response2.body.success).toBe(true);

    jest.spyOn(Brand, "findOneAndUpdate").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });
    const response4 = await request(app)
      .put(`/api/brand/${brand._id}/active`)
      .set("Authorization", `${adminToken}`)
      .send({ brand: brandData1 });

    expect(response4.status).toBe(400);
    expect(response4.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });


  let added_id;
  test("test add brands on POST at /api/brand/add", async () => {
    const brandData = {
      name: "oracle",
      description: "mysql",
      isActive: true,
    };

    const response = await request(app)
      .post("/api/brand/add")
      .set("Authorization", `${adminToken}`)
      .send(brandData);

    expect(response.status).toBe(200);
    added_id = response.body.brand._id;
  });
  test("failed add brands on POST at /api/brand/add", async () => {
    const brandData = {
      description: "null",
      isActive: true,
    };

    const response = await request(app)
      .post("/api/brand/add")
      .set("Authorization", `${adminToken}`)
      .send(brandData);

    expect(response.status).toBe(400);
  });
  test("Simulate error when adding a brand", async () => {
    // Mock the Brand.save() function to throw an error
    jest.spyOn(Brand.prototype, "save").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });

    const brandData = {
      name: "tesla",
      description: "car",
      isActive: true,
    };

    const response = await request(app)
      .post("/api/brand/add")
      .set("Authorization", `${adminToken}`)
      .send(brandData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });

  test("test delete brands on DELETE at /api/brand/delete/:id", async () => {
    const response = await request(app)
      .delete(`/api/brand/delete/${added_id}`)
      .set("Authorization", `${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.brand.deletedCount).toBe(1);

    jest.spyOn(Brand, "deleteOne").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });

    const response1 = await request(app)
      .delete(`/api/brand/delete/${brand._id}`) 

      .set("Authorization", `${adminToken}`);
    expect(response1.status).toBe(400);
    
    const response2 = await request(app)
      .delete(`/api/brand/delete/${added_id}`)
      .set("Authorization", `${adminToken}`);
  });
});
