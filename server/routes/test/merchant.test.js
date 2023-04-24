const request = require("supertest");
const app = require("../../app"); // Import the app instance from app.js
const auth = require("../../middleware/auth");
const { MERCHANT_STATUS, ROLES, EMAIL_PROVIDER } = require("../../constants");
const Merchant = require("../../models/merchant");
const User = require("../../models/user");
const Brand = require("../../models/brand");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const keys = require("../../config/keys");
const { ObjectId } = require("mongodb");

describe("Test /api/merchant", () => {
  let original;
  let brand1;
  let brand;
  let merchant;
  let passwordToken = "123456";

  let userToken, adminToken, merchant_token;
  let userId;
  let user, admin, mockMerchant, user_cart;
  beforeAll(async () => {
    // login as admin
    try {
      admin = new User({
        email: "admin@kaicko.com",
        password: "password",
        firstName: "Admin",
        lastName: "Admin",
        provider: "Email",
        role: ROLES.Admin,
      });
      const existingUser = await User.findOne({ email: admin.email });
      if (existingUser) throw new Error("User already exists");
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(admin.password, salt);
      admin.password = hash;
      await admin.save({ validateBeforeSave: false });

      user = new User({
        firstName: "test",
        lastName: "test",
        email: "kai@kaicko.com",
        password: "password",
        role: ROLES.Member,
      });
      const salt1 = await bcrypt.genSalt(10);
      const hash1 = await bcrypt.hash(user.password, salt1);
      user.password = hash1;
      await user.save({ validateBeforeSave: false });

      mockMerchant = new User({
        email: "merchant@kaicko.com",
        password: "password",
        firstName: "MER",
        lastName: "chant",
        role: ROLES.Merchant,
        status: "Approved",
        isActive: true,
      });
      const salt3 = await bcrypt.genSalt(10);
      const hash3 = await bcrypt.hash(mockMerchant.password, salt3);
      mockMerchant.password = hash3;
      await mockMerchant.save({ validateBeforeSave: false });
    } catch (error) {
      console.log(error);
    }

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@kaicko.com", password: "password" });

    adminToken = response.body.token;

    const userLoginResponse = await request(app).post("/api/auth/login").send({
      email: "kai@kaicko.com",
      password: "password",
    });
    userId = userLoginResponse.body.user.id;
    userToken = userLoginResponse.body.token;

    const anotherResponse = await request(app).post("/api/auth/login").send({
      email: "merchant@kaicko.com",
      password: "password",
    });
    merchant_token = anotherResponse.body.token;
  });

  afterAll(async () => {
    // delete all merchants
    await Merchant.deleteMany();
    // delete all users
    await User.deleteMany({});
    // delete all brands
    await Brand.deleteMany({});
  });

  afterEach(async () => {
    // delete all merchants
    await Merchant.deleteMany();
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
      expect(response.body.error).toBe(
        "You must enter a business description."
      );
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

      await merchant.save();

      const response = await request(app)
        .get("/api/merchant/search?search=test")
        .set("Authorization", `${adminToken}`)
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.body.merchants.length).toBe(1);
      expect(response.body.merchants[0].name).toBe("test");
      expect(response.body.merchants[0].business).toBe("test");
      expect(response.body.merchants[0].phoneNumber).toBe("1234567890");
      expect(response.body.merchants[0].email).toBe("test@test.com");
      expect(response.body.merchants[0].brandName).toBe("test");
      expect(response.body.merchants[0].status).toBe(
        MERCHANT_STATUS.Waiting_Approval
      );
    });

    test("should return 200 if missing search", async () => {
      const response = await request(app)
        .get("/api/merchant/search")
        .set("Authorization", `${adminToken}`)
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.body.merchants.length).toBe(0);
    });

    test("should return 401 if not logged in", async () => {
      const response = await request(app)
        .get("/api/merchant/search")
        .query({ search: "test@test.com" })
        .send();
      expect(response.statusCode).toBe(401);
    });

    test("should return 400 with simulated error", async () => {
      jest.spyOn(Merchant, "find").mockImplementationOnce(() => {
        throw new Error("simulated error");
      });
      const response = await request(app)
        .get("/api/merchant/search")
        .set("Authorization", `${adminToken}`)
        .query({ search: "asdf" })
        .send();
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe(
        "Your request could not be processed. Please try again."
      );
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
      await merchant.save();

      const response = await request(app)
        .get("/api/merchant/")
        .set("Authorization", `${adminToken}`)
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.body.merchants.length).toBe(1);
    });

    test("simulated error", async () => {
      jest.spyOn(Merchant, "find").mockImplementationOnce(() => {
        throw new Error("simulated error");
      });
      const response = await request(app)
        .get("/api/merchant/")
        .set("Authorization", `${adminToken}`)
        .send();
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe(
        "Your request could not be processed. Please try again."
      );
    });
  });

  describe("PUT /api/merchant/:id/active", () => {
    test("should return 200 and success true", async () => {
      const merchant = new Merchant({
        name: "test",
        business: "test",
        phoneNumber: "1234567890",
        email: "test@test.com",
        brand: new ObjectId("e91eb9f5ad6e38e753aa82aa"),
        brandName: "test",
      });
      await merchant.save();

      const brand = new Brand({
        name: "adsf",
        description: "asdf ads fa dfa",
        slug: "nqt",
        isActive: true,
      });

      brand.merchant = merchant._id;
      await brand.save();
      merchant.brand = brand._id;
      merchant.brandName = brand.name;
      await merchant.save({ validateBeforeSave: false });

      const response = await request(app)
        .put(`/api/merchant/${merchant._id}/active`)
        .set("Authorization", `${adminToken}`)
        .send({ merchant: merchant._id });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("already active", async () => {
      const merchant = new Merchant({
        name: "test",
        business: "test",
        phoneNumber: "1234567890",
        email: "test@test.com",
        brandName: "test",
        isActive: true,
      });

      await merchant.save();

      const response = await request(app)
        .put(`/api/merchant/${merchant._id}/active`)
        .set("Authorization", `${adminToken}`)
        .send({ merchant: { isActive: true } });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("not active", async () => {
      const merchant = new Merchant({
        name: "test",
        business: "test",
        phoneNumber: "1234567890",
        email: "test@test.com",
        brandName: "test",
        isActive: false,
      });

      await merchant.save();

      const response = await request(app)
        .put(`/api/merchant/${merchant._id}/active`)
        .set("Authorization", `${adminToken}`)
        .send({ merchant: { isActive: false } });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should return 400 if not existing merchant", async () => {
      const response = await request(app)
        .put(`/api/merchant/rqweasdfsad/active`)
        .set("Authorization", `${adminToken}`)
        .send({ active: true });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("PUT /api/merchant/approve/:id", () => {
    test("should return 200 and success true", async () => {
      const merchant = new Merchant({
        name: "test",
        business: "test",
        phoneNumber: "1234567890",
        email: "merchant@kaicko.com",
        brandName: "test",
      });
      await merchant.save();

      const response = await request(app)
        .put(`/api/merchant/approve/${merchant._id}`)
        .set("Authorization", `${adminToken}`)
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      Merchant.find({ email: "merchant@kaicko.com" }).then((merchant) => {
        expect(merchant[0].status).toBe(MERCHANT_STATUS.Approved);
      });
    });

    test("merchant but not user", async () => {
      const merchant = new Merchant({
        name: "test",
        business: "test",
        phoneNumber: "1234567890",
        email: "test@kaicko.com",
        brandName: "test",
      });
      await merchant.save();

      jest.spyOn(User.prototype, "save").mockImplementationOnce(() => {
        return Promise.resolve();
      });

      const response = await request(app)
        .put(`/api/merchant/approve/${merchant._id}`)
        .set("Authorization", `${adminToken}`)
        .send();
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      Merchant.find({ email: "test@kaicko.com" }).then((merchant) => {
        expect(merchant[0].status).toBe(MERCHANT_STATUS.Approved);
      });
    });

    test("should return 400 if not existing merchant", async () => {
      const response = await request(app)
        .put(`/api/merchant/approve/adsffasddfsa`)
        .set("Authorization", `${adminToken}`)
        .send();
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe(
        "Your request could not be processed. Please try again."
      );
    });
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
        .set("Authorization", `${adminToken}`)
        .send({ merchant: merchant._id, active: true });
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should return 400 if not existing merchant", async () => {
      jest.spyOn(Merchant, "findOneAndUpdate").mockImplementationOnce(() => {
        throw new Error("Error");
      });

      const response = await request(app)
        .put(`/api/merchant/reject/dasfasdfasdf`)
        .set("Authorization", `${adminToken}`)
        .send({ active: true });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /api/merchant/signup/:token", () => {
    test("should return 200 and success true", async () => {
      jest.spyOn(User, "findOne").mockImplementationOnce(() => {
        return {
          _id: userId,
          email: "kai@kaicko.com",
          firstName: "test",
          lastName: "test",
          password: "password",
        };
      });

      jest.spyOn(Merchant, "findOne").mockImplementationOnce(() => {
        return {
          _id: userId,
          name: "test",
          business: "test",
          phoneNumber: "1234567890",
          email: "kai@kaicko.com",
          brandName: "test",
        };
      });

      const response = await request(app)
        .post(`/api/merchant/signup/null}`)
        .send({
          firstName: "test",
          lastName: "test",
          password: "password",
          email: "kai@kaicko.com",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should return 400 if no email in request", async () => {
      const response = await request(app)
        .post(`/api/merchant/signup/null}`)
        .send({
          firstName: "test",
          lastName: "test",
          password: "password",
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("You must enter an email address.");
    });

    test("should return 400 if no password in request", async () => {
      const response = await request(app)
        .post(`/api/merchant/signup/null}`)
        .send({
          firstName: "test",
          lastName: "test",
          email: "kai@kaicko.com",
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("You must enter a password.");
    });

    test("should return 400 if no firstName in request", async () => {
      const response = await request(app)
        .post(`/api/merchant/signup/null}`)
        .send({
          lastName: "test",
          password: "password",
          email: "kai@kaicko.com",
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("You must enter your full name.");
    });

    test("should return 400 if no lastName in request", async () => {
      const response = await request(app)
        .post(`/api/merchant/signup/null}`)
        .send({
          firstName: "test",
          password: "password",
          email: "kai@kaicko.com",
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("You must enter your full name.");
    });

    test("should return 400 if no merchant in request", async () => {
      const response = await request(app)
        .post(`/api/merchant/signup/null}`)
        .send({
          firstName: "test",
          lastName: "test",
          password: "password",
          email: "kai@kaicko.com",
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe(
        "Your request could not be processed. Please try again."
      );
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
        .set("Authorization", `${adminToken}`)
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
        .set("Authorization", `${adminToken}`)
        .send();
      expect(response.statusCode).toBe(400);
    });
  });
});
