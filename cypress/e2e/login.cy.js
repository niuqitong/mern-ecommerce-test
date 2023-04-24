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
  cy.get('.d-flex > .custom-btn-primary').click();
  cy.get('.custom-badge').click();
  cy.get(':nth-child(3) > .nav-link').click();
  cy.get('.dropdown-menu > :nth-child(2)').click();
  /* ==== End Cypress Studio ==== */
});