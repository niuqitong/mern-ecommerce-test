describe('add product spec', () => {
  it('passes', () => {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('localhost:8080');
    /* ==== End Cypress Studio ==== */
    /* ==== Generated with Cypress Studio ==== */
    cy.get(':nth-child(3) > .nav-link').click();
    cy.get('.dropdown.show > .dropdown-menu > :nth-child(1)').click();
    cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('ad');
    cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').type('admin@kaicko.com');
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').clear();
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').type('password');
    cy.get('.d-flex > .custom-btn-primary').click();
    cy.get(':nth-child(6) > a').click();
    cy.get('.action > .input-btn > .btn-text').click();
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('P');
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').type('Phone');
    cy.get('.textarea-text').click();
    cy.get('.add-brand-actions > .input-btn > .btn-text').click();
    cy.get('.panel-links > :nth-child(4) > a').click();
    cy.get('.action > .input-btn').click();
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('123');
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').type('1234');
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').clear();
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').type('iPhone');
    cy.get('.textarea-text').click();
    cy.get(':nth-child(6) > .select-box > .select-container > .react-select__control > .react-select__value-container').click();
    cy.get('#react-select-2-option-0').click();
    cy.get(':nth-child(4) > .input-box > .input-number').click();
    cy.get(':nth-child(4) > .input-box > .input-number').clear('20');
    cy.get(':nth-child(4) > .input-box > .input-number').type('20');
    cy.get(':nth-child(7) > .select-box > .select-container > .react-select__control > .react-select__value-container > .react-select__single-value').click();
    cy.get('#react-select-3-option-3').click();
    cy.get('.add-product-actions > .input-btn > .btn-text').click();
    cy.get('form > .row > :nth-child(1)').click();
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('12345');
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').type('12345');
    cy.get('.add-product-actions > .input-btn').click();
    cy.get(':nth-child(5) > a').click();
    cy.get('.action > .input-btn > .btn-text').click();
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('E');
    cy.get('.row > :nth-child(1) > .input-box > .input-text-block > .input-text').type('Electronic');
    cy.get('.textarea-text').click();
    cy.get('.react-select__value-container').click();
    cy.get('#react-select-4-option-2').click();
    cy.get('.add-category-actions > .input-btn > .btn-text').click();
    cy.get('.brand > .input-btn').click();
    cy.get('.menu-list > :nth-child(4) > a').click();
    cy.get('.item-name').click();
    cy.get('.item-name').should("have.text", "iPhone")
    cy.get('.price').click().should("have.text", "$1");
    cy.get('.item-desc').click().should("have.text", "apple");
    
    /* ==== End Cypress Studio ==== */
  })
})