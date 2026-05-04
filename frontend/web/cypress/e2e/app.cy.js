describe('NERE App E2E Tests', () => {
  it('should load the homepage', () => {
    cy.visit('/');
    cy.contains('NERE').should('be.visible');
  });

  it('should have working API integration', () => {
    cy.request('/api/health').then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});
