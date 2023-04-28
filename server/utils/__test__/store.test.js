

const app = require('../../app');
const Product = require('../../models/Product');
const taxConfig = require('../../config/tax');
const store = require('../../utils/store');

describe('Test store', () => {


    describe('disableProducts', () => {
        let mockProducts = [];

        beforeAll(async () => {
            for (let i = 0; i < 10; i++) {
                const product = new Product({
                    name: `Test Store Product ${i}`,
                    price: 100,
                    isActive: true
                });
                await product.save();
                mockProducts.push(product);
            }
        });

        afterAll(async () => {
            await Product.deleteMany({ _id: { $in: mockProducts.map(item => item._id) } });

        });

        afterEach(async () => {
            Product.updateMany({ _id: { $in: mockProducts.map(item => item._id) } }, { isActive: true });
        });

        it('should disable all products', async () => {
            await store.disableProducts(mockProducts);
            const products = await Product.find({ _id: { $in: mockProducts.map(item => item._id) } });
            expect(products.every(item => item.isActive === false)).toBe(true);
        });

        it('should not disable any products', async () => {
            await store.disableProducts([]);
            const products = await Product.find({ _id: { $in: mockProducts.map(item => item._id) } });
            expect(products.every(item => item.isActive === true)).toBe(true);
        });

    });

    describe('caculateTaxAmount', () => {

        let order;
        let totalTax;
        let total;

        beforeEach(() => {
            order = {
                products: [
                    {
                        product: {
                            taxable: true,
                            price: 0
                        },
                        quantity: 10,
                        purchasePrice: 100,
                        priceWithTax: 0,
                        totalTax: 0
                    },
                    {
                        product: {
                            taxable: false
                        },
                        quantity: 20,
                        purchasePrice: 100,
                        priceWithTax: 0,
                        totalTax: 0
                    },
                    {
                        product: {
                            taxable: true,
                            price: 100
                        },
                        quantity: 30,
                        status: 'Cancelled',
                        priceWithTax: 0,
                        totalTax: 0
                    }
                ]
            };

            const taxRate = taxConfig.stateTaxRate;
            totalTax = 100 * 10 * (taxRate / 100) * 100;
            total = 100 * 10 + 100 * 20;
        });

        it('should calculate tax amount with the given order(include cancelled order, untaxable order)', async () => {
            store.caculateTaxAmount(order);
            expect(order.totalTax).toBe(totalTax);
            expect(order.total).toBe(total);
            expect(order.totalWithTax).toBe(total + totalTax);

        });

        it('should calculate tax amount with the given order(taxable only)', async () => {
            order.products = order.products.filter(item => item.product.taxable);
            store.caculateTaxAmount(order);

            expect(order.totalTax).toBe(totalTax);
            expect(order.total).toBe(1000);
            expect(order.totalWithTax).toBe(1000 + totalTax);
        });

        it('should calculate tax amount with the given order(untaxable only)', async () => {
            order.products = order.products.filter(item => !item.product.taxable);
            store.caculateTaxAmount(order);
            expect(order.totalTax).toBe(0);
            expect(order.total).toBe(2000);
            expect(order.totalWithTax).toBe(2000);
        });

        it('should calculate tax amount with the given order(no cancelled)', async () => {
            order.products = order.products.filter(item => item.status !== 'Cancelled');
            store.caculateTaxAmount(order);
            expect(order.totalTax).toBe(totalTax);
            expect(order.total).toBe(3000);
            expect(order.totalWithTax).toBe(3000 + totalTax);
        });

        it('should return original order if order is wrong format', async () => {
            const ret = store.caculateTaxAmount({ q: 123 });
            expect(ret).toEqual({ q: 123 });
        });



    });

    // caculateOrderTotal is supposed to be a private function (not exported) so we may not need to test it here (already used in calculateTaxAmount).

    describe('caculateItemsSalesTax', () => {

        let items;

        beforeEach(() => {
            items = [];
            for (let i = 0; i < 15; i++) {
                items.push({
                    taxable: true,
                    price: 100,
                    quantity: 10,
                    purchasePrice: 100,
                    priceWithTax: 0,
                    totalTax: 0
                });
            }

            for (let i = 0; i < 5; i++) {
                items.push({
                    taxable: false,
                    price: 100,
                    quantity: 10,
                });
            }
        });

        it('should calculate items sales tax', async () => {
            const ret = store.caculateItemsSalesTax(items);
            expect(ret.reduce((acc, cur) => acc + cur.totalTax, 0)).toBe(100 * 10 * (taxConfig.stateTaxRate / 100) * 100 * 15);

            expect(ret.reduce((acc, cur) => acc + cur.totalPrice, 0)).toBe(100 * 10 * 15 + 100 * 10 * 5);
        });

        it('should return empty array if items is empty', async () => {
            const ret = store.caculateItemsSalesTax([]);
            expect(ret).toEqual([]);
        });

        it('should return original items if items is wrong format', async () => {
            const ret = store.caculateItemsSalesTax({ q: 123 });
            expect(ret).toEqual({ q: 123 });
        });

    });

    // formatOrders only serves for formatting, so we may not need to test it here. (tested in order.test.js)

});