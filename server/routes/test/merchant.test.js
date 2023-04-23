const request = require("supertest");
const app = require("../../app"); // Import the app instance from app.js
const auth = require("../../middleware/auth");
const { MERCHANT_STATUS, ROLES } = require("../../constants");
const Merchant = require("../../models/merchant");
const User = require("../../models/user");
const Brand = require("../../models/brand");
const jwt = require('jsonwebtoken');


let authToken;
let userId;

beforeAll(async () => {
  // login as admin
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@example.com", password: "password" });

  authToken = response.body.token;
  userId = response.body.user.id;
});

afterAll(async () => {
  // delete all merchants
  await Merchant.deleteMany();
  // delete all users
  // await User.deleteMany({});
  // delete all brands
  // await Brand.deleteMany({});
});

describe("POST /api/merchant/add", () => {
  test("should return 200 and success true", async () => {
    const response = await request(app).post("/api/merchant/add").send({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    console.log(response);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "We received your request! we will reach you on your phone number 1234567890!"
    );
    expect(response.body.merchant.name).toBe("test");
    expect(response.body.merchant.business).toBe("test");
    expect(response.body.merchant.phoneNumber).toBe("1234567890");
    expect(response.body.merchant.email).toBe("test@test.com");
    expect(response.body.merchant.brandName).toBe("test");
    expect(response.body.merchant.status).toBe(
      MERCHANT_STATUS.Waiting_Approval
    );
    expect(response.body.success).toBe(true);
  });

  test("should return 400 if missing name", async () => {
    const response = await request(app).post("/api/merchant/add").send({
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("You must enter your name and email.");
  });

  test("should return 400 if missing email", async () => {
    const response = await request(app).post("/api/merchant/add").send({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      brandName: "test",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("You must enter your name and email.");
  });

  test("should return 400 if missing business", async () => {
    const response = await request(app).post("/api/merchant/add").send({
      name: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("You must enter a business description.");
  });

  test("should return 400 if missing phoneNumber", async () => {
    const response = await request(app).post("/api/merchant/add").send({
      name: "test",
      business: "test",
      email: "test@test.com",
      brandName: "test",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "You must enter a phone number and an email address."
    );
  });

  test("should error if email already exists", async () => {
    const merchant = new Merchant({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    await merchant.save();

    const response = await request(app).post("/api/merchant/add").send({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("That email address is already in use.");
  });

  test("simulated error", async () => {
    jest.spyOn(Merchant.prototype, "save").mockImplementationOnce(() => {
      throw new Error("simulated error");
    });
    await Merchant.deleteMany({});

    const response = await request(app).post("/api/merchant/add").send({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("GET /api/merchant/search", () => {
  test("should return 200 and success true", async () => {
    const merchant = new Merchant({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });

    // await merchant.save();

    const response = await request(app)
      .get("/api/merchant/search")
      .set("Authorization", `${authToken}`)
      .query({ search: "test@test.com" })
      .send();
    console.log(response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.merchant.name).toBe("test");
    expect(response.body.merchant.business).toBe("test");
    expect(response.body.merchant.phoneNumber).toBe("1234567890");
    expect(response.body.merchant.email).toBe("test@test.com");
    expect(response.body.merchant.brandName).toBe("test");
    expect(response.body.merchant.status).toBe(
      MERCHANT_STATUS.Waiting_Approval
    );
    expect(response.body.success).toBe(true);
  });

  test("should return 400 if missing search", async () => {
    const response = await request(app)
      .get("/api/merchant/search")
      .set("Authorization", `${authToken}`)
      .send();
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("You must enter a search term.");
  });

  test("should return 401 if not logged in", async () => {
    const response = await request(app)
      .get("/api/merchant/search")
      .query({ search: "test@test.com" })
      .send();
    expect(response.statusCode).toBe(401);
  });
});

describe("GET /api/merchant/", () => {
  test("should return 200 and success true", async () => {
    const merchant = new Merchant({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    // await merchant.save();

    const response = await request(app)
      .get("/api/merchant/")
      .set("Authorization", `${authToken}`)
      .send();
    expect(response.statusCode).toBe(200);
    expect(response.body.merchants.length).toBe(1);
  });
});

describe("PUT /api/merchant/:id/active", () => {
  test("should return 200 and success true", async () => {
    const merchant = new Merchant({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    await merchant.save();

    const response = await request(app)
      .put(`/api/merchant/${merchant._id}/active`)
      .set("Authorization", `${authToken}`)
      .send({ merchant: merchant._id, active: true });
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should return 400 if not existing merchant", async () => {
    const response = await request(app)
      .put(`/api/merchant/rqweasdfsad/active`)
      .set("Authorization", `${authToken}`)
      .send({ active: true });
    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /api/merchant/approve/:id", () => {
  // const mockMerchantDoc = {
  //   _id: "mockMerchantId",
  //   email: "mockMerchantEmail",
  //   name: "Mock Merchant",
  //   status: MERCHANT_STATUS.Pending,
  //   isActive: false,
  // };
  // jest.spyOn(Merchant, "findOneAndUpdate").mockResolvedValue(mockMerchantDoc);

  // jest.spyOn(global, "createMerchantUser").mockImplementation(() => {});

  // test("should return 200 and success true", async () => {
  //   const response = await request(app)
  //     .put(`/api/merchant/approve/${mockMerchantDoc._id}`)
  //     .set("Authorization", `${authToken}`) // Assuming a valid JWT token is required for authorization
  //     .expect(200);

  //   expect(response.body.success).toBe(true);
  //   expect(Merchant.findOneAndUpdate).toHaveBeenCalledWith(
  //     { _id: mockMerchantDoc._id },
  //     {
  //       status: MERCHANT_STATUS.Approved,
  //       isActive: true,
  //     },
  //     { new: true }
  //   );
  //   expect(global.createMerchantUser).toHaveBeenCalledWith(
  //     mockMerchantDoc.email,
  //     mockMerchantDoc.name,
  //     mockMerchantDoc._id,
  //     expect.any(String) // Assert that the "host" argument is a non-empty string
  //   );
  // });
});

describe("PUT /api/merchant/reject/:id", () => {
  test("should return 200 and success true", async () => {
    const merchant = new Merchant({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    await merchant.save();
    
    const response = await request(app)
      .put(`/api/merchant/reject/${merchant._id}`)
      .set("Authorization", `${authToken}`)
      .send({ merchant: merchant._id, active: true });
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  //broken
  test("should return 400 if not existing merchant", async () => {
    jest.spyOn(Merchant, "findOneAndUpdate").mockImplementationOnce(() => {
      throw new Error("Error");
    });

    const response = await request(app)
      .put(`/api/merchant/reject/dasfasdfasdf`)
      .set("Authorization", `${authToken}`)
      .send({ active: true });
    expect(response.statusCode).toBe(400);
  });
});

describe("POST /api/merchant/signup/:token", () => {
  test("should return 200 and success true", async () => {
    const merchant = {
      firstName: "test",
      lastName: "test",
      password: "password",
      email: "test@test.com",
    };
    const token = jwt.sign(merchant, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const response = await request(app)
      .post(`/api/merchant/signup/${token}`)
      .send(merchant);
      console.log(response.body)
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe("DELETE /api/merchant/delete/:id", () => {
  test("should return 200 and success true", async () => {
    const merchant = new Merchant({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    await merchant.save();
    
    const response = await request(app)
      .delete(`/api/merchant/delete/${merchant._id}`)
      .set("Authorization", `${authToken}`)
      .send();
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  test("simulated error", async () => {
    jest.spyOn(Merchant, "deleteOne").mockImplementation(() => {
      throw new Error("Simulated error");
    });

    const merchant = new Merchant({
      name: "test",
      business: "test",
      phoneNumber: "1234567890",
      email: "test@test.com",
      brandName: "test",
    });
    await merchant.save();
    const response = await request(app)
      .delete(`/api/merchant/delete/${merchant._id}`)
      .set("Authorization", `${authToken}`)
      .send();
    expect(response.statusCode).toBe(400);
  });
});



