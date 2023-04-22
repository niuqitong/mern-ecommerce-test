const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = require('../../../app');
const User = require('../../../models/user');
const keys = require('../../../config/keys');

const { ROLES, EMAIL_PROVIDER } = require('../../../constants');
const mongoose = require('mongoose');
const { secret, tokenLife } = keys.jwt;

jest.mock('../../../services/mailchimp');
const mailchimp = require('../../../services/mailchimp');

jest.mock('../../../services/mailgun');
const mailgun = require('../../../services/mailgun');

describe('Test /api/auth/', () => {
    let mockUser = {
        email: "test@test.com",
        password: "test123",
        firstName: "Test",
        lastName: "User",
    };

    async function createMockUser(mockUser) {
        const user = new User(mockUser);
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(user.password, salt);
        user.password = hash;
        await user.save();
        return user;
    }

    // insert mock user into database and mock mail service
    beforeEach(async () => {
        let dbUser = await createMockUser(mockUser);
        mockUser.id = dbUser.id;

        mailgun.sendEmail.mockResolvedValue(true);

    })

    // clear database after test
    afterEach(async () => {
        await User.deleteMany({});
    })

    describe('/login', () => {

        // black box testing
        it("should return 200 OK and the mock user's data with the correct request", async () => {
            const expectedRes = {
                success: true,
                token: undefined,
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
            expectedRes.token = response.body.token;
            expect(response.body).toMatchObject(expectedRes);
            expect(jwt.verify(response.body.token.split(' ')[1], secret)).toMatchObject({ id: mockUser.id });
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
            const newUser = await createMockUser({
                email: "111@gamil.com",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                provider: EMAIL_PROVIDER.Google
            })

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
            const newUser = await createMockUser({
                email: "123@facebook.com",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                provider: EMAIL_PROVIDER.Facebook
            })
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
        /*
        There is only one branch not covered in the login function, which is the if(!token) branch.
        However, this branch is not possible to be reached because the jwt.sign function will always return a not-null token. And we think there is no need to test this branch (only one line of code)
        */
    });

    describe('/register', () => {

        beforeAll(() => {
            mailchimp.subscribeToNewsletter.mockReturnValue(Promise.resolve({ status: 'subscribed' }));

        })

        // delete all users before each test and mock the mailchimp function
        beforeEach(async () => {

            await User.deleteMany({});
            await createMockUser(mockUser);

        })


        // black box testing
        it("should return 200 OK with valid register request", async () => {

            const registerRequest = {
                email: "123@123.com",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                isSubscribed: true
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);

            expect(response.statusCode).toBe(200);

            const expectedUser = await User.findOne({ email: registerRequest.email });

            const expectedRes = {
                success: true,
                subscribed: true,
                token: response.body.token,
                user: {
                    id: expectedUser.id,
                    email: expectedUser.email,
                    firstName: expectedUser.firstName,
                    lastName: expectedUser.lastName,
                    role: expectedUser.role,
                }
            };

            expect(response.body).toMatchObject(expectedRes);
            expect(jwt.verify(response.body.token.split(" ")[1], secret)).toMatchObject({
                id: expectedUser.id,
            });

            const dbUser = await User.findOne({ email: registerRequest.email });

            expect(bcrypt.compareSync(registerRequest.password, dbUser.password)).toBe(true);

            expect({ email: dbUser.email, password: dbUser.password, firstName: dbUser.firstName, lastName: dbUser.lastName, isSubscribed: true, role: dbUser.role }).toMatchObject({ ...registerRequest, role: ROLES.Member, password: dbUser.password });
        });

        // empty test
        it("should return 400 Bad Request with an empty email", async () => {
            const registerRequest = {
                email: "",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                isSubscribed: false
            }

            const expectedRes = {
                error: 'You must enter an email address.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

        });

        it("should return 400 Bad Request with an empty password", async () => {
            const registerRequest = {
                email: "123@123.com",
                password: "",
                firstName: "Test",
                lastName: "User",
                isSubscribed: false
            }

            const expectedRes = {
                error: 'You must enter a password.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);

            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an empty firstName/lastName", async () => {
            const registerRequest = {
                email: "123@123.com",
                password: "test123",
                firstName: "",
                lastName: "User",
                isSubscribed: false
            }

            const expectedRes = {
                error: 'You must enter your full name.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);

            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

            registerRequest.firstName = "Test";
            registerRequest.lastName = "";

            const response2 = await request(app).post('/api/auth/register').send(registerRequest);

            expect(response2.statusCode).toBe(400);
            expect(response2.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an empty isSubscribed", async () => {
            const registerRequest = {
                email: "123@123.com",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                isSubscribed: null
            };

            const response = await request(app).post('/api/auth/register').send(registerRequest);

            expect(response.statusCode).toBe(400);
        });

        // invalid test
        it("should return 400 Bad Request with an invalid email(wrong format)", async () => {
            // format invalid
            const registerRequest = {
                email: "123",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                isSubscribed: true
            }

            const expectedRes = {
                error: 'You must enter a valid email address.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

        });

        it("should return 400 Bad Request with an invalid email(already exists)", async () => {
            // email already exists
            const registerRequest = {
                email: mockUser.email,
                password: "test123",
                firstName: "Test",
                lastName: "User",
                isSubscribed: true
            }

            const expectedRes = {
                error: 'That email address is already in use.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

        });

        it("should return 400 Bad Request with an invalid email(wrong class (array, function, etc))", async () => {
            // email is an array
            const registerRequest = {
                email: ["123@123.com", mockUser.email],
                password: "test123",
                firstName: "Test",
                lastName: "User",
                isSubscribed: true
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

            // email is a function
            registerRequest.email = () => { return "123@123.com" };

            const response2 = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response2.statusCode).toBe(400);
            expect(response2.body).toMatchObject(expectedRes);

            // email is an object
            registerRequest.email = {
                email: { email: "123@123.com" }
            }

            const response3 = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response3.statusCode).toBe(400);
            expect(response3.body).toMatchObject(expectedRes);

        });

        // For password and firstName/lastName/isSubscribed, apply the same type of tests as above.
        it("should return 400 Bad Request with an invalid password(wrong class)", async () => {
            const registerRequest = {
                email: "123@123.com",
                password: ["123", "test123"],
                firstName: "Test",
                lastName: "User",
                isSubscribed: true
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid firstName/lastName(wrong class)", async () => {
            const registerRequest = {
                email: "123@123.com",
                password: "test123",
                firstName: ["Test", "Test2"],
                lastName: "User",
                isSubscribed: true
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);

            registerRequest.firstName = "Test";
            registerRequest.lastName = ["User", "User2"];

            const response2 = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response2.statusCode).toBe(400);
            expect(response2.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid isSubscribed(wrong class)", async () => {
            const registerRequest = {
                email: "123@123.com",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                isSubscribed: 123
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        // white box testing
        // if (result.status === 'subscribed')  be false:
        it("should return 400 when other are valid and isSubscribed is true but email is wrong", async () => {
            // change the mock
            mailchimp.subscribeToNewsletter.mockReturnValueOnce(false);
            const registerRequest = {
                email: "123",
                password: "test123",
                firstName: "Test",
                lastName: "User",
                isSubscribed: true
            }

            const expectedRes = {
                error: 'You must enter a valid email address.',
            }

            const response = await request(app).post('/api/auth/register').send(registerRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

    });

    describe('/forgot', () => {
        // only one input email
        it("should return 200 OK with a valid email", async () => {

            const forgotRequest = {
                email: mockUser.email
            }

            const expectedRes = {
                success: true,
                message: 'Please check your email for the link to reset your password.'
            }

            const response = await request(app).post('/api/auth/forgot').send(forgotRequest);
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject(expectedRes);

            const user = await User.findOne({ email: mockUser.email });
            console.log(user);
            expect(user.resetPasswordToken).toBeDefined();
            expect(user.resetPasswordExpires).toBeDefined();
        });

        it("should return 400 Bad Request with an empty email(wrong format)", async () => {
            const forgotRequest = {
                email: ""
            }

            const expectedRes = {
                error: 'You must enter an email address.',
            }

            const response = await request(app).post('/api/auth/forgot').send(forgotRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid email", async () => {
            const forgotRequest = {
                email: "123"
            }

            const expectedRes = {
                error: 'No user found for this email address.',
            }

            const response = await request(app).post('/api/auth/forgot').send(forgotRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid email(wrong class (array))", async () => {
            const forgotRequest = {
                email: ["123@1123.com", mockUser.email]
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.',
            }

            const response = await request(app).post('/api/auth/forgot').send(forgotRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid email(wrong class (object))", async () => {
            const forgotRequest = {
                email: {
                    email: mockUser.email
                }
            };

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.',
            }

            const response = await request(app).post('/api/auth/forgot').send(forgotRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        // the branch coverage has been achieved by testing the above cases. No need to test more.

    });

    describe('/reset/:token', () => {
        let resetPasswordToken = "123";

        // only after forgot can be reseted
        // there is a bug in forgot, so here we manually set the resetPasswordToken and resetPasswordExpires
        beforeEach(async () => {
            const user = await User.findByIdAndUpdate(mockUser.id, { resetPasswordToken: resetPasswordToken, resetPasswordExpires: Date.now() + 3600000 }, { new: true });
        })

        afterEach(async () => {
            await User.findOneAndUpdate({ email: mockUser.email }, { resetPasswordToken: undefined, resetPasswordExpires: undefined });
        });

        it("should reset password and return 200 OK with a valid token and password", async () => {
            const resetUrl = '/api/auth/reset/' + resetPasswordToken;
            const resetRequest = {
                password: "123123123"
            }

            const expectedRes = {
                success: true,
                message:
                    'Password changed successfully. Please login with your new password.'
            };



            const response = await request(app).post(resetUrl).send(resetRequest);
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject(expectedRes);

            const user = await User.findOne({ email: mockUser.email });
            expect(user.resetPasswordToken).toBeUndefined();
            expect(user.resetPasswordExpires).toBeUndefined();
            expect(bcrypt.compareSync(resetRequest.password, user.password)).toBe(true);
        });

        it("should return 400 Bad Request with an empty password", async () => {
            const resetUrl = '/api/auth/reset/' + resetPasswordToken;
            const resetRequest = {
                password: ""
            }

            const expectedRes = {
                error: 'You must enter a password.',
            };

            const response = await request(app).post(resetUrl).send(resetRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid password (array)", async () => {
            // array
            const resetUrl = '/api/auth/reset/' + resetPasswordToken;
            const resetRequest = {
                password: ["123123123", "123123123"]
            }

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.',
            };

            const response = await request(app).post(resetUrl).send(resetRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid password (object)", async () => {
            // object
            const resetUrl = '/api/auth/reset/' + resetPasswordToken;
            const resetRequest = {
                password: {
                    password: "123123123"
                }
            }



            const response = await request(app).post(resetUrl).send(resetRequest);
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 Bad Request with an invalid password (function)", async () => {

            const resetUrl = '/api/auth/reset/' + resetPasswordToken;
            const resetRequest = {
                password: function () {
                    return "123123123";
                }
            }

            const response = await request(app).post(resetUrl).send(resetRequest);
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 Bad Request with an invalid token (expired)", async () => {

            await User.findOneAndUpdate({ email: mockUser.email }, { resetPasswordExpires: Date.now() - 3600000 });

            const resetUrl = '/api/auth/reset/' + resetPasswordToken;
            const resetRequest = {
                password: "123123123"
            }

            const expectedRes = {
                error: 'Your token has expired. Please attempt to reset your password again.'
            };

            const response = await request(app).post(resetUrl).send(resetRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid token (wrong format)", async () => {
            const resetUrl = '/api/auth/reset/' + "{token: () => {console.log('hello')}}";
            const resetRequest = {
                password: "123123123"
            }

            const response = await request(app).post(resetUrl).send(resetRequest);
            expect(response.statusCode).toBe(400);
        });

        // already branch covered
    });

    describe('/reset (auth)', () => {

        let token;

        beforeEach(async () => {
            token = "Bearer " + jwt.sign({ id: mockUser.id }, secret, { expiresIn: tokenLife });
        });

        it("should reset password and return 200 OK with a valid password and authorization", async () => {

            const resetRequest = {
                password: mockUser.password,
                confirmPassword: "newPassword"
            };

            const expectedRes = {
                success: true,
                message: 'Password changed successfully. Please login with your new password.'
            };

            const response = await request(app).post('/api/auth/reset').set('Authorization', token).send(resetRequest);
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject(expectedRes);

            const user = await User.findOne({ email: mockUser.email });
            expect(bcrypt.compareSync(resetRequest.confirmPassword, user.password)).toBe(true);
        });

        it("should return 400 Bad Request with an empty password", async () => {
            const resetRequest = {
                password: "",
                confirmPassword: "newPassword"
            };

            const expectedRes = {
                error: 'You must enter a password.',
            };

            const response = await request(app).post('/api/auth/reset').set('Authorization', token).send(resetRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with wrong password", async () => {
            const resetRequest = {
                password: "wrongPassword",
                confirmPassword: "newPassword"
            };

            const expectedRes = {
                error: 'Please enter your correct old password.',
            };

            const response = await request(app).post('/api/auth/reset').set('Authorization', token).send(resetRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid password (wrong class)", async () => {
            const resetRequest = {
                password: ["123123123", "123123123"],
                confirmPassword: "newPassword"
            };

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.',
            };

            const response = await request(app).post('/api/auth/reset').set('Authorization', token).send(resetRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 400 Bad Request with an invalid confirmPassword (wrong class)", async () => {
            const resetRequest = {
                password: mockUser.password,
                confirmPassword: ["123123123", "123123123"]
            };

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.',
            };

            const response = await request(app).post('/api/auth/reset').set('Authorization', token).send(resetRequest);
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject(expectedRes);
        });

        it("should return 401 Unauthorized with an invalid token (expired)", async () => {
            token = "Bearer " + jwt.sign({ id: mockUser.id }, secret, { expiresIn: -1 });

            const resetRequest = {
                password: mockUser.password,
                confirmPassword: "newPassword"
            };


            const response = await request(app).post('/api/auth/reset').set('Authorization', token).send(resetRequest);
            expect(response.statusCode).toBe(401);
            expect(response.text).toBe('Unauthorized');
        });

        it("should return 401 Unauthorized with an invalid token (wrong format)", async () => {
            token = "Bearer " + "{token: () => {console.log('hello')}}";

            const resetRequest = {
                password: mockUser.password,
                confirmPassword: "newPassword"
            };

            const response = await request(app).post('/api/auth/reset').set('Authorization', token).send(resetRequest);
            expect(response.statusCode).toBe(401);
            expect(response.text).toBe('Unauthorized');
        });

        // white box testing
        // if(!email) branch
        it("should return 401 Unauthorized when the user's email is empty", async () => {
            await User.findOneAndUpdate({ email: mockUser.email }, { email: "" });

            const resetRequest = {
                password: mockUser.password,
                confirmPassword: "newPassword"
            };

            const response = await request(app).post('/api/auth/reset').set('Authorization', token).send(resetRequest);

            expect(response.statusCode).toBe(401);
            expect(response.text).toBe('Unauthenticated');
        });

        // There is only one if(!existingUser) branch left
        // however, this is not reachable because the existingUser cannot be null as email is not empty and the authorization is valid(there exists a user with the id in the token)

    });
});