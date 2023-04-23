const request = require("supertest");
const app = require("../../app"); // Import the app instance from app.js
const auth = require("../../middleware/auth");
const Address = require("../../models/address");
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

describe("POST /api/address/add", () => {
  test("should add a new address", async () => {
    const newAddress = {
      user: userId,
      address: "3400 N Charles St",
      city: "Baltimore",
      state: "MD",
      country: "USA",
      zipCode: "21218",
      isDefault: false,
      created: "2022-04-19T10:00:00.000Z",
    };

    const response = await request(app)
      .post("/api/address/add")
      .set("Authorization", `${authToken}`)
      .send(newAddress);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    // expect(response.body.address).toBe('3400 N Charles St');
  });

  test("should throw an error when missing auth token", async () => {
    const newAddress = {
      user: userId,
      address: "3400 N Charles St",
      city: "Baltimore",
      state: "MD",
      country: "USA",
      zipCode: "21218",
      isDefault: false,
    };

    const response = await request(app)
      .post("/api/address/add")
      .send(newAddress);

    expect(response.status).toBe(401);
    // expect(response.body.error).toBe(
    //   'Your request could not be processed. Please try again.'
    // );
  });

  test("simulated error", async () => {
    const newAddress = {
      user: userId,
      address: "3400 N Charles St",
      city: "Baltimore",
      state: "MD",
      country: "USA",
      zipCode: "21218",
      isDefault: false,
    };

    jest.spyOn(Address.prototype, "save").mockImplementationOnce(() => {
      throw new Error("Error");
    });

    const response = await request(app)
      .post("/api/address/add")
      .set("Authorization", `${authToken}`)
      .send(newAddress);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("GET /api/address", () => {
  test("should get all addresses", async () => {
    const response = await request(app)
      .get("/api/address")
      .set("Authorization", `${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.addresses).toBeTruthy();
  });

  test("should throw an error when missing auth token", async () => {
    const response = await request(app).get("/api/address");

    expect(response.status).toBe(401);
  });

  test("simulated error", async () => {
    jest.spyOn(Address, "find").mockImplementationOnce(() => {
      throw new Error("Error");
    });

    const response = await request(app)
      .get("/api/address")
      .set("Authorization", `${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("GET /api/address/:id", () => {
  test("should get an address", async () => {
    const newAddress = {
      user: userId,
      address: "3400 N Charles St",
      city: "Baltimore",
      state: "MD",
      country: "USA",
      zipCode: "21218",
      isDefault: false,
      created: "2022-04-19T10:00:00.000Z",
    };

    const firstResponse = await request(app)
      .post("/api/address/add")
      .set("Authorization", `${authToken}`)
      .send(newAddress);

    const addressId = firstResponse.body.address._id;
    console.log(addressId);
    const response = await request(app)
      .get(`/api/address/${addressId}`)
      .set("Authorization", `${authToken}`);
    expect(response.body.address._id).toBe(addressId);
    expect(response.body.address.address).toBe("3400 N Charles St");
    expect(response.body.address.city).toBe("Baltimore");
    expect(response.body.address.state).toBe("MD");
    expect(response.body.address.country).toBe("USA");
    expect(response.body.address.zipCode).toBe("21218");
    expect(response.status).toBe(200);
    expect(response.body.address).toBeTruthy();
  });

  // this test is not working
  test("should throw error when no address found", async () => {
    const response = await request(app)
      .get("/api/address/randomId")
      .set("Authorization", `${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      `Cannot find Address with the id: randomId.`
    );
  });

  test("simulated error", async () => {
    jest.spyOn(Address, "findById").mockImplementationOnce(() => {
      throw new Error("Error");
    });

    const response = await request(app)
      .get("/api/address/randomId")
      .set("Authorization", `${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("PUT /api/address/:id", () => {
  test("should update an address", async () => {
    const newAddress = {
      user: userId,
      address: "3400 N Charles St",
      city: "Baltimore",
      state: "MD",
      country: "USA",
      zipCode: "21218",
      isDefault: false,
      created: "2022-04-19T10:00:00.000Z",
    };

    const firstResponse = await request(app)
      .post("/api/address/add")
      .set("Authorization", `${authToken}`)
      .send(newAddress);

    const addressId = firstResponse.body.address._id;
    const response = await request(app)
      .put(`/api/address/${addressId}`)
      .set("Authorization", `${authToken}`)
      .send({ address: "3401 N Charles St" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Address has been updated successfully!"
    );
  });

  test("simulated error", async () => {
    jest.spyOn(Address, "findByIdAndUpdate").mockImplementationOnce(() => {
      throw new Error("Error");
    });

    const response = await request(app)
      .put("/api/address/randomId")
      .set("Authorization", `${authToken}`)
      .send({ address: "3401 N Charles St" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("DELETE /api/address/delete/:id", () => {
  test("should delete an address", async () => {
    const newAddress = {
      user: userId,
      address: "3400 N Charles St",
      city: "Baltimore",
      state: "MD",
      country: "USA",
      zipCode: "21218",
      isDefault: false,
      created: "2022-04-19T10:00:00.000Z",
    };

    const firstResponse = await request(app)
      .post("/api/address/add")
      .set("Authorization", `${authToken}`)
      .send(newAddress);

    const addressId = firstResponse.body.address._id;
    const response = await request(app)
      .delete(`/api/address/delete/${addressId}`)
      .set("Authorization", `${authToken}`)
      .send({ _id: addressId });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Address has been deleted successfully!"
    );
    console.log(response.body);
  });

  test("simulated error", async () => {
    jest.spyOn(Address, "findByIdAndDelete").mockImplementationOnce(() => {
      throw new Error("Error");
    });

    const response = await request(app)
      .delete("/api/address/delete/randomId")
      .set("Authorization", `${authToken}`)
      .send({ _id: "randomId" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Your request could not be processed. Please try again."
    );
  });
});

describe("Integration Tests for Address", () => {
  test("should create new address", async () => {
    const newAddress = {
      user: userId,
      address: "3400 N Charles St",
      city: "Baltimore",
      state: "MD",
      country: "USA",
      zipCode: "21218",
      isDefault: false,
    };

    const firstResponse = await request(app)
      .post("/api/address/add")
      .set("Authorization", `${authToken}`)
      .send(newAddress);
    console.log(firstResponse.body);
    const addressId = firstResponse.body.address._id;
    expect(firstResponse.status).toBe(200);

    const secondResponse = await request(app)
      .get(`/api/address/${addressId}`)
      .set("Authorization", `${authToken}`);
    expect(secondResponse.body.address._id).toBe(addressId);
    expect(secondResponse.body.address.address).toBe("3400 N Charles St");
    expect(secondResponse.body.address.city).toBe("Baltimore");
    expect(secondResponse.body.address.state).toBe("MD");
    expect(secondResponse.body.address.country).toBe("USA");
    expect(secondResponse.body.address.zipCode).toBe("21218");
    expect(secondResponse.status).toBe(200);
  });

  test("should update an address", async () => {
    const newAddress = {
      user: userId,
      address: "3400 N Charles St",
      city: "Baltimore",
      state: "MD",
      country: "USA",
      zipCode: "21218",
      isDefault: false,
    };

    const firstResponse = await request(app)
      .post("/api/address/add")
      .set("Authorization", `${authToken}`)
      .send(newAddress);

    const addressId = firstResponse.body.address._id;
    const response = await request(app)
      .put(`/api/address/${addressId}`)
      .set("Authorization", `${authToken}`)
      .send({ address: "3401 N Charles St" });
    const secondResponse = await request(app)
      .get(`/api/address/${addressId}`)
      .set("Authorization", `${authToken}`);
    expect(secondResponse.body.address._id).toBe(addressId);
    expect(secondResponse.body.address.address).toBe("3401 N Charles St");
    expect(secondResponse.body.address.city).toBe("Baltimore");
    expect(secondResponse.body.address.state).toBe("MD");
    expect(secondResponse.body.address.country).toBe("USA");
    expect(secondResponse.body.address.zipCode).toBe("21218");
    expect(secondResponse.status).toBe(200);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Address has been updated successfully!"
    );
  });

  test("should delete an address", async () => {
    const newAddress = {
      user: userId,
      address: "3400 N Charles St",
      city: "Baltimore",
      state: "MD",
      country: "USA",
      zipCode: "21218",
      isDefault: false,
    };

    const firstResponse = await request(app)
      .post("/api/address/add")
      .set("Authorization", `${authToken}`)
      .send(newAddress);

    const addressId = firstResponse.body.address._id;
    const response = await request(app)
      .delete(`/api/address/delete/${addressId}`)
      .set("Authorization", `${authToken}`)
      .send({ _id: addressId });

    const secondResponse = await request(app)
      .get(`/api/address/${addressId}`)
      .set("Authorization", `${authToken}`);
    expect(secondResponse.status).toBe(404);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Address has been deleted successfully!"
    );
  });
});
