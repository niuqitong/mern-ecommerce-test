const request = require("supertest");
const app = require("../../app"); // Import the app instance from app.js
const Brand = require("../../models/brand"); // Import the Brand model
const User = require("../../models/user")
const Contact = require("../../models/contact")
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ObjectId } = require("mongoose");
const mongoose = require('mongoose');


describe("contact APIs test", () => {
  let token;
  let original;
  let brands_db;

  beforeAll(async () => {
    const response = await request(app)
      .post("/api/contact/add")
      .send({
        name: 'John Doe',
        email: 'qitong.niu@gmail.com',
        message: 'This is a test message.',
      });

    expect(response.status).toBe(200);
  });
  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NDE3ZjAyNDIxN2Y2NTY1NDA5ODBiMiIsImlhdCI6MTY4MjA4NDkwMiwiZXhwIjoxNjgyNjg5NzAyfQ.lMx3gqhSw4qx-EClPZBsu_nySmYGWwTxlvFRsPrPgJ0
  afterAll(async () => {
    try {
      await Contact.deleteMany({});
      console.log("Database dropped successfully");
    } catch (err) {
      console.error("Error dropping database:", err);
    }
  });

  test("test POST on /api/contact/add", async () => {

    const response = await request(app)
      .post("/api/contact/add")
      .send({
        name: 'John Doe',
        email: 'qitong.niu@gmail.com',
        message: 'This is a test message.',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "A request already existed for same email address"
    );
  });

  test("test POST on /api/contact/add", async () => {

    const response = await request(app)
      .post("/api/contact/add")
      .send({
        name: 'John Doe',
        email: 'qitong.niu@gmeal.com',
        message: 'This is a test message.',
      });

    expect(response.status).toBe(200);
  });

  // each choice coverage
  test("test POST on /api/contact/add", async () => {

    const response = await request(app)
      .post("/api/contact/add")
      .send({
        email: 'qitong.niu@gmail.com',
        message: 'This is a test message.',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "You must enter description & name."
    );
  });
  test("test POST on /api/contact/add", async () => {

    const response = await request(app)
      .post("/api/contact/add")
      .send({
        name: 'John Doe',
        message: 'This is a test message.',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "You must enter an email address."
    );
  });
  test("test POST on /api/contact/add", async () => {

    const response = await request(app)
      .post("/api/contact/add")
      .send({
        name: 'John Doe',
        email: 'qitong.niu@gmail.com',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "You must enter a message."
    );
  });

  test("Simulate error at api/contact/add", async () => {
    jest.spyOn(Contact, "findOne").mockImplementationOnce(() => {
      throw new Error("Simulated error");
    });

    const response = await request(app)
      .post("/api/contact/add")
      .send({
        name: 'John Doe',
        email: 'qitong.niu@gg.com',
        message: 'This is a test message.',
      });;

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });

});
