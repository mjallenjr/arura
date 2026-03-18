import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CookieConsent from "@/components/CookieConsent";

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows when no consent stored", () => {
    render(<CookieConsent />);
    expect(screen.getByText(/essential cookies/i)).toBeInTheDocument();
  });

  it("hides when consent already given", () => {
    localStorage.setItem("arura_cookie_consent", "accepted");
    render(<CookieConsent />);
    expect(screen.queryByText(/essential cookies/i)).not.toBeInTheDocument();
  });

  it("stores accepted on click", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText("Accept All"));
    expect(localStorage.getItem("arura_cookie_consent")).toBe("accepted");
  });

  it("stores rejected on click", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText("Reject All"));
    expect(localStorage.getItem("arura_cookie_consent")).toBe("rejected");
  });
});
