const request = require("supertest");
const app = require("../../app"); // Import the app instance from app.js
const Brand = require("../../models/brand"); // Import the Brand model
const User = require("../../models/user");
const Contact = require("../../models/contact");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongoose");
const { ROLES } = require("../../constants");
const mongoose = require("mongoose");


describe("Search Endpoint Tests", () => {
  let admin_token;

  beforeAll(async () => {
    // Clean up the test database and insert some test users
    try {
      await User.deleteMany({});
      const user = new User({
        email: "admin@gmeal.com",
        password: "password",
        firstName: "admin",
        lastName: "admin",
        role: ROLES.Admin,
      });

      const existingUser = await User.findOne({ email: user.email });
      console.log("existingUser", existingUser);
      if (existingUser) throw new Error("user collection is seeded!");

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(user.password, salt);
      user.password = hash;

      await user.save();
    } catch (error) {
      console.log(
        `${chalk.red("x")} ${chalk.red("error while seeding database")}`
      );
      console.log(error);
      return null;
    }

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@gmeal.com", // Replace with valid email
      password: "password", // Replace with valid password
    });
    admin_token = loginResponse.body.token;
    const testUsers = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "123456",
      },
      {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "123456",
      },
      {
        firstName: "Bob",
        lastName: "Smith",
        email: "bob@example.com",
        password: "123456",
      },
    ];

    await User.insertMany(testUsers);
  });

  test("Should return users matching the search query", async () => {
    const response = await request(app)
      .get("/api/user/search?search=doe")
      .set("Authorization", `${admin_token}`);

    expect(response.status).toBe(200);
    expect(response.body.users.length).toBe(2);
    expect(
      response.body.users.some((user) => user.email === "john@example.com")
    ).toBe(true);
    expect(
      response.body.users.some((user) => user.email === "jane@example.com")
    ).toBe(true);
  });

  test("Should return paginated users", async () => {
    const response = await request(app)
      .get("/api/user")
      .query({ page: 1, limit: 2 })
      .set("Authorization", `${admin_token}`);

    expect(response.status).toBe(200);
    expect(response.body.users.length).toBe(2);
    expect(response.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  test("Should return paginated users", async () => {
    const response = await request(app)
      .get("/api/user")
      .set("Authorization", `${admin_token}`);

    expect(response.status).toBe(200);
    expect(response.body.users.length).toBe(4);
    expect(response.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  test("Should return the user's own information", async () => {
    const response = await request(app)
      .get("/api/user/me")
      .set("Authorization", `${admin_token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("admin@gmeal.com");
  });

  test("Should update the user's own information", async () => {
    const response = await request(app)
      .put("/api/user")
      .set("Authorization", `${admin_token}`)
      .send({ profile: { firstName: "UpdatedFirstName" } });

    expect(response.status).toBe(200);
    expect(response.body.user.firstName).toBe("UpdatedFirstName");
  });

  test("Should return an error when getting paginated users fails", async () => {
    const mockFind = jest.spyOn(User, "find");
    mockFind.mockImplementationOnce(() => {
      throw new Error("Error while getting paginated users");
    });
  
    const response = await request(app)
      .get("/api/user/search?search=doe")
      .set("Authorization", `${admin_token}`);

    expect(response.status).toBe(400);
  
    // Clean up the mock
    mockFind.mockRestore();
  });


  test("Should return an error when getting paginated users fails", async () => {
    const mockFind = jest.spyOn(User, "find");
    mockFind.mockImplementationOnce(() => {
      throw new Error("Error while getting paginated users");
    });
  
    const response = await request(app)
      .get("/api/user")
      .query({ page: 1, limit: 2 })
      .set("Authorization", `${admin_token}`);
  
    expect(response.status).toBe(400);
  
    // Clean up the mock
    mockFind.mockRestore();
  });

  test("Should return an error when getting the user's own information fails", async () => {
    const mockFindById = jest.spyOn(User, "findById");
    mockFindById.mockImplementationOnce(() => {
      throw new Error("Error while getting user's own information");
    });
  
    const response = await request(app)
      .get("/api/user/me")
      .set("Authorization", `${admin_token}`);
  
    expect(response.status).toBe(400);
  
    // Clean up the mock
    mockFindById.mockRestore();
  });

  test("Should return an error when updating the user's own information fails", async () => {
    const mockFindOneAndUpdate = jest.spyOn(User, "findOneAndUpdate");
    mockFindOneAndUpdate.mockImplementationOnce(() => {
      throw new Error("Error while updating user's own information");
    });
  
    const response = await request(app)
      .put("/api/user")
      .set("Authorization", `${admin_token}`)
      .send({ profile: { firstName: "UpdatedFirstName" } });
  
    expect(response.status).toBe(400);
  
    // Clean up the mock
    mockFindOneAndUpdate.mockRestore();
  });
  
  
  

});
