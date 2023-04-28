const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const app = require('../../app');
const keys = require('../../config/keys');
const Brand = require('../../models/brand');
const Review = require('../../models/review');
const User = require('../../models/user');
const Product = require('../../models/product');
const { REVIEW_STATUS } = require('../../constants');
const { NoEmitOnErrorsPlugin } = require('webpack');
const { secret, tokenLife } = keys.jwt;

// since auth middleware has been tested in many other places, we can bypass it here
// FATAL BUG: the functions do not check authorization.
describe('Test /api/review', () => {

    let mockUser;
    let token;
    let mockProduct;
    let mockBrand;

    beforeAll(async () => {

        mockUser = new User({
            firstName: 'John',
            lastName: 'Doe',
            email: 'review@test.com',
        });
        await mockUser.save();

        mockBrand = new Brand({
            name: 'Test Brand',
            description: 'Test Brand Description',
        });
        await mockBrand.save();

        token = "Bearer " + jwt.sign({ id: mockUser.id }, secret, { expiresIn: tokenLife });

        mockProduct = new Product({
            sku: 'test-product',
            name: 'Test Product',
            brand: mockBrand._id,
            price: 100,
            description: 'Test Product Description',
        });
        await mockProduct.save();
    });


    afterAll(async () => {
        await User.findByIdAndDelete(mockUser._id);
        await Product.findByIdAndDelete(mockProduct._id);
        await mongoose.disconnect();
    });

    describe('POST /add', () => {

        afterEach(async () => {
            await Review.deleteMany({});
        });

        it('should return 200 with a valid review and token', async () => {
            const requestReview = {
                product: mockProduct._id,
                title: 'Test Review',
                rating: 5,
                review: 'Test Review Description',
            };

            const expectedRes = {
                success: true,
                message: `Your review has been added successfully and will appear when approved!`,
            }

            const res = await request(app).post('/api/review/add').set('Authorization', token).send(requestReview);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(expectedRes);

            const review = await Review.findOne({ title: requestReview.title });
            expect(review).not.toBeNull();

            expect(res.body.review).toMatchObject(JSON.parse(JSON.stringify(review)));
        });

        it('should return 400 with an empty review', async () => {
            const requestReview = {};

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const res = await request(app).post('/api/review/add').set('Authorization', token).send(requestReview);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);

            const review = await Review.findOne({ title: requestReview.title });
            expect(review).toBeNull();
        });

        it('should return 400 with an empty/invalid product id', async () => {
            const requestReview = {
                product: 'invalid-id',
                title: 'Test Review',
                rating: 5,
                review: 'Test Review Description',
            };

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const res = await request(app).post('/api/review/add').set('Authorization', token).send(requestReview);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);

            const review = await Review.findOne({ title: requestReview.title });
            expect(review).toBeNull();
        });

        it('should return 400 with an invalid rating', async () => {
            const requestReview = {
                product: mockProduct._id,
                title: 'Test Review',
                rating: -1,
                review: 'Test Review Description',
            };

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const res = await request(app).post('/api/review/add').set('Authorization', token).send(requestReview);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });

        it('should return 200 with empty title/review (content)', async () => {
            const requestReview = {
                product: mockProduct._id,
                title: '',
                rating: 5,
                review: '',
            };

            const expectedRes = {
                success: true,
                message: `Your review has been added successfully and will appear when approved!`,
            }

            const res = await request(app).post('/api/review/add').set('Authorization', token).send(requestReview);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(expectedRes);

            const review = await Review.findOne({ title: requestReview.title });
            expect(review).not.toBeNull();

            expect(res.body.review).toMatchObject(JSON.parse(JSON.stringify(review)));
        });

        it('should return 400 with request that contains other private info (user, status, etc)', async () => {
            const requestReview = {
                product: mockProduct._id,
                title: 'Test Review',
                rating: 5,
                review: 'Test Review Description',
                user: mockUser._id,
                status: REVIEW_STATUS.APPROVED,
            };

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const res = await request(app).post('/api/review/add').set('Authorization', token).send(requestReview);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });

        // wrong class type (here we only test for array and review)
        it('should return 400 with wrong class type of review', async () => {
            const requestReview = {
                product: mockProduct._id,
                title: 'Test Review',
                rating: 5,
                review: ['Test Review Description', 'good'],
            };

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const res = await request(app).post('/api/review/add').set('Authorization', token).send(requestReview);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });



    });

    describe('GET /', () => {

        let addReview = 15;

        // create at least 11 reviews (2 pages)
        beforeAll(async () => {
            for (let i = 0; i < addReview; i++) {
                const review = new Review({
                    product: mockProduct._id,
                    title: 'Test Review' + i,
                    rating: 5,
                    review: 'Test Review Description' + i,
                    user: mockUser._id,
                });
                await review.save();
            }
        });

        afterAll(async () => {
            await Review.deleteMany({});
        });

        it('should return 200 by default (first page (default limit is 10))', async () => {
            const res = await request(app).get('/api/review');

            expect(res.statusCode).toEqual(200);

            const reviews = await Review.find({});
            const resReview = res.body.reviews;

            expect(res.body.count).toEqual(reviews.length);
            expect(res.body.totalPages).toEqual(Math.ceil(reviews.length / 10));
            expect(res.body.currentPage).toEqual(1);
            expect(resReview.length).toEqual(10);

            for (let i = 0; i < resReview.length; i++) {
                expect(Review.findById(resReview[i]._id)).not.toBeNull();
            }
        });

        it('should return 200 with page 2', async () => {
            const queryUrl = '/api/review?page=2';
            const res = await request(app).get(queryUrl);

            expect(res.statusCode).toEqual(200);

            const reviews = await Review.find({});
            const resReview = res.body.reviews;

            expect(res.body.count).toEqual(reviews.length);
            expect(res.body.totalPages).toEqual(Math.ceil(reviews.length / 10));
            expect(res.body.currentPage).toEqual(2);    // page 2
            expect(resReview.length).toEqual(reviews.length - 10);


            for (let i = 0; i < resReview.length; i++) {
                expect(Review.findById(resReview[i]._id)).not.toBeNull();
            }
        });

        it('should return 200 with page 3 (empty)', async () => {
            const queryUrl = '/api/review?page=3';
            const res = await request(app).get(queryUrl);

            expect(res.statusCode).toEqual(200);

            const reviews = await Review.find({});
            const resReview = res.body.reviews;

            expect(res.body.count).toEqual(reviews.length);
            expect(res.body.totalPages).toEqual(Math.ceil(reviews.length / 10));
            expect(res.body.currentPage).toEqual(3);    // page 3
            expect(resReview.length).toEqual(0);
        });

        it('should return 400 with invalid page(not number)', async () => {
            const queryUrl = '/api/review?page=invalid';
            const res = await request(app).get(queryUrl);

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toEqual('Your request could not be processed. Please try again.');
        });

        it('should return 400 with invalid page(non-positive number)', async () => {
            const queryUrl = '/api/review?page=-1';
            const res = await request(app).get(queryUrl);

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toEqual('Your request could not be processed. Please try again.');
        });

        it('should return 400 with invalid page(non-integer number)', async () => {
            const queryUrl = '/api/review?page=1.5';
            const res = await request(app).get(queryUrl);

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toEqual('Your request could not be processed. Please try again.');
        });

        it('should return 400 with invalid limit(not number', async () => {
            const queryUrl = '/api/review?limit=invalid';
            const res = await request(app).get(queryUrl);

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toEqual('Your request could not be processed. Please try again.');
        });

        it('should return 400 with invalid limit(non-positive number)', async () => {
            const queryUrl = '/api/review?limit=-1';
            const res = await request(app).get(queryUrl);

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toEqual('Your request could not be processed. Please try again.');
        });


    });

    describe('GET /:slug', () => {

        let approvedReview = 15;
        let pendingReview = 5;
        let rejectedReview = 5;

        beforeAll(async () => {
            for (let i = 0; i < approvedReview; i++) {
                const review = new Review({
                    product: mockProduct._id,
                    title: 'Test Review ' + i,
                    rating: 5,
                    review: 'Test Review Description ' + i,
                    status: REVIEW_STATUS.Approved,
                    user: mockUser._id,
                });
                await review.save();
            }

            for (let i = 0; i < pendingReview; i++) {
                const review = new Review({
                    product: mockProduct._id,
                    title: 'Test Review pend ' + i,
                    rating: 5,
                    review: 'Test Review Description ' + i,
                    status: REVIEW_STATUS.Waiting_Approval,
                    user: mockUser._id,
                });
                await review.save();
            }

            for (let i = 0; i < rejectedReview; i++) {
                const review = new Review({
                    product: mockProduct._id,
                    title: 'Test Review rej ' + i,
                    rating: 5,
                    review: 'Test Review Description ' + i,
                    status: REVIEW_STATUS.Rejected,
                    user: mockUser._id,
                });
                await review.save();
            }
        })

        afterAll(async () => {
            await Review.deleteMany({});
        })

        it('should return 200 with valid slug', async () => {
            const getUrl = '/api/review/' + mockProduct.slug;

            const res = await request(app).get(getUrl);

            expect(res.statusCode).toEqual(200);
            const resReview = res.body.reviews;
            expect(resReview.length).toEqual(approvedReview);

            const approvedReviews = await Review.find({ status: REVIEW_STATUS.Approved });
        });

        it('should return 404 with invalid slug', async () => {
            const getUrl = '/api/review/invalid-slug';

            const res = await request(app).get(getUrl);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toEqual('No product found.');
        });

        it('should return 400 with invalid slug (array)', async () => {
            const getUrl = '/api/review/' + [mockProduct.slug, mockProduct.slug];

            const res = await request(app).get(getUrl);

            expect(res.statusCode).toEqual(400);
        });
    });


    describe('PUT /:id', () => {
        let otherUser;

        beforeAll(async () => {

            otherUser = new User({
                email: 'other@test.com',
                firstName: 'Other',
                lastName: 'User',
            });
            await otherUser.save();

            const review = new Review({
                product: mockProduct._id,
                title: 'Test Review by Other',
                rating: 5,
                review: 'Test Review Other',
                status: REVIEW_STATUS.Approved,
                user: otherUser._id,
            });
            await review.save();

            const review2 = new Review({
                product: mockProduct._id,
                title: 'Test Review by Self',
                rating: 5,
                review: 'Test Review Self',
                status: REVIEW_STATUS.Approved,
                user: mockUser._id,
            });
            await review2.save();
        });

        afterAll(async () => {
            await Review.deleteMany({});
            await User.findByIdAndDelete(otherUser._id);
        });

        it('should return 200 with valid review id and self-modified', async () => {
            const review = await Review.findOne({ user: mockUser._id });
            const putUrl = '/api/review/' + review._id;

            const reviewReq = {
                title: 'Updated Review',
                rating: 4,
                review: 'Updated Review Description',
            };

            const expectedRes = {
                success: true,
                message: 'review has been updated successfully!'
            };

            const res = await request(app).put(putUrl).send(reviewReq);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(expectedRes);

            const updatedReview = await Review.findById(review._id);
            expect(updatedReview.title).toEqual(reviewReq.title);
            expect(updatedReview.rating).toEqual(reviewReq.rating);
            expect(updatedReview.review).toEqual(reviewReq.review);
        });

        it('should return 400 with invalid review id', async () => {
            const putUrl = '/api/review/invalid-id';

            const reviewReq = {
                title: 'Updated Review',
                rating: 4,
                review: 'Updated Review Description',
            };

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const res = await request(app).put(putUrl).send(reviewReq);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });

    });

    describe('PUT /approve/:reviewId', () => {

        let review;

        beforeAll(async () => {
            review = new Review({
                product: mockProduct._id,
                title: 'Test Review',
                rating: 5,
                review: 'Test Review Description',
                status: REVIEW_STATUS.Waiting_Approval,
                user: mockUser._id,
            });
            await review.save();
        });

        afterAll(async () => {
            await Review.deleteMany({});
        });

        it('should return 200 with valid review id and token', async () => {
            const putUrl = '/api/review/approve/' + review.id;

            const expectedRes = {
                success: true,
            };

            const res = await request(app).put(putUrl).set('Authorization', token).send({});
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(expectedRes);

            const updatedReview = await Review.findById(review._id);
            expect(updatedReview.status).toEqual(REVIEW_STATUS.Approved);
        });

        it('should return 400 with invalid review id', async () => {
            const putUrl = '/api/review/approve/invalid-id';

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const res = await request(app).put(putUrl).set('Authorization', token).send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });


    });

    // basically the same as approve
    describe('PUT /reject/:reviewId', () => {
        let review;

        beforeAll(async () => {
            review = new Review({
                product: mockProduct._id,
                title: 'Test Review',
                rating: 5,
                review: 'Test Review Description',
                status: REVIEW_STATUS.Waiting_Approval,
                user: mockUser._id,
            });
            await review.save();
        });

        afterAll(async () => {
            await Review.deleteMany({});
        });

        it('should return 200 with valid review id and token', async () => {
            const putUrl = '/api/review/reject/' + review.id;

            const expectedRes = {
                success: true,
            };

            const res = await request(app).put(putUrl).set('Authorization', token).send({});
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(expectedRes);

            const updatedReview = await Review.findById(review._id);
            expect(updatedReview.status).toEqual(REVIEW_STATUS.Rejected);
        });

        it('should return 400 with invalid review id', async () => {
            const putUrl = '/api/review/reject/invalid-id';

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const res = await request(app).put(putUrl).set('Authorization', token).send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });

    });

    describe('DELETE /delete/:id', () => {

        let review;

        beforeAll(async () => {
            review = new Review({
                product: mockProduct._id,
                title: 'Test Review',
                rating: 5,
                review: 'Test Review Description',
                status: REVIEW_STATUS.Approved,
                user: mockUser._id,
            });
            await review.save();
        });

        afterAll(async () => {
            await Review.deleteMany({});
        });

        it('should return 200 with valid review id', async () => {

            const deleteUrl = '/api/review/delete/' + review._id;

            const expectedRes = {
                success: true,
                message: `review has been deleted successfully!`
            }

            const res = await request(app).delete(deleteUrl).set('Authorization', token).send({});
            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(expectedRes);

            const deletedReview = await Review.findById(review._id);
            expect(deletedReview).toBeNull();
        });

        it('should return 400 with invalid review id', async () => {
            const deleteUrl = '/api/review/delete/invalid-id';

            const expectedRes = {
                error: 'Your request could not be processed. Please try again.'
            };

            const res = await request(app).delete(deleteUrl).set('Authorization', token).send({});

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });


    });

});