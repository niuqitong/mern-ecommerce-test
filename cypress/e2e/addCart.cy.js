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
        cy.get('.item-image').click();
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
