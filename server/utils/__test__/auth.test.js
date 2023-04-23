const jwt = require('jsonwebtoken');
require("dotenv").config();

const checkAuth = require("../../utils/auth");
const { jwt: { secret, tokenLife } } = require('../../config/keys');

describe("Test checkAuth", () => {
    const testId = 13111;

    it('should return decoded token with valid request', async () => {
        const req = {
            headers: {
                authorization: `Bearer ${jwt.sign({ id: testId }, secret, { expiresIn: tokenLife })}`
            }
        }
        const decodedToken = await checkAuth(req);
        expect(decodedToken.id).toBe(testId);
    });

    it('should return null with invalid request(expired)', async () => {
        const req = {
            headers: {
                authorization: `Bearer ${jwt.sign({ id: testId }, secret, { expiresIn: -1 })}`
            }
        }
        const decodedToken = await checkAuth(req);
        expect(decodedToken).toBeNull();
    });

    it('should return null with invalid request(no authorization)', async () => {
        const req = {
            headers: {}
        }
        const decodedToken = await checkAuth(req);
        expect(decodedToken).toBeNull();
    });

    it('should return null with invalid request(no token)', async () => {
        const decodedToken = await checkAuth();
        expect(decodedToken).toBeNull();
    });

    it('should return null with invalid request(invalid token)', async () => {
        const req = {
            headers: {
                authorization: `Bearafer ${jwt.sign({ id: testId }, secret, { expiresIn: tokenLife })}`
            }
        }
        const decodedToken = await checkAuth(req);
        expect(decodedToken).toBeNull();
    });

    it('should return null with invalid request(invalid token 2)', async () => {
        const req = {
            headers: {
                authorization: `Bearer ${jwt.sign({ id: testId }, secret, { expiresIn: tokenLife })}123123`
            }
        }
        const decodedToken = await checkAuth(req);
        expect(decodedToken).toBeNull();
    });

    it('should return null with invalid request(invalid token 3)', async () => {
        const req = {
            headers: {
                authorization: `${jwt.sign({ id: testId }, secret, { expiresIn: tokenLife })}`
            }
        };

        const decodedToken = await checkAuth(req);
        expect(decodedToken).toBeNull();
    });

    it('should return null with empty authorization', async () => {
        const req = {
            headers: {
                authorization: {}
            }
        }
        const decodedToken = await checkAuth(req);
        expect(decodedToken).toBeNull();
    });

    // white box
    // it is impossible to reach the if(!token) condition in checkAuth
    // because the if (!req.headers.authorization) condition will be true first and token would not be null as long as the authorization header is not empty
});