describe('template spec', () => {

  /* ==== Test Created with Cypress Studio ==== */
  it('no input when adding fails and outputs error messages', function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('localhost:8080');
    cy.get(':nth-child(3) > .nav-link').click();
    cy.get('.dropdown.show > .dropdown-menu > :nth-child(1)').click();
    cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('admin@kaicko.com');
    cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').type('admin@kaicko.com');
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').clear('p');
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').type('password');
    cy.get('.d-flex > .custom-btn-primary').click();
    cy.get(':nth-child(6) > a').click();
    cy.get('.action > .input-btn > .btn-text').click();
    cy.get('.add-brand-actions > .input-btn > .btn-text').click();
    cy.get('.row > :nth-child(1) > .input-box > .invalid-message').should('has.text', "Name is required.");
    cy.get(':nth-child(2) > .input-box > .invalid-message').click().should('has.text', "Description is required.");
    cy.get('.panel-links > :nth-child(4) > a').click();
    cy.get('.action > .input-btn').click();
    cy.get('.add-product-actions > .input-btn > .btn-text').click();
    cy.get('.row > :nth-child(1) > .input-box > .invalid-message').click().should('has.text', "Sku is required.");
    cy.get(':nth-child(2) > .input-box > .invalid-message').click().should('has.text', "Name is required.");
    cy.get(':nth-child(3) > .input-box > .invalid-message').click().should('has.text', "Description is required.");
    cy.get(':nth-child(7) > .select-box > .invalid-message').click();
    cy.get(':nth-child(5) > a').click();
    cy.get('.action > .input-btn > .btn-text').click();
    cy.get('.add-category-actions > .input-btn > .btn-text').click();
    cy.get(':nth-child(2) > .input-box > .invalid-message').click().should('has.text', "Description is required.");
    cy.get('.row > :nth-child(1) > .input-box > .invalid-message').click().should('has.text', "Name is required.");
    cy.get('.select-box > .invalid-message').click().should('has.text', "Products are required.");
    /* ==== End Cypress Studio ==== */
  });
})