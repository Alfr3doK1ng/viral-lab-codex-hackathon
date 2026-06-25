import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/app/App";

describe("App", () => {
  it("renders the Viral Lab workflow shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Viral Lab/i })).toBeInTheDocument();
    expect(screen.getByText(/Spec-first loop/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Analyze viral DNA/i })).toBeInTheDocument();
  });
});
