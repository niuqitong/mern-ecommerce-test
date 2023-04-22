const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = require('../../../app');
const User = require('../../../models/user');
const Category = require('../../../models/category');
const Product = require('../../../models/product');

const keys = require('../../../config/keys');
const { secret, tokenLife } = keys.jwt;

const { ROLES } = require('../../../constants');
const mongoose = require('mongoose');

describe('Test /api/category', () => {

    let user;
    let token;
    let mockCategory;
    let products = [];

    // create an admin user before all tests
    beforeAll(async () => {
        // create a user
        user = new User({
            name: 'Test User',
            email: 'test@test.com',
            password: 'test123',
            firstName: 'Test',
            lastName: 'User',
            role: ROLES.Admin
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();

        token = "Bearer " + jwt.sign({ id: user.id }, secret, { expiresIn: tokenLife });

        // create products
        for (let i = 0; i < 5; i++) {
            const product = new Product({
                name: `Test Product ${i}`,
                description: `Test Product ${i} Description`,
                price: 100 * i,
                quantity: 10 * i,
            });

            await product.save();
            products.push(product.id);
        }

        mockCategory = new Category({
            name: 'Test Category',
            description: 'Test Category Description',
            products: products,
        });

        await mockCategory.save();

        const mockCategory2 = new Category({
            name: 'Test Category 2',
            description: 'Test Category 2 Description',
            products: products,
            isActive: false,
        });

        await mockCategory2.save();
    });

    // delete all after all tests
    afterAll(async () => {
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        mongoose.connection.close();
    });

    describe('POST /add', () => {

        it('should return 200 OK with a valid token and admin user and valid request', async () => {
            const requestCat = {
                name: 'Test Add',
                description: 'Test Add Description',
                products: products,
                isActive: false
            };

            const respond = await request(app).post('/api/category/add').set('Authorization', token).send(requestCat);

            expect(respond.status).toBe(200);
            const cat = await Category.findOne({ name: requestCat.name });
            expect(cat).not.toBeNull();
            expect(respond.body.success).toBe(true);
            expect(respond.body.message).toBe('Category has been added successfully!');
            expect(respond.body.category._id).toBe(cat.id);
            expect(cat.name).toBe(requestCat.name);
            expect(cat.description).toBe(requestCat.description);
            expect(cat.isActive).toBe(requestCat.isActive);
            for (let i = 0; i < cat.products.length; i++) {
                expect(cat.products[i].toString()).toBe(products[i]);
            }
        });

        // request body 
        it('should return 400 Bad Request with empty name', async () => {
            const requestCat = {
                name: '',
                description: 'Test Add Description',
                products: products,
            };

            const respond = await request(app).post('/api/category/add').set('Authorization', token).send(requestCat);

            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('You must enter description & name.');
        });

        it('should return 400 Bad Request with empty description', async () => {
            const requestCat = {
                name: 'Test Add',
                description: '',
                products: products,
            };

            const respond = await request(app).post('/api/category/add').set('Authorization', token).send(requestCat);

            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('You must enter description & name.');
        });

        it('should return 200 OK with empty products', async () => {
            const requestCat = {
                name: 'Test Add 2',
                description: 'Test Add 2 Description',
                products: [],
            };

            const respond = await request(app).post('/api/category/add').set('Authorization', token).send(requestCat);

            expect(respond.status).toBe(200);
            const cat = await Category.findOne({ name: requestCat.name });
            expect(cat).not.toBeNull();
            expect(respond.body.success).toBe(true);
            expect(respond.body.message).toBe('Category has been added successfully!');
            expect(respond.body.category._id).toBe(cat.id);
            expect(cat.name).toBe(requestCat.name);
            expect(cat.description).toBe(requestCat.description);
            expect(cat.products.length).toBe(0);
        });

        it('should return 400 Bad Request with invalid name/description (wrong class like array/object)', async () => {
            // name is array
            const requestCat = {
                name: ['123', '321'],
                description: '123',
                products: products,
            };

            const respond = await request(app).post('/api/category/add').set('Authorization', token).send(requestCat);

            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Your request could not be processed. Please try again.');

            // description is object
            const requestCat2 = {
                name: '123',
                description: { a: 1 },
                products: products,
            };

            const respond2 = await request(app).post('/api/category/add').set('Authorization', token).send(requestCat2);
            expect(respond2.status).toBe(400);
            expect(respond2.body.error).toBe('Your request could not be processed. Please try again.');
        });

        // token
        it('should return 401 Unauthorized with invalid token(expired)', async () => {
            let expiredToken = "Bearer " + jwt.sign({ id: user.id }, secret, { expiresIn: 0 });

            const requestCat = {
                name: 'Test Add',
                description: 'Test Add Description',
                products: products,
            };

            const respond = await request(app).post('/api/category/add').set('Authorization', expiredToken).send(requestCat);

            expect(respond.status).toBe(401);
        });

        it('should return 401 Unauthorized with invalid token(wrong)', async () => {
            let wrongToken = "Bearer " + jwt.sign({ id: user.id }, 'wrong secret', { expiresIn: tokenLife });

            const requestCat = {
                name: 'Test Add',
                description: 'Test Add Description',
                products: products,
            };

            const respond = await request(app).post('/api/category/add').set('Authorization', wrongToken).send(requestCat);

            expect(respond.status).toBe(401);
        });

        // role
        it('should return 403 Forbidden with valid token but a member', async () => {
            const member = new User({
                email: '123',
                password: '123',
                role: ROLES.Member,
            });

            await member.save();

            let memberToken = "Bearer " + jwt.sign({ id: member.id }, secret, { expiresIn: tokenLife });

            const requestCat = {
                name: 'Test Add',
                description: 'Test Add Description',
                products: products,
            };

            const respond = await request(app).post('/api/category/add').set('Authorization', memberToken).send(requestCat);

            expect(respond.status).toBe(403);
            expect(respond.text).toBe('You are not allowed to make this request.');
        });

        it('should return 403 Forbidden with valid token but a merchant', async () => {
            const member = new User({
                email: '321',
                password: '321',
                role: ROLES.Merchant,
            });

            await member.save();

            let memberToken = "Bearer " + jwt.sign({ id: member.id }, secret, { expiresIn: tokenLife });

            const requestCat = {
                name: 'Test Add',
                description: 'Test Add Description',
                products: products,
            };

            const respond = await request(app).post('/api/category/add').set('Authorization', memberToken).send(requestCat);

            expect(respond.status).toBe(403);
            expect(respond.text).toBe('You are not allowed to make this request.');
        });

        // branch already covered
    });

    describe('GET /', () => {

        it('should return 200 OK and return categories', async () => {
            const respond = await request(app).get('/api/category');

            expect(respond.status).toBe(200);
            let categories = await Category.find({});

            expect(respond.body.categories.length).toBe(categories.length);
            expect(respond.body.categories).toMatchObject(JSON.parse(JSON.stringify(categories)));
        });

        // it seems it is not possible to reach at the error handler
    });

    describe('GET /list', () => {

        it('should return 200 OK and return active categories', async () => {
            const respond = await request(app).get('/api/category/list');

            expect(respond.status).toBe(200);
            let categories = await Category.find({ isActive: true });

            expect(respond.body.categories.length).toBe(categories.length);
            expect(respond.body.categories).toMatchObject(JSON.parse(JSON.stringify(categories)));
        });

        // it seems it is not possible to reach at the error handler
    });

    describe('GET /:id', () => {

        it('should return 200 OK and return mockCategory with the correct id ', async () => {
            const expectedCat = await Category.findById(mockCategory.id);

            const respond = await request(app).get('/api/category/' + mockCategory.id);

            expect(respond.status).toBe(200);
            const resCat = respond.body.category;

            expect(resCat._id).toBe(expectedCat.id);
            expect(resCat.name).toBe(expectedCat.name);
            expect(resCat.description).toBe(expectedCat.description);
            expect(resCat.products.length).toBe(expectedCat.products.length);

            for (let i = 0; i < resCat.products.length; i++) {
                expect(resCat.products[i]._id).toBe(expectedCat.products[i].toString());
            }
        });

        it('should return 404 Not Found with invalid id (wrong format)', async () => {
            const respond = await request(app).get('/api/category/123123');

            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Your request could not be processed. Please try again.');
        });

        it('should return 404 Not Found with invalid id (not found)', async () => {
            //  12 characters
            const respond = await request(app).get('/api/category/123123123123');

            expect(respond.status).toBe(404);
            expect(respond.body.message).toBe('No Category found.');
        });

        it('should return 404 Not Found with invalid id (array)', async () => {
            const respond = await request(app).get('/api/category/["123123123123"]');

            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Your request could not be processed. Please try again.');
        });
    });

    describe('PUT /:id', () => {

        let updateCat;

        beforeAll(async () => {
            // add a category to be updated
            updateCat = new Category({
                name: 'Test Update',
                description: 'Test Update Description',
                products: products,
                isActive: true,
            });

            await updateCat.save();
            // console.log(updateCat.id);
        });

        afterAll(async () => {
            await Category.findByIdAndDelete(updateCat.id);
        });

        it('should return 200 OK and update the category with valid token, auth and request', async () => {

            const requestUrl = '/api/category/' + updateCat.id;

            const requestCat = {
                category: {
                    name: 'Test Update New',
                    description: 'Test Update Description New',
                    products: [],
                    isActive: false,
                    slug: 'test-update-new'
                }
            };

            const expectedRes = {
                success: true,
                message: 'Category has been updated successfully!'
            }

            const respond = await request(app).put(requestUrl).set('Authorization', token).send(requestCat);
            expect(respond.status).toBe(200);
            expect(respond.body).toMatchObject(expectedRes);

            updateCat = await Category.findById(updateCat.id);
            expect(updateCat.name).toBe(requestCat.category.name);
            expect(updateCat.description).toBe(requestCat.category.description);
            expect(updateCat.products.length).toBe(requestCat.category.products.length);
            expect(updateCat.isActive).toBe(requestCat.category.isActive);
            expect(updateCat.slug).toBe(requestCat.category.slug);
        });

        // param
        it('should return 400 Bad Request with invalid id (wrong format)', async () => {
            const requestUrl = '/api/category/123123';

            const requestCat = {
                category: {
                    name: 'Test Update New',
                    description: 'Test Update Description New',
                    products: [],
                    isActive: false,
                    slug: 'test-update-neew'
                }
            };

            const respond = await request(app).put(requestUrl).set('Authorization', token).send(requestCat);
            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Your request could not be processed. Please try again.');
        });

        // role and token do not need to be tested again

        // body
        it('should return 400 Bad Request with invalid request (wrong format of category)', async () => {
            const requestUrl = '/api/category/' + updateCat.id;

            const requestCat = {
                category: {
                    name: ['Test Update New'],
                    description: { a: 'Test Update Description New' },
                    products: [],
                    isActive: false,
                    slug: 'test-update-new'
                }
            };

            const respond = await request(app).put(requestUrl).set('Authorization', token).send(requestCat);
            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Your request could not be processed. Please try again.');
        });

        it('should return 400 Bad Request with invalid request (category is array)', async () => {
            const requestUrl = '/api/category/' + updateCat.id;

            const requestCat = { category: [mockCategory, mockCategory] };

            const respond = await request(app).put(requestUrl).set('Authorization', token).send(requestCat);
            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Your request could not be processed. Please try again.');
        });

        it('should return 400 Bad Request with duplicate slug', async () => {
            const requestUrl = '/api/category/' + updateCat.id;

            const requestCat = {
                category: {
                    name: 'Test Update New',
                    description: 'Test Update Description New',
                    products: [],
                    isActive: false,
                    slug: mockCategory.slug
                }
            };

            const respond = await request(app).put(requestUrl).set('Authorization', token).send(requestCat);
            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Slug is already in use.');
        });


    });

    // basically the same as PUT /:id so no need to do too much testing
    describe('PUT /:id/active', () => {

        let updateCat;

        beforeAll(async () => {
            // add a category to be updated
            updateCat = new Category({
                name: 'Test Update',
                description: 'Test Update Description',
                products: products,
                isActive: false,
            });

            await updateCat.save();
            // console.log(updateCat.id);
        });

        afterAll(async () => {
            await Category.findByIdAndDelete(updateCat.id);
        });

        it('should return 200 OK and update the category with valid token, auth and request(isActivate is true)', async () => {

            const requestUrl = '/api/category/' + updateCat.id + '/active';

            const requestCat = {
                category: {
                    name: 'Test Update New',
                    description: 'Test Update Description New',
                    isActive: true
                }
            };

            const expectedRes = {
                success: true,
                message: 'Category has been updated successfully!'
            }

            const respond = await request(app).put(requestUrl).set('Authorization', token).send(requestCat);
            expect(respond.status).toBe(200);
            expect(respond.body).toMatchObject(expectedRes);

            updateCat = await Category.findById(updateCat.id);
            expect(updateCat.isActive).toBe(requestCat.category.isActive);
        });

        it('should return 200 OK, deactivate products and update the category with valid token, auth and request(isActivate is false)', async () => {

            const requestUrl = '/api/category/' + updateCat.id + '/active';

            const requestCat = {
                category: {
                    name: 'Test Update New',
                    description: 'Test Update Description New',
                    isActive: false
                }
            };

            const expectedRes = {
                success: true,
                message: 'Category has been updated successfully!'
            }

            const respond = await request(app).put(requestUrl).set('Authorization', token).send(requestCat);
            expect(respond.status).toBe(200);
            expect(respond.body).toMatchObject(expectedRes);

            updateCat = await Category.findById(updateCat.id);
            expect(updateCat.isActive).toBe(requestCat.category.isActive);

            for (let i = 0; i < updateCat.products.length; i++) {
                let product = await Product.findById(updateCat.products[i]);
                expect(product.isActive).toBe(false); // all products should be deactivated
            }
        });

        // param
        it('should return 400 Bad Request with invalid id (wrong format)', async () => {
            const requestUrl = '/api/category/123123/active';

            const requestCat = {
                category: {
                    name: 'Test Update New',
                    description: 'Test Update Description New',
                    isActive: false
                }
            };

            const respond = await request(app).put(requestUrl).set('Authorization', token).send(requestCat);
            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Your request could not be processed. Please try again.');
        });

        // body
        it('should return 400 Bad Request with invalid request (wrong format of category)', async () => {
            const requestUrl = '/api/category/' + updateCat.id + '/active';

            const requestCat = {
                category: {
                    name: ['Test Update New'],
                    description: { a: 'Test Update Description New' },
                    isActive: 123123
                }
            };

            const respond = await request(app).put(requestUrl).set('Authorization', token).send(requestCat);
            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Your request could not be processed. Please try again.');
        });

    });

    describe('DELETE /delete/:id', () => {
        let deleteCat;

        beforeAll(async () => {
            // add a category to be updated
            deleteCat = new Category({
                name: 'Test Update',
                description: 'Test Update Description',
                products: products,
                isActive: false,
            });

            await deleteCat.save();
        });

        afterAll(async () => {
            await Category.findByIdAndDelete(deleteCat.id);
        });

        it('should return 200 OK and delete the category with valid token, role and request', async () => {
            const requestUrl = '/api/category/delete/' + deleteCat.id;

            const expectedRes = {
                success: true,
                message: 'Category has been deleted successfully!'
            }

            const respond = await request(app).delete(requestUrl).set('Authorization', token);
            expect(respond.status).toBe(200);
            expect(respond.body).toMatchObject(expectedRes);

            deleteCat = await Category.findById(deleteCat.id);
            expect(deleteCat).toBeNull();
        });

        // no need to test auth and role.

        // param
        it('should return 400 Bad Request with invalid id (wrong format)', async () => {
            const requestUrl = '/api/category/delete/123123';

            const respond = await request(app).delete(requestUrl).set('Authorization', token);
            expect(respond.status).toBe(400);
            expect(respond.body.error).toBe('Your request could not be processed. Please try again.');
        });

    });
});