const request = require("supertest");
const app = require("../../app");
const Product = require("../../models/product");
const Brand = require("../../models/brand");
const Merchant = require("../../models/merchant");
let authToken;
let userId;

beforeAll(async () => {
  // login and get the auth token
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: "user@example.com", password: "password" });
  authToken = response.body.token;
  userId = response.body.user.id;
});

afterEach(async () => {
  // delete all products
  await Product.deleteMany();
  // delete all brands
  await Brand.deleteMany();
});

describe("GET /api/product/item/:slug", () => {
  test("It should respond with a product", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    await brand.save();

    const product = new Product({
      sku: "123456",
      name: "Sample Product",
      slug: "sample-product",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    });

    await product.save();
    const response = await request(app)
      .get("/api/product/item/sample-product")
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.product).toHaveProperty("name");
    expect(response.body.product).toHaveProperty("price");
    expect(response.body.product).toHaveProperty("description");
    expect(response.body.product).toHaveProperty("imageUrl");
    expect(response.body.product).toHaveProperty("imageKey");
    expect(response.body.product).toHaveProperty("quantity");
    expect(response.body.product).toHaveProperty("taxable");
    expect(response.body.product).toHaveProperty("isActive");
    expect(response.body.product).toHaveProperty("brand");
    expect(response.body.product).toHaveProperty("sku");
    expect(response.body.product).toHaveProperty("slug");
    expect(response.body.product.sku).toBe("123456");
    expect(response.body.product.name).toBe("Sample Product");
    expect(response.body.product.slug).toBe("sample-product");
    expect(response.body.product.imageUrl).toBe(
      "https://example.com/sample-product.jpg"
    );
    expect(response.body.product.imageKey).toBe("sample-product.jpg");
    expect(response.body.product.description).toBe(
      "This is a sample product description."
    );
    expect(response.body.product.quantity).toBe(10);
    expect(response.body.product.price).toBe(9.99);
    expect(response.body.product.taxable).toBe(true);
    expect(response.body.product.isActive).toBe(true);
  });

  test("It should respond with 404 if product has no brand", async () => {
    const product = new Product({
      sku: "1234546",
      name: "Sample Product",
      slug: "sample-product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
    });

    await product.save();
    const response = await request(app).get(
      "/api/product/item/sample-product1"
    );
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("No product found.");
  });

  test("It should respond with 404 if product is not found", async () => {
    const response = await request(app).get(
      "/api/product/item/sample-product2"
    );
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("No product found.");
  });

  test("Simulated error", async () => {
    jest.spyOn(Product, "findOne").mockImplementationOnce(() => {
      throw new Error("Error");
    });
    const response = await request(app).get("/api/product/item/sample-product");
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("GET /api/product/list/search/:name", () => {
  test("It should respond with a list of products", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    // await brand.save();

    const product1 = new Product({
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

    // await product1.save();

    const product2 = new Product({
      sku: "1234567",
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

    // await product2.save();

    const response = await request(app).get("/api/product/list/search/sample");
    expect(response.statusCode).toBe(200);
    expect(response.body.products).toHaveLength(2);
  });

  //this test fails as it can't pass as it doesnt respond with the right code as it should be <= 0
  test("It should respond with 404 if no products are found", async () => {
    const response = await request(app).get("/api/product/list/search/sample1");
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("No products found.");
  });

  test("Simulated error", async () => {
    jest.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("Error");
    });
    const response = await request(app).get("/api/product/list/search/sample");
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("GET /api/product/list", () => {
  test("It should respond with a list of products", async () => {
    const product1 = new Product({
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
    });

    const product2 = new Product({
      sku: "1234567",
      name: "Sample Product2",
      slug: "sample-product2",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 8.99,
      taxable: true,
      isActive: true,
    });

    const product3 = new Product({
      sku: "12345678",
      name: "Sample Product3",
      slug: "sample-product3",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",

      quantity: 10,
      price: 7.99,
      taxable: true,
      isActive: true,
    });

    const response = await request(app)
      .get("/api/product/list")
      .query({
        sortOrder: { price: 1 },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.products).toHaveLength(3);
  });
});

describe("GET /api/product/list/brand/:slug", () => {
  // TODO
});

describe("GET /api/list/select", () => {
  test("It should respond with a list of products", async () => {
    const product1 = new Product({
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
    });

    const product2 = new Product({
      sku: "1234567",
      name: "Sample Product2",
      slug: "sample-product2",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 8.99,
      taxable: true,
      isActive: true,
    });

    const response = await request(app)
      .get("/api/product/list/select")
      .set("Authorization", `${authToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.products).toHaveLength(2);
  });

  test("It should respond with 401 if no token is provided", async () => {
    const response = await request(app).get("/api/product/list/select");
    expect(response.statusCode).toBe(401);
  });

  test("Simulated error", async () => {
    jest.spyOn(Product, "find").mockImplementationOnce(() => {
      throw new Error("Error");
    });
    const response = await request(app)
      .get("/api/product/list/select")
      .set("Authorization", `${authToken}`)
      .send();
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("POST /api/product/add", () => {
  test("Should add product", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    // await brand.save();

    const product1 = {
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
    };

    const response = await request(app)
      .post("/api/product/add")
      .set("Authorization", `${authToken}`)
      .send(product1);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Product has been added successfully!");
    expect(response.body.product.name).toBe("Sample Product1");
    expect(response.body.product.sku).toBe("123456");
    expect(response.body.product.slug).toBe("sample-product1");
    expect(response.body.product.description).toBe(
      "This is a sample product description."
    );
    expect(response.body.product.quantity).toBe(10);
    expect(response.body.product.price).toBe(9.99);
    expect(response.body.product.taxable).toBe(true);
    expect(response.body.product.isActive).toBe(true);
    expect(response.body.product.brand).toBe(brand._id.toString());
  });

  test("Should return 400 if no sku is provided", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = {
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
    };

    const response = await request(app)
      .post("/api/product/add")
      .set("Authorization", `${authToken}`)
      .send(product1);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("You must enter sku.");
  });

  test("Should return 400 if no name is provided", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = {
      sku: "123456",
      slug: "sample-product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    };

    const response = await request(app)
      .post("/api/product/add")
      .set("Authorization", `${authToken}`)
      .send(product1);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("You must enter description & name.");
  });

  test("Should return 400 if no description is provided", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = {
      sku: "123456",
      slug: "sample-product1",
      name: "Sample Product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    };

    const response = await request(app)
      .post("/api/product/add")
      .set("Authorization", `${authToken}`)
      .send(product1);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("You must enter description & name.");
  });

  test("Should return 400 if no quantity is provided", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = {
      sku: "123456",
      slug: "sample-product1",
      name: "Sample Product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    };

    const response = await request(app)
      .post("/api/product/add")
      .set("Authorization", `${authToken}`)
      .send(product1);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("You must enter a quantity.");
  });

  test("Should return 400 if no price is provided", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = {
      sku: "123456",
      slug: "sample-product1",
      name: "Sample Product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      taxable: true,
      isActive: true,
      brand: brand._id,
    };

    const response = await request(app)
      .post("/api/product/add")
      .set("Authorization", `${authToken}`)
      .send(product1);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("You must enter a price.");
  });

  test("Should return 400 if sku is already in use", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = {
      sku: "123456",
      slug: "sample-product1",
      name: "Sample Product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    };

    const product2 = {
      sku: "123456",
      slug: "sample-product2",
      name: "Sample Product2",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    };

    const response1 = await request(app)
      .post("/api/product/add")
      .set("Authorization", `${authToken}`)
      .send(product1);
    expect(response1.statusCode).toBe(200);
    const response2 = await request(app)
      .post("/api/product/add")
      .set("Authorization", `${authToken}`)
      .send(product2);
    expect(response2.statusCode).toBe(400);
    expect(response2.body.error).toBe("This sku is already in use.");
  });

  test("Should return 401 if no auth token is provided", async () => {
    const response = await request(app).post("/api/product/add");
    expect(response.statusCode).toBe(401);
  });

  test("Simulated error", async () => {
    jest.spyOn(Product.prototype, "save").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = {
      sku: "123456",
      slug: "sample-product1",
      name: "Sample Product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    };

    const response = await request(app)
      .post("/api/product/add")
      .set("Authorization", `${authToken}`)
      .send(product1);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("GET /api/product/", () => {
  test("Not merchant should be able to get all products", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = new Product({
      sku: "123456",
      slug: "sample-product1",
      name: "Sample Product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    });
    const response = await request(app)
      .get("/api/product/")
      .set("Authorization", `${authToken}`)
      .send();

    // console.log(response.body);
    expect(response.statusCode).toBe(200);
  });

  test("Should return product if user is a merchant", async () => {});
});

describe("GET /api/product/:id", () => {
  // TODO
});

describe("PUT /api/product/:id", () => {
  test("Should add new product", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product = new Product({
      sku: "123456",
      slug: "sample-product",
      name: "Sample Product",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    });

    const response = await request(app)
      .put(`/api/product/${product._id}`)
      .set("Authorization", `${authToken}`)
      .send({
        product: {
          sku: "123456",
          slug: "sample-product",
          name: "Sample Product",
          imageUrl: "https://example.com/sample-product.jpg",
          imageKey: "sample-product.jpg",
          description: "This is a sample product description.",
          quantity: 10,
          price: 9.99,
          taxable: true,
          isActive: true,
          brand: brand._id,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Product has been updated successfully!"
    );
  });

  test("Should return 400 if sku is already in use", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = new Product({
      sku: "123456",
      slug: "sample-product1",
      name: "Sample Product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    });

    const product2 = new Product({
      sku: "1234567",
      slug: "sample-product2",
      name: "Sample Product2",
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

    const response1 = await request(app)
      .put(`/api/product/${product1._id}`)
      .set("Authorization", `${authToken}`)
      .send({
        product: {
          sku: "1234567",
          slug: "sample-product2",
          name: "Sample Product1",
          imageUrl: "https://example.com/sample-product.jpg",
          imageKey: "sample-product.jpg",
          description: "This is a sample product description.",
          quantity: 10,
          price: 9.99,
          taxable: true,
          isActive: true,
          brand: brand._id,
        },
      });
    expect(response1.statusCode).toBe(400);
    expect(response1.body.error).toBe("Sku or slug is already in use.");
  });

  test("simulated error", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product1 = new Product({
      sku: "123456",
      slug: "sample-product1",
      name: "Sample Product1",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    });

    jest.spyOn(Product, "findOne").mockImplementationOnce(() => {
      throw new Error("Error");
    });

    const response = await request(app)
      .put(`/api/product/${product1._id}`)
      .set("Authorization", `${authToken}`)
      .send({
        product: {
          sku: "123456",
          slug: "sample-product1",
          name: "Sample Product1",
          imageUrl: "https://example.com/sample-product.jpg",
          imageKey: "sample-product.jpg",
          description: "This is a sample product description.",
          quantity: 10,
          price: 9.99,
          taxable: true,
          isActive: true,
          brand: brand._id,
        },
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("PUT /api/product/:id/active", () => {
  test("Should update product active status", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product = new Product({
      sku: "123456",
      slug: "sample-product",
      name: "Sample Product",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    });

    const response = await request(app)
      .put(`/api/product/${product._id}/active`)
      .set("Authorization", `${authToken}`)
      .send({
        product: {
          isActive: false,
        },
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "Product has been updated successfully!"
    );
  });

  test("simulated error", async () => {
    jest.spyOn(Product, "findOneAndUpdate").mockImplementationOnce(() => {
      throw new Error("Error");
    });
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product = new Product({
      sku: "123456",
      slug: "sample-product",
      name: "Sample Product",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    });

    const response = await request(app)
      .put(`/api/product/${product._id}/active`)
      .set("Authorization", `${authToken}`)
      .send({
        product: {
          isActive: false,
        },
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("DELETE /api/delete/:id", () => {
  test("Should delete product", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product = new Product({
      sku: "123456",
      slug: "sample-product",
      name: "Sample Product",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    });

    const response = await request(app)
      .delete(`/api/product/delete/${product._id}`)
      .set("Authorization", `${authToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Product has been deleted successfully!");

  });

  test("simulated error", async () => {
    const brand = new Brand({
      name: "Sample Brand",
      slug: "sample-brand",
      imageUrl: "https://example.com/sample-brand.jpg",
      description: "This is a sample brand description.",
      isActive: true,
    });

    const product = new Product({
      sku: "123456",
      slug: "sample-product",
      name: "Sample Product",
      imageUrl: "https://example.com/sample-product.jpg",
      imageKey: "sample-product.jpg",
      description: "This is a sample product description.",
      quantity: 10,
      price: 9.99,
      taxable: true,
      isActive: true,
      brand: brand._id,
    });
    jest.spyOn(Product, "deleteOne").mockImplementationOnce(() => {
      throw new Error("Error");
    }
    );
    const response = await request(app)
      .delete(`/api/product/delete/${product._id}`)
      .set("Authorization", `${authToken}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});
