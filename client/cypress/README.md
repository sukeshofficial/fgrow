# Cypress E2E Tests for Welcome UI and Flow

This document details the Cypress End-to-End tests introduced for the FGrow Tenant Welcome flow.

## Running Tests

First, ensure your development server is running on `http://localhost:5173`.
```bash
npm run dev
```

Then, you can open Cypress interactively:
```bash
npm run cy:open
```

Or run all tests headlessly:
```bash
npm run test:cy
```

## Scenarios Covered

The tests use `cy.intercept` to stub backend responses, meaning you can verify all frontend logic locally without requiring a seeded database.

### 1. Welcome Modal Auto-Open (`welcome.cy.js`)
- Clears `localStorage`.
- Verifies that `WelcomeModal` appears exactly once.
- Verifies that the persistent `WelcomeCard` remains on the page afterwards.
- Verifies that reloading the page does **not** re-open the modal automatically.

### 2. Create Tenant Flow (`create-tenant.cy.js`)
- Bypasses the auto-open modal.
- Clicks `Create Tenant` on the `WelcomeCard`.
- Fills out the tenant creation form (`CreateTenantModal`).
- Submits and verifies the transition to `TenantPendingScreen` (`PENDING_VERIFICATION`).
- *(The Super Admin acceptance step is simulated by changing the stubbed `meState` response from `PENDING_VERIFICATION` to `ACTIVE`).*

### 3. Join as Staff / Invitation Flows (`accept-invitation.cy.js`)
- **Prefilled Invitation (meState = `INVITED`)**: Validates that users with pending invite records see the rich `AcceptInvitationModal`. Upon accepting, they transition to `ACTIVE`.
- **Manual Invitation (meState = `NO_TENANT`)**: Validates that staff without an invite prompt can manually click `Join as Staff` on the `WelcomeCard`, enter a raw invite token in the new `JoinAsStaffModal`, and transition to `ACTIVE`.
