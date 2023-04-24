const request = require("supertest");
const app = require("../../app");
const mongoose = require("mongoose");
const Order = require("../../models/order");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const User = require("../../models/user");
const store = require("../../utils/store");
const { ROLES } = require("../../constants");
const bcrypt = require("bcryptjs");
// const jest = require('jest');

describe("Orders API", () => {
  let userToken, adminToken, anotherUserToken;
  let user, admin, admin_cart, user_cart;

  beforeAll(async () => {

    try {
      await User.deleteMany({});
      await Order.deleteMany({});
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

      const anotherUser = new User({
        name: "Another Test User",
        email: "another@example.com",
        password: "password",
        role: ROLES.Member,
      });
      const salt2 = await bcrypt.genSalt(10);
      const hash2 = await bcrypt.hash(anotherUser.password, salt2);
      anotherUser.password = hash2;
      await anotherUser.save();
      // const anotherUserToken = anotherUser.generateAuthToken();
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
      email: "another@example.com",
      password: "password",
    });
    anotherUserToken = anotherResponse.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Order.deleteMany({});
    // await mongoose.disconnect();
  });

  beforeEach(async () => {
    const product = new Product({
      name: "Test Product",
      price: 10,
      quantity: 100,
    });
    await product.save();

    admin_cart = new Cart({
      products: [
        {
          product: product._id,
          quantity: 1,
        },
      ],
    });
    await admin_cart.save();
    user_cart = new Cart({
      products: [
        {
          product: product._id,
          quantity: 1,
        },
      ],
    });
    await user_cart.save();
  });

  afterEach(async () => {
    await Product.deleteMany({}); // Remove all products
    await Cart.deleteMany({}); // Remove all carts
    await Order.deleteMany({});
  });

  describe("POST /add", () => {
    it("should create a new order", async () => {
      const res = await request(app)
        .post("/api/order/add")
        .set("Authorization", `${userToken}`)
        .send({
          cartId: user_cart._id,
          total: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBeTruthy();
      expect(res.body.message).toBe("Your order has been placed successfully!");
      expect(res.body.order._id).toBeDefined();
    });

    it("should return an error if cartId is not provided", async () => {
      const res = await request(app)
        .post("/api/order/add")
        .set("Authorization", `${userToken}`)
        .send({
          total: 10,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        "Your request could not be processed. Please try again."
      );
    });

    // it("should return an error if total is not provided", async () => {
    //   const product = new Product({
    //     name: "Test Product",
    //     price: 10,
    //     quantity: 100,
    //   });
    //   await product.save();

    //   const cart = new Cart({
    //     products: [
    //       {
    //         product: product._id,
    //         quantity: 1,
    //       },
    //     ],
    //   });
    //   await cart.save();

    //   const res = await request(app)
    //     .post("/api/order/add")
    //     .set("Authorization", `${userToken}`)
    //     .send({
    //       cartId: cart._id,
    //     });

    //   expect(res.status).toBe(200);
    //   // expect(res.body.error).toBe('Your request could not be processed. Please try again.');
    // });
  });


  describe("GET /search", () => {
    it("should return empty orders array if search query is not a valid ObjectId", async () => {
      const res = await request(app)
        .get("/api/order/search?search=invalidId")
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders).toEqual([]);
    });

    it("should return matching orders for admin user", async () => {

      const order = new Order({
        user: admin._id,
        cart: admin_cart._id,
        total: 10,
      });
      await order.save();

      const res = await request(app)
        .get(`/api/order/search?search=${order._id}`)
        .set("Authorization", `${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBe(1);
      expect(res.body.orders[0]._id).toBe(order._id.toString());
    });


    it("should return matching orders for customer user", async () => {
      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10,
      });
      await order.save();

      const res = await request(app)
        .get(`/api/order/search?search=${order._id}`)
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBe(1);
      expect(res.body.orders[0]._id).toBe(order._id.toString());
    });

    it("should not return matching orders for different users", async () => {
      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10,
      });
      await order.save();

      const res = await request(app)
        .get(`/api/order/search?search=${order._id}`)
        .set("Authorization", `${anotherUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders).toEqual([]);
    });

    it("Should return an error", async () => {
      const mockFindOneAndUpdate = jest.spyOn(Order, "find");
      mockFindOneAndUpdate.mockImplementationOnce(() => {
        throw new Error("Error search order");
      });

      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10,
      });
      await order.save();

      const response = await request(app)
        .get(`/api/order/search?search=${order._id}`)
        .set("Authorization", `${adminToken}`);

      expect(response.status).toBe(400);

      mockFindOneAndUpdate.mockRestore();
    });
  });

  describe("GET /api/order", () => {
    it("should return paginated orders", async () => {
      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10 * (2 + 1),
      });
      await order.save();

      const res = await request(app)
        .get("/api/order?page=1&limit=10")
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBe(1);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.count).toBe(1);

      // const res1 = await request(app)
      //   .get("/api/order")
      //   .set("Authorization", `${userToken}`);

      // expect(res1.status).toBe(200);
    });
    it("should return paginated orders", async () => {
      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10 * (2 + 1),
      });
      await order.save();

      const res = await request(app)
        .get("/api/order")
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBe(1);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.count).toBe(1);

      // const res1 = await request(app)
      //   .get("/api/order")
      //   .set("Authorization", `${userToken}`);

      // expect(res1.status).toBe(200);
    });
  });

  describe("GET /api/order/me - Order Pagination for Authenticated User", () => {
    it("should return paginated orders for authenticated user", async () => {
      const orders = [];

      for (let i = 0; i < 15; i++) {
        const order = new Order({
          user: user._id,
          cart: user_cart._id,
          total: 10 * (i + 1),
        });
        await order.save();
        orders.push(order);
      }

      const res = await request(app)
        .get("/api/order/me?page=1&limit=10")
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBe(10);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.count).toBe(15);

    });
    it("should return paginated orders for authenticated user", async () => {
      const orders = [];

      for (let i = 0; i < 15; i++) {
        const order = new Order({
          user: user._id,
          cart: user_cart._id,
          total: 10 * (i + 1),
        });
        await order.save();
        orders.push(order);
      }

      const res = await request(app)
        .get("/api/order/me")
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBe(10);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.count).toBe(15);

    });
  });

  describe("GET /api/order/:orderId - Get Order Details", () => {
    it("should return order details for authenticated user", async () => {
      // Create an order with the previously created user and cart

      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10,
      });
      await order.save();

      const res = await request(app)
        .get(`/api/order/${order._id}`)
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order._id).toBe(order._id.toString());
      expect(res.body.order.total).toBe(order.total);

      // Calculate tax and compare
      const formattedOrder = store.caculateTaxAmount({
        _id: order._id,
        total: order.total,
        created: order.created,
        products: order.cart.products,
      });

      expect(res.body.order.totalTax).toBe(formattedOrder.totalTax);
      expect(res.body.order.totalWithTax).toBe(formattedOrder.totalWithTax);
    });

    it("should return order details for authenticated admin", async () => {
      // Create an order with the previously created user and cart

      const order = new Order({
        user: admin._id,
        cart: admin_cart._id,
        total: 10,
      });
      await order.save();

      const res = await request(app)
        .get(`/api/order/${order._id}`)
        .set("Authorization", `${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order._id).toBe(order._id.toString());
      expect(res.body.order.total).toBe(order.total);

      // Calculate tax and compare
      const formattedOrder = store.caculateTaxAmount({
        _id: order._id,
        total: order.total,
        created: order.created,
        products: order.cart.products,
      });

      expect(res.body.order.totalTax).toBe(formattedOrder.totalTax);
      expect(res.body.order.totalWithTax).toBe(formattedOrder.totalWithTax);
    });

    it("should return a 404 error for a non-existent order", async () => {
      const res = await request(app)
        .get("/api/order/unknownorderid")
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        "Your request could not be processed. Please try again."
      );
    });

    it("should return a 404 error for an order that does not belong to the user", async () => {
      // Create an order with the userTwo and cart

      const order = new Order({
        user: admin._id,
        cart: user_cart._id,
        total: 10,
      });
      await order.save();

      const res = await request(app)
        .get(`/api/order/${order._id}`)
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(
        `Cannot find order with the id: ${order._id}.`
      );
    });
  });

  describe("DELETE /api/order/cancel/:orderId - Cancel and Delete Order", () => {
    it("should cancel and delete the order for authenticated user", async () => {
      // Create a cart with products
      // Create an order with the previously created user and cart
      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10,
      });
      await order.save();

      const res = await request(app)
        .delete(`/api/order/cancel/${order._id}`)
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Check if the order has been deleted
      const deletedOrder = await Order.findById(order._id);
      expect(deletedOrder).toBeNull();

      // Check if the cart has been deleted
      const deletedCart = await Cart.findById(user_cart._id);
      expect(deletedCart).toBeNull();
    });

    it("should return a 400 error for a non-existent order", async () => {
      const res = await request(app)
        .delete("/api/order/cancel/unknownorderid")
        .set("Authorization", `${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        "Your request could not be processed. Please try again."
      );
    });
  });

  describe("PUT /api/order/status/item/:itemId - Update Item Status", () => {
    it("should update the item status and cancel the order if all items are canceled", async () => {
      const product = new Product({
        name: "Test Product",
        price: 10,
        quantity: 100,
      });
      await product.save();
      const productTwo = new Product({
        name: "Test Product2",
        price: 100,
        quantity: 100,
      });
      await productTwo.save();

      const cart = new Cart({
        products: [
          {
            product: product._id,
            quantity: 1,
          },
          {
            product: productTwo._id,
            quantity: 1,
          },
        ],
      });
      await cart.save();

      const order = new Order({
        user: user._id,
        cart: cart._id,
        total: 10,
      });
      await order.save();

      // Update item status
      const itemId = cart.products[0]._id;
      let res = await request(app)
        .put(`/api/order/status/item/${itemId}`)
        .set("Authorization", `${userToken}`)
        .send({
          orderId: order._id,
          cartId: cart._id,
          status: "Cancelled",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Item has been cancelled successfully!");

      // Update the second item status
      const itemId2 = cart.products[1]._id;
      res = await request(app)
        .put(`/api/order/status/item/${itemId2}`)
        .set("Authorization", `${userToken}`)
        .send({
          orderId: order._id,
          cartId: cart._id,
          status: "Cancelled",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.orderCancelled).toBe(true);
      expect(res.body.message).toBe(
        "Your order has been cancelled successfully"
      );
    });

    it("should cancel, admin", async () => {
      const order = new Order({
        user: admin._id,
        cart: admin_cart._id,
        total: 10,
      });
      await order.save();

      // Update item status
      const itemId = admin_cart.products[0]._id;
      let res = await request(app)
        .put(`/api/order/status/item/${itemId}`)
        .set("Authorization", `${adminToken}`)
        .send({
          orderId: order._id,
          cartId: admin_cart._id,
          status: "Cancelled",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Order has been cancelled successfully");
    });

    it("should update, customer", async () => {
      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10,
      });
      await order.save();

      // Update item status
      const itemId = user_cart.products[0]._id;
      let res = await request(app)
        .put(`/api/order/status/item/${itemId}`)
        .set("Authorization", `${adminToken}`)
        .send({
          orderId: order._id,
          cartId: user_cart._id,
          status: "Processing",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        "Item status has been updated successfully!"
      );
    });

    it("should update to canceled by default, customer", async () => {
      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10,
      });
      await order.save();

      // Update item status
      const itemId = user_cart.products[0]._id;
      let res = await request(app)
        .put(`/api/order/status/item/${itemId}`)
        .set("Authorization", `${adminToken}`)
        .send({
          orderId: order._id,
          cartId: user_cart._id,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        "Order has been cancelled successfully"
      );
    });
    it("simulate err at update, customer", async () => {
      const order = new Order({
        user: user._id,
        cart: user_cart._id,
        total: 10,
      });
      await order.save();

      const mockFindOneAndUpdate = jest.spyOn(Cart, "findOne");
      mockFindOneAndUpdate.mockImplementationOnce(() => {
        throw new Error("Error while updating order status");
      });

      // Update item status
      const itemId = user_cart.products[0]._id;
      let res = await request(app)
        .put(`/api/order/status/item/${itemId}`)
        .set("Authorization", `${adminToken}`)
        .send({
          orderId: order._id,
          cartId: user_cart._id,
          status: "Processing",
        });

      expect(res.status).toBe(400);
      
    });
  });
});
