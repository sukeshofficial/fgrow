/// <reference types="cypress" />

describe("Accept Invitation Flow", () => {
  beforeEach(() => {
    // Set flag so modal doesn't auto-open
    cy.window().then((win) => {
      win.localStorage.setItem("fgrow_welcome_shown", "true");
    });
  });

  describe("Staff with prefilled invitation", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/v0/auth/me", {
        statusCode: 200,
        body: {
          state: "INVITED",
          user: { id: 2, email: "staff@example.com", username: "Staff Member", tenant_role: "staff" },
          invitation: { tenantName: "Acme Corp", invitedBy: "Owner", role: "staff" }
        }
      }).as("getMeInvited");
      
      cy.intercept("POST", "/api/v0/invitation/accept", {
        statusCode: 200,
        body: { message: "Accepted successfully" }
      }).as("acceptInvite");
    });

    it("auto-shows AcceptInvitationModal and allows staff to accept", () => {
      cy.visit("/dashboard");
      cy.wait("@getMeInvited");

      // Modal should be visible automatically because of INVITED state
      cy.get(".ai-modal").should("be.visible");
      cy.contains("You've been invited").should("be.visible");
      cy.contains("Acme Corp").should("be.visible");

      // Mock subsequent fetch showing them as ACTIVE
      cy.intercept("GET", "/api/v0/auth/me", {
        statusCode: 200,
        body: {
          state: "ACTIVE",
          user: { id: 2, email: "staff@example.com", username: "Staff Member", tenant_role: "staff", tenant_id: 99 },
          tenant: { name: "Acme Corp" }
        }
      }).as("getMeActive");

      // Click Accept
      cy.contains("button", "Accept").click();
      cy.wait("@acceptInvite");
      cy.wait("@getMeActive");

      // Assert they are now on their dashboard (overlay gone)
      cy.get(".ai-modal").should("not.exist");
    });
  });

  describe("Staff without prefilled invitation (Manual Token entry)", () => {
    beforeEach(() => {
      cy.intercept("GET", "/api/v0/auth/me", {
        statusCode: 200,
        body: {
          state: "NO_TENANT",
          user: { id: 3, email: "newstaff@example.com", username: "New Staff", tenant_role: "staff" }
        }
      }).as("getMeNoTenant");
      
      cy.intercept("POST", "/api/v0/invitation/accept", {
        statusCode: 200,
        body: { message: "Accepted successfully" }
      }).as("acceptInviteToken");
    });

    it("allows staff to enter a token manually via WelcomeCard", () => {
      cy.visit("/dashboard");
      cy.wait("@getMeNoTenant");

      // Click Join as Staff
      cy.get(".welcome-action-card").contains("button", "Join as Staff").click();

      // Assert JoinAsStaffModal is visible
      cy.get(".welcome-modal").should("be.visible");
      cy.contains("Join an Organization").should("be.visible");
      
      // Type token
      cy.get("input#invite-token").type("secret-token-123");

      // Mock subsequent fetch
      cy.intercept("GET", "/api/v0/auth/me", {
        statusCode: 200,
        body: {
          state: "ACTIVE",
          user: { id: 3, email: "newstaff@example.com", username: "New Staff", tenant_role: "staff", tenant_id: 99 },
          tenant: { name: "Acme Corp" }
        }
      }).as("getMeActiveFromToken");

      // Submit
      cy.get(".tenant-form").submit();
      cy.wait("@acceptInviteToken").its('request.body').should('deep.equal', {
        token: 'secret-token-123'
      });
      cy.wait("@getMeActiveFromToken");

      // Modal gone
      cy.get(".welcome-modal").should("not.exist");
    });
  });
});
