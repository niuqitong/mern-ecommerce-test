describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })




  /* ==== Test Created with Cypress Studio ==== */
  it('brand deactivation crashs the whole server', function() {
    /* ==== Generated with Cypress Studio ==== */
    cy.visit('http://localhost:8080/');
    cy.get(':nth-child(3) > .nav-link').click();
    cy.get('.dropdown.show > .dropdown-menu > :nth-child(1)').click();
    cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').clear('admin@gmeal.com');
    cy.get('.p-0 > :nth-child(1) > .input-box > .input-text-block > .input-text').type('admin@gmeal.com');
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').clear('p');
    cy.get(':nth-child(2) > .input-box > .input-text-block > .input-text').type('password');
    cy.get('.d-flex > .custom-btn-primary > .btn-text').click();
    cy.get(':nth-child(6) > a').click();
    cy.get('[href="/dashboard/brand/edit/6445481dc157fce3556f01f8"] > .d-flex > .mb-0').click();
    cy.get('.switch-label-toggle').click();
    cy.get('#enable-brand-6445481dc157fce3556f01f8').check();
    cy.get('.mb-3 > .btn-text').click();
    cy.get('[href="/dashboard/brand/edit/6445481dc157fce3556f01f8"] > .d-flex').click();
    cy.get('.switch-label-toggle').click();
    cy.get('#enable-brand-6445481dc157fce3556f01f8').uncheck();
    cy.get('.mb-3 > .btn-text').click();
    /* ==== End Cypress Studio ==== */
  });
})


// describe("test clicks", () => {
//   it('should click something', () => {
//     cy.get(':nth-child(2) > ul > :nth-child(8) > a');
//   })
// })