const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = require('../../../app');
const User = require('../../../models/user');
const keys = require('../../../config/keys');

const { ROLES, EMAIL_PROVIDER } = require('../../../constants');
const { success } = require('react-notification-system-redux');
const mongoose = require('mongoose');
const { secret, tokenLife } = keys.jwt;

describe('Test /api/auth/', () => {
    let mockUser = {
        email: "test@test.com",
        password: "test123",
        firstName: "Test",
        lastName: "User",
    };

    // insert mock user into database and get a token
    beforeAll(async () => {
        const dbUser = new User(mockUser);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(dbUser.password, salt);
        dbUser.password = hash;
        const a = await dbUser.save((err, user) => {
            if (err) {
                console.log(err);
            }
        });

        mockUser.id = dbUser.id;
    })

    // clear database after test
    afterAll(async () => {
        await User.deleteMany({});
    })

    describe('/login', () => {

        // black box testing
        it("should return 200 OK and the mock user's data with the correct request", async () => {
            let token = jwt.sign({ id: mockUser.id }, secret, { expiresIn: tokenLife });

            const expectedRes = {
                success: true,
                token: `Bearer ${token}`,
                user: {
                    id: mockUser.id,
                    firstName: mockUser.firstName,
                    lastName: mockUser.lastName,
                    email: mockUser.email,
                    role: ROLES.Member
                }
            }

            const loginRequest = {
                email: mockUser.email,
                password: mockUser.password
            }

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject(expectedRes);
        })

        it("should return 400 Bad Request with wrong password", async () => {

            const loginRequest = {
                email: mockUser.email,
                password: "wrong password"
            }

            const expectedRes = {
                error: 'Password Incorrect',
                success: false
            }

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        })

        it("should return 400 Bad Request with wrong email", async () => {

            const loginRequest = {
                email: "wrong email",
                password: mockUser.password
            }

            const expectedRes = {
                error: 'No user found for this email address.',
            }

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

        })

        it("should return 400 Bad Request with an empty email", async () => {
            const loginRequest = {
                email: "",
                password: ""
            }

            const expectedRes = {
                error: 'You must enter an email address.',
            }

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

        })

        it("should return 400 Bad Request with an empty password", async () => {
            const loginRequest = {
                email: mockUser.email,
                password: ""
            }

            const expectedRes = {
                error: 'You must enter a password.',
            }

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

        })

        it("should return 400 Bad Request with undefined email or password", async () => {
            const loginRequest = {
            }

            const expectedRes = {
                error: 'You must enter an email address.',
            }

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

        })

        it("should return 400 Bad Request with the email that use different provider(google)", async () => {
            // create a new user with different provider
            const newUser = new User({
                email: "111@gamil.com",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                provider: EMAIL_PROVIDER.Google
            })

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newUser.password, salt);
            newUser.password = hash;

            await newUser.save();

            const loginRequest = {
                email: newUser.email,
                password: newUser.password
            }

            const expectedRes = {
                error: `That email address is already in use using ${newUser.provider} provider.`
            }

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        })

        it("should return 400 Bad Request with the email that use different provider(facebook)", async () => {
            // create a new user with different provider
            const newUser = new User({
                email: "123@facebook.com",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                provider: EMAIL_PROVIDER.Facebook
            })

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newUser.password, salt);
            newUser.password = hash;

            await newUser.save();

            const loginRequest = {
                email: newUser.email,
                password: newUser.password
            }

            const expectedRes = {
                error: `That email address is already in use using ${newUser.provider} provider.`
            }

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        })

        it("should return 400 Bad Request if email is an array", async () => {

            const loginRequest = {
                email: ["123@123.com", mockUser.email],
                password: mockUser.password
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        })

        it("should return 400 Bad Request if password is an array", async () => {

            const loginRequest = {
                email: mockUser.email,
                password: ["123", mockUser.password]
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request if email is an object", async () => {

            const loginRequest = {
                email: { email: mockUser.email },
                password: mockUser.password
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request if password is an object", async () => {

            const loginRequest = {
                email: mockUser.email,
                password: { password: mockUser.password }
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const response = await request(app).post('/api/auth/login').send(loginRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        // white box testing
        // branch coverage

        // if user's id is undefined
        it("should return 400 Bad Request if user's id is undefined", async () => {
            // create a new user with null id
            const newUser = new User({
                _id: undefined,
                email: "123@123.com",
                password: "test123",
            });

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newUser.password, salt);
            newUser.password = hash;

            await newUser.save();



        });
    });
});



