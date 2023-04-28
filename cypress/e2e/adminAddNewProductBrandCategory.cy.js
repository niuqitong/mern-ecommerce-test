describe('template spec', () => {

  /* ==== Test Created with Cypress Studio ==== */
  it('testing admin adding product, category, and brand', function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('localhost:8080');
    cy.get(':nth-child(3) > .nav-link').click();
    cy.get('.dropdown.show > .dropdown-menu > :nth-child(1)').click();
    cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('admin@kaicko.com');
    cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').type('admin@kaicko.com');
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').clear('p');
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').type('password');
    cy.get('.d-flex > .custom-btn-primary').click();
    cy.get('.panel-links > :nth-child(6) > a').click();
    cy.get('.action > .input-btn > .btn-text').click();
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('S');
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').type('Samsung');
    cy.get('.textarea-text').click();
    cy.get('.add-brand-actions > .input-btn > .btn-text').click();
    cy.get('.panel-links > :nth-child(4) > a').click();
    cy.get('.action > .input-btn > .btn-text').click();
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('1');
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').type('11223344');
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').clear();
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').type('Galaxy');
    cy.get(':nth-child(6) > .select-box > .select-container > .react-select__control > .react-select__value-container').click();
    cy.get('#react-select-2-option-0').click();
    cy.get(':nth-child(7) > .select-box > .select-container > .react-select__control > .react-select__value-container > .react-select__single-value').click();
    cy.get('#react-select-3-option-7').click();
    cy.get('.add-product-actions > .input-btn > .btn-text').click();
    cy.get('.panel-links > :nth-child(5) > a').click();
    cy.get('.action > .input-btn').click();
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('e');
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').type('electronics');
    cy.get('.textarea-text').click();
    cy.get('.react-select__value-container').click();
    cy.get('#react-select-4-option-2').click();
    cy.get('.add-category-actions > .input-btn > .btn-text').click();
    cy.get('.brand > .input-btn > .btn-icon > .bars-icon').click();
    cy.get('.menu-list > :nth-child(2) > a').click();
    cy.get('.item-name').click();
    cy.get('.item-name').should('have.text', 'Galaxy');
    cy.get('.sku').should('have.text', '11223344');
    cy.get('.item-desc').should('have.text', 'galaxy');
    /* ==== End Cypress Studio ==== */
  });
})