import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import WelcomeModal from "../components/tenant/WelcomeModal";

describe("WelcomeModal", () => {
  it("does not render when open is false", () => {
    render(
      <WelcomeModal
        open={false}
        onClose={() => {}}
        onCreateTenant={() => {}}
        onJoinAsStaff={() => {}}
      />
    );
    
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the modal when open is true", () => {
    render(
      <WelcomeModal
        open={true}
        onClose={() => {}}
        onCreateTenant={() => {}}
        onJoinAsStaff={() => {}}
      />
    );
    
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Welcome to FGrow")).toBeInTheDocument();
  });

  it("calls onClose when the close (×) button is clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    
    render(
      <WelcomeModal
        open={true}
        onClose={handleClose}
        onCreateTenant={() => {}}
        onJoinAsStaff={() => {}}
      />
    );
    
    const closeBtn = screen.getByRole("button", { name: "Close" });
    await user.click(closeBtn);
    
    expect(handleClose).toHaveBeenCalledOnce();
  });
});
