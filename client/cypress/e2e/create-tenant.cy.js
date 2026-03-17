/// <reference types="cypress" />

describe("Create Tenant Flow", () => {
  beforeEach(() => {
    // Set flag so modal doesn't auto-open
    cy.window().then((win) => {
      win.localStorage.setItem("fgrow_welcome_shown", "true");
    });
    
    // Mock API
    cy.intercept("GET", "/api/v0/auth/me", {
      statusCode: 200,
      body: {
        state: "NO_TENANT",
        user: { id: 1, email: "owner@example.com", username: "Owner", tenant_role: "owner" }
      }
    }).as("getMe");
    
    cy.intercept("POST", "/api/v0/tenant", {
      statusCode: 201,
      body: { message: "Tenant created successfully" }
    }).as("createTenant");
  });

  it("allows user to create a tenant and sees pending screen", () => {
    // 1. Visit app
    cy.visit("/dashboard");
    cy.wait("@getMe");

    // 2. Click Create Tenant on the WelcomeCard
    cy.get(".welcome-action-card").contains("button", "Create Tenant").click();
    
    // 3. Assert CreateTenantModal is visible
    cy.get(".tenant-modal").should("be.visible");
    cy.contains("Fill details for approval").should("be.visible");
    
    // 4. Fill form
    cy.get("input[name='companyName']").type("Acme Corp");
    cy.get("input[name='companyEmail']").type("contact@acmecorp.com");
    cy.get("input[name='companyPhone']").type("1234567890");
    
    // Mock the subsequent /auth/me call to emulate the backend returning PENDING_VERIFICATION
    cy.intercept("GET", "/api/v0/auth/me", {
      statusCode: 200,
      body: {
        state: "PENDING_VERIFICATION",
        user: { id: 1, email: "owner@example.com", username: "Owner", tenant_role: "owner", tenant_id: 99 },
        tenant: { name: "Acme Corp", verificationStatus: "pending" }
      }
    }).as("getMePending");
    
    // 5. Submit form
    cy.get(".tenant-form").submit();
    cy.wait("@createTenant");
    cy.wait("@getMePending");
    
    // 6. Assert Pending Screen is visible
    cy.get(".tenant-pending-overlay").should("be.visible");
    cy.contains("Waiting for Super Admin Approval").should("be.visible");
    cy.contains("Acme Corp").should("be.visible");
    cy.contains("Pending Verification").should("be.visible");
  });
});
