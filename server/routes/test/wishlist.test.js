const request = require("supertest");
const app = require("../../app");
const Product = require("../../models/product");
const Brand = require("../../models/brand");
const Merchant = require("../../models/merchant");
const WishList = require("../../models/wishlist");
const User = require("../../models/user");
const { ROLES } = require("../../constants");
const bcrypt = require("bcryptjs");

let adminToken;
let userId;
let product1;
let product2;
let admin;
let user;

beforeAll(async () => {
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
  const brand = new Brand({
    name: "Sample Brand",
    slug: "sample-brand",
    imageUrl: "https://example.com/sample-brand.jpg",
    description: "This is a sample brand description.",
    isActive: true,
  });

  await brand.save();

  product1 = new Product({
    sku: "123456",
    name: "Sample Product1",
    slug: "sample-product1",
    imageUrl: "https://example.com/sample-product.jpg",
    imageKey: "sample-product.jpg",
    description: "This is a sample product description.",
    quantity: 10,
    price: 9.99,
    taxable: true,
    isActive: true,
    brand: brand._id,
  });

  await product1.save();

  product2 = new Product({
    sku: "123457",
    name: "Sample Product2",
    slug: "sample-product2",
    imageUrl: "https://example.com/sample-product.jpg",
    imageKey: "sample-product.jpg",
    description: "This is a sample product description.",
    quantity: 10,
    price: 9.99,
    taxable: true,
    isActive: true,
    brand: brand._id,
  });

  await product2.save();
});

afterAll(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Brand.deleteMany({});
  await WishList.deleteMany({});
  // await Merchant.deleteMany({});
});

describe("POST /api/wishlist/", () => {
  test("It should add a product to the wishlist", async () => {
    const response = await request(app)
      .post("/api/wishlist/")
      .set("Authorization", `${adminToken}`)
      .send({ product: product1._id, isLiked: true });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Added to your Wishlist successfully!");
    expect(response.body.wishlist.isLiked).toBe(true);
    expect(response.body.wishlist.user).toBe(userId);
    expect(response.body.wishlist.product).toBe(product1._id.toString());

    const response2 = await request(app)
      .post("/api/wishlist/")
      .set("Authorization", `${adminToken}`)
      .send({ product: product2._id, isLiked: true });

    expect(response2.statusCode).toBe(200);
    expect(response2.body.success).toBe(true);
    expect(response2.body.message).toBe("Added to your Wishlist successfully!");
    expect(response2.body.wishlist.isLiked).toBe(true);
    expect(response2.body.wishlist.user).toBe(userId);
  });

  test("Simulated error: It should return an error message", async () => {
    jest.spyOn(WishList, "findOneAndUpdate").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });
    const response = await request(app)
      .post("/api/wishlist/")
      .set("Authorization", `${adminToken}`)
      .send({ product: "sample-product1", isLiked: true });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("GET /api/wishlist/", () => {
  test("It should fetch the wishlist", async () => {
    const response = await request(app)
      .post("/api/wishlist/")
      .set("Authorization", `${adminToken}`)
      .send({ product: product1._id, isLiked: true });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.wishlist.isLiked).toBe(true);
    expect(response.body.wishlist.user).toBe(userId);
    expect(response.body.wishlist.product).toBe(product1._id.toString());

    const response2 = await request(app)
      .get("/api/wishlist/")
      .set("Authorization", `${adminToken}`);

    expect(response2.statusCode).toBe(200);
    expect(response2.body.wishlist.length).toBe(2);
  });

  test("Simulated error: It should return an error message", async () => {
    jest.spyOn(WishList, "find").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });
    const response = await request(app)
      .get("/api/wishlist/")
      .set("Authorization", `${adminToken}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});
