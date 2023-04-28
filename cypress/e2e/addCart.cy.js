/* ==== Test Created with Cypress Studio ==== */
describe('Add Cart', () => {


    /* ==== Test Created with Cypress Studio ==== */
    it('place order & cancel', function () {
        /* ==== Generated with Cypress Studio ==== */
        cy.visit('localhost:8080');
        cy.get(':nth-child(3) > .nav-link').click();
        cy.get('.dropdown.show > .dropdown-menu > :nth-child(1)').click();
        cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('testRegister@test.com');
        cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').type('testRegister@test.com');
        cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').clear('te');
        cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').type('testRegister');
        cy.get('.d-flex > .custom-btn-primary > .btn-text').click();
        cy.get('.custom-badge').click();
        cy.get(':nth-child(2) > .nav-link').click();
        cy.get('#root > div > main > div > div > div > div > div.col-12.order-2.col-sm-12.order-sm-2.col-md-12.order-md-2.col-lg-9.order-lg-2 > div.products-shop > div > div:nth-child(3) > div > div > div.item-link > a > div.item-image-container > div > img').click();
        cy.get('.input-number').click();
        cy.get('.input-number').click();
        cy.get('.item-actions > .input-btn > .btn-text').click();
        cy.get('.checkout-actions > :nth-child(2) > .btn-text').click();
        cy.get('.order-label').click();
        cy.get('.dropdown-action').click();
        cy.get('#CancelOrderItemPopover > .btn-text').click();
        /* ==== End Cypress Studio ==== */

    });

});
