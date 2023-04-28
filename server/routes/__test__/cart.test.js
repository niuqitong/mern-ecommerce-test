const request = require("supertest");
const app = require("../../app"); // Import the app instance from app.js
const auth = require("../../middleware/auth");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../../models/user");
const { ROLES } = require("../../constants");

let userId;
let user;

let admin;
let adminToken;

beforeAll(async () => {
  // login and get the auth token
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

  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@kaicko.com", password: "password" });

  adminToken = response.body.token;
  userId = response.body.user.id;
  user = response.body.user;
});

afterAll(async () => {
  await User.deleteMany({});
  await Cart.deleteMany({});
  await Product.deleteMany({});
});

describe("POST /api/cart/add", () => {
  test("should add a new cart", async () => {
    const response = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `${adminToken}`)
      .send({
        user: user,
        products: [
          {
            sku: "ABC123",
            name: "Test Product",
            slug: "test-product",
            imageUrl: "https://example.com/image.jpg",
            imageKey: "image.jpg",
            description: "Test product description",
            quantity: 10,
            price: 9.99,
            taxable: true,
            isActive: true,
            brand: mongoose.Types.ObjectId(),
          },
        ],
      });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.cartId).toBeDefined();
  });

  // bug causes error
  test("should return 400 with no products", async () => {
    const response = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `${adminToken}`)
      .send({
        user: user,
        products: [],
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  // bug causes error
  test("should return 400 with no user", async () => {
    const response = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `${adminToken}`)
      .send({
        products: [],
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test("should return 401 with no auth token", async () => {
    const response = await request(app)
      .post("/api/cart/add")
      .send({
        user: user,
        products: [
          {
            sku: "ABC123",
            name: "Test Product",
            slug: "test-product",
            imageUrl: "https://example.com/image.jpg",
            imageKey: "image.jpg",
            description: "Test product description",
            quantity: 10,
            price: 9.99,
            taxable: true,
            isActive: true,
            brand: mongoose.Types.ObjectId(),
          },
        ],
      });
    expect(response.status).toBe(401);
  });

  //broken
  test("simulated error", async () => {
    jest.spyOn(Cart.prototype, "save").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });

    const response = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `${adminToken}`)
      .send({
        user: user,
        products: [
          {
            sku: "ABC123",
            name: "Test Product",
            slug: "test-product",
            imageUrl: "https://example.com/image.jpg",
            imageKey: "image.jpg",
            description: "Test product description",
            quantity: 10,
            price: 9.99,
            taxable: true,
            isActive: true,
            brand: mongoose.Types.ObjectId(),
          },
        ],
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("DELETE /api/cart/delete/:cartId", () => {
  test("should delete a cart", async () => {
    const cart = new Cart({
      user: userId,
      products: [
        {
          sku: "ABC123",
          name: "Test Product",
          slug: "test-product",
          imageUrl: "https://example.com/image.jpg",
          imageKey: "image.jpg",
          description: "Test product description",
          quantity: 10,
          price: 9.99,
          taxable: true,
          isActive: true,
          brand: mongoose.Types.ObjectId(),
        },
      ],
    });
    const cartDoc = await cart.save();
    const response = await request(app)
      .delete(`/api/cart/delete/${cartDoc.id}`)
      .set("Authorization", `${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should return 401 with no auth token", async () => {
    const response = await request(app).delete(
      `/api/cart/delete/${mongoose.Types.ObjectId()}`
    );
    expect(response.status).toBe(401);
  });

  test("should return 404 with invalid cart id", async () => {
    const response = await request(app)
      .delete(`/api/cart/delete/randomId`)
      .set("Authorization", `${adminToken}`);
    expect(response.status).toBe(400);
  });
});

describe("POST /api/cart/add/:cartId", () => {
  test("should add a product to a cart", async () => {
    const cart = new Cart({
      user: userId,
      products: [
        {
          sku: "ABC123",
          name: "Test Product",
          slug: "test-product",
          imageUrl: "https://example.com/image.jpg",
          imageKey: "image.jpg",
          description: "Test product description",
          quantity: 10,
          price: 9.99,
          taxable: true,
          isActive: true,
          brand: mongoose.Types.ObjectId(),
        },
      ],
    });
    const cartDoc = await cart.save();
    const response = await request(app)
      .post(`/api/cart/add/${cartDoc.id}`)
      .set("Authorization", `${adminToken}`)
      .send({
        sku: "ABC1234",
        name: "Test Product",
        slug: "test-product",
        imageUrl: "https://example.com/image.jpg",
        imageKey: "image.jpg",
        description: "Test product description",
        quantity: 10,
        price: 9.99,
        taxable: true,
        isActive: true,
        brand: mongoose.Types.ObjectId(),
      });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should return 401 with no auth token", async () => {
    const response = await request(app)
      .post(`/api/cart/add/${mongoose.Types.ObjectId()}`)
      .send({
        sku: "ABC1234",
        name: "Test Product",
        slug: "test-product",
        imageUrl: "https://example.com/image.jpg",
        imageKey: "image.jpg",
        description: "Test product description",
        quantity: 10,
        price: 9.99,
        taxable: true,
        isActive: true,
        brand: mongoose.Types.ObjectId(),
      });
    expect(response.status).toBe(401);
  });

  test("should return 400 with invalid cart id", async () => {
    const response = await request(app)
      .post(`/api/cart/add/randomId`)
      .set("Authorization", `${adminToken}`)
      .send({
        sku: "ABC1234",
        name: "Test Product",
        slug: "test-product",
        imageUrl: "https://example.com/image.jpg",
        imageKey: "image.jpg",
        description: "Test product description",
        quantity: 10,
        price: 9.99,
        taxable: true,
        isActive: true,
        brand: mongoose.Types.ObjectId(),
      });
    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/cart/delete/:cartId/:productId", () => {
  test("should delete a product from a cart", async () => {
    const cart = new Cart({
      user: userId,
      products: [
        {
          sku: "ABC123",
          name: "Test Product",
          slug: "test-product",
          imageUrl: "https://example.com/image.jpg",
          imageKey: "image.jpg",
          description: "Test product description",
          quantity: 10,
          price: 9.99,
          taxable: true,
          isActive: true,
          brand: mongoose.Types.ObjectId(),
        },
      ],
    });
    const cartDoc = await cart.save();
    const response = await request(app)
      .delete(`/api/cart/delete/${cartDoc.id}/${cartDoc.products[0].id}`)
      .set("Authorization", `${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should return 401 with no auth token", async () => {
    const response = await request(app).delete(
      `/api/cart/delete/${mongoose.Types.ObjectId()}/${mongoose.Types.ObjectId()}`
    );
    expect(response.status).toBe(401);
  });

  test("should return 400 with invalid cart id", async () => {
    const response = await request(app)
      .delete(`/api/cart/delete/randomId/${mongoose.Types.ObjectId()}`)
      .set("Authorization", `${adminToken}`);
    expect(response.status).toBe(400);
  });

  test("should return 400 with invalid product id", async () => {
    const response = await request(app)
      .delete(`/api/cart/delete/${mongoose.Types.ObjectId()}/randomId`)
      .set("Authorization", `${adminToken}`);
    expect(response.status).toBe(400);
  });
});

describe("Integration Tests", () => {
  test("should create a cart, add a product, and delete the cart", async () => {
    const response = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `${adminToken}`)
      .send({
        user: user,
        products: [
          {
            sku: "ABC123",
            name: "Test Product",
            slug: "test-product",
            imageUrl: "https://example.com/image.jpg",
            imageKey: "image.jpg",
            description: "Test product description",
            quantity: 10,
            price: 9.99,
            taxable: true,
            isActive: true,
            brand: mongoose.Types.ObjectId(),
          },
        ],
      });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.cartId).toBeDefined();
    const cartId = response.body.cartId;
    const addResponse = await request(app)
      .post(`/api/cart/add/${cartId}`)
      .set("Authorization", `${adminToken}`)
      .send({
        product: {
          sku: "ABC12345",
          name: "Test Product",
          slug: "test-product",
          imageUrl: "https://example.com/image.jpg",
          imageKey: "image.jpg",
          description: "Test product description",
          quantity: 10,
          price: 9.99,
          taxable: true,
          isActive: true,
          brand: mongoose.Types.ObjectId(),
        },
      });
    expect(addResponse.status).toBe(200);
    expect(addResponse.body.success).toBe(true);
    const deleteResponse = await request(app)
      .delete(`/api/cart/delete/${cartId}`)
      .set("Authorization", `${adminToken}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });

  test("should create a cart, add a product, and delete the product", async () => {
    const response = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `${adminToken}`)
      .send({
        user: user,
        products: [
          {
            sku: "ABC123",
            name: "Test Product",
            slug: "test-product",
            imageUrl: "https://example.com/image.jpg",
            imageKey: "image.jpg",
            description: "Test product description",
            quantity: 10,
            price: 9.99,
            taxable: true,
            isActive: true,
            brand: mongoose.Types.ObjectId(),
          },
        ],
      });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.cartId).toBeDefined();
    const cartId = response.body.cartId;
    const addResponse = await request(app)
      .post(`/api/cart/add/${cartId}`)
      .set("Authorization", `${adminToken}`)
      .send({
        product: {
          sku: "ABC12345",
          name: "Test Product",
          slug: "test-product",
          imageUrl: "https://example.com/image.jpg",
          imageKey: "image.jpg",
          description: "Test product description",
          quantity: 10,
          price: 9.99,
          taxable: true,
          isActive: true,
          brand: mongoose.Types.ObjectId(),
        },
      });

    const cart = await Cart.findById(cartId);
    expect(cart.products.length).toBe(2);
    expect(addResponse.status).toBe(200);
    expect(addResponse.body.success).toBe(true);
    const deleteResponse = await request(app)
      .delete(`/api/cart/delete/${cartId}/${cart.products[0].id}`)
      .set("Authorization", `${adminToken}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    const newCart = await Cart.findById(cartId);

    expect(newCart.products.length).toBe(2);
  });
});
