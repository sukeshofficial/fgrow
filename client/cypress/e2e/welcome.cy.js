/// <reference types="cypress" />

describe("Welcome Flow - First Visit", () => {
  beforeEach(() => {
    // Clear localStorage to simulate first visit
    cy.clearLocalStorage();
    
    // We mock the /auth/me API call to return a NO_TENANT state
    cy.intercept("GET", "/api/v0/auth/me", {
      statusCode: 200,
      body: {
        state: "NO_TENANT",
        user: { id: 1, email: "test@example.com", username: "Tester", tenant_role: "owner" }
      }
    }).as("getMe");
    
    // Mock login success just in case we are on the login page
    cy.intercept("POST", "/api/v0/auth/login", {
      statusCode: 200,
      body: {
        user: { id: 1, email: "test@example.com", username: "Tester", tenant_role: "owner" }
      }
    }).as("login");
  });

  it("auto-opens WelcomeModal on first visit, then stays closed on subsequent loads", () => {
    // 1. Visit the app
    cy.visit("/dashboard");
    cy.wait("@getMe");

    // 2. Assert the Welcome Modal is visible
    cy.get(".welcome-modal").should("be.visible");
    cy.contains("Welcome to FGrow").should("be.visible");
    
    // Ensure both buttons are inside
    cy.get(".welcome-modal").within(() => {
      cy.contains("button", "Create Tenant").should("be.visible");
      cy.contains("button", "Join as Staff").should("be.visible");
      
      // Close the modal
      cy.get(".welcome-modal-close").click();
    });

    // 3. Modal should be gone, but WelcomeCard should be visible on the page
    cy.get(".welcome-modal").should("not.exist");
    cy.get(".welcome-page").should("be.visible");
    cy.get(".welcome-action-card").within(() => {
      cy.contains("button", "Create Tenant").should("be.visible");
    });

    // 4. Reload page - this time localStorage flag is set
    cy.reload();
    cy.wait("@getMe");

    // 5. Modal should NOT auto-open
    cy.get(".welcome-modal").should("not.exist");
    cy.get(".welcome-action-card").should("be.visible");
  });
});
