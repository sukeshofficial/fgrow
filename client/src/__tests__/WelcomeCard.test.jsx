import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import WelcomeCard from "../components/tenant/WelcomeCard";

describe("WelcomeCard", () => {
  it("renders WelcomeCard title and subtitle", () => {
    render(<WelcomeCard onCreateTenant={() => {}} onJoinAsStaff={() => {}} />);
    
    expect(screen.getByText("Welcome to FGrow")).toBeInTheDocument();
    expect(screen.getByText(/Please select an option/)).toBeInTheDocument();
  });

  it("renders both action buttons", () => {
    render(<WelcomeCard onCreateTenant={() => {}} onJoinAsStaff={() => {}} />);
    
    expect(screen.getByRole("button", { name: "Create Tenant" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join as Staff" })).toBeInTheDocument();
  });

  it("calls onCreateTenant when 'Create Tenant' is clicked", async () => {
    const handleCreateTenant = vi.fn();
    const user = userEvent.setup();
    
    render(<WelcomeCard onCreateTenant={handleCreateTenant} onJoinAsStaff={() => {}} />);
    
    const createBtn = screen.getByRole("button", { name: "Create Tenant" });
    await user.click(createBtn);
    
    expect(handleCreateTenant).toHaveBeenCalledOnce();
  });

  it("calls onJoinAsStaff when 'Join as Staff' is clicked", async () => {
    const handleJoinAsStaff = vi.fn();
    const user = userEvent.setup();
    
    render(<WelcomeCard onCreateTenant={() => {}} onJoinAsStaff={handleJoinAsStaff} />);
    
    const joinBtn = screen.getByRole("button", { name: "Join as Staff" });
    await user.click(joinBtn);
    
    expect(handleJoinAsStaff).toHaveBeenCalledOnce();
  });
});
