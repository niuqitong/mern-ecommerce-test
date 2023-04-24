const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../../app');

jest.mock('../../../services/mailchimp');
const mailchimp = require('../../../services/mailchimp');
jest.mock('../../../services/mailgun');
const mailgun = require('../../../services/mailgun');

describe('Test /api/newsletter', () => {

    describe('POST /subscribe', () => {

        beforeEach(() => {
            mailchimp.subscribeToNewsletter.mockResolvedValue({ status: 200 });
            mailgun.sendEmail.mockResolvedValue(true);
        })



        it('should return 200 with a valid email', async () => {
            const email = '123@123.com';

            const expectedRes = {
                success: true,
                message: 'You have successfully subscribed to the newsletter'
            };

            const res = await request(app).post('/api/newsletter/subscribe').send({ email });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toMatchObject(expectedRes);
        });

        it('should return 400 with an empty email', async () => {
            const email = null;

            const expectedRes = {
                error: 'You must enter an email address.'
            };

            const res = await request(app).post('/api/newsletter/subscribe').send({ email });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });

        it('should return 400 with an invalid email', async () => {
            // here the mailchimp need to return 400 (as email is invalid)
            mailchimp.subscribeToNewsletter.mockResolvedValue({ status: 400, title: 'invalid email' });
            const email = '123';

            const expectedRes = {
                error: 'invalid email'
            };

            const res = await request(app).post('/api/newsletter/subscribe').send({ email });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });

        it('should return 400 with wrong class email (array)', async () => {
            mailchimp.subscribeToNewsletter.mockResolvedValue({ status: 400, title: 'invalid email' });
            const email = ['123@123.con', '321@321.ss'];

            const expectedRes = {
                error: 'invalid email'
            };

            const res = await request(app).post('/api/newsletter/subscribe').send({ email });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toMatchObject(expectedRes);
        });
    });

});