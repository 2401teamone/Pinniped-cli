import { render, screen, fireEvent } from "@testing-library/react";
import { expect, describe, beforeEach, test } from "vitest";
import App from "../components/App";

describe("App", async () => {
  beforeEach(() => {
    render(<App />);
  });

  test("renders headline", () => {
    const headline = screen.getByRole("heading", {
      level: 1,
      name: /Median Prime/i,
    });

    expect(headline).toBeDefined();
  });

  test("Buttons are rendered", () => {
    const calculateButton = screen.getByRole("button", { name: /calculate/i });
    const clearButton = screen.getByRole("button", { name: /clear/i });

    expect(calculateButton).toBeDefined();
    expect(clearButton).toBeDefined();
  });

  test("Input is rendered", () => {
    const input = screen.getByLabelText("input-number");

    expect(input).toBeDefined();
  });

  test("Input only accepts numbers", () => {
    const input = screen.getByLabelText("input-number");

    fireEvent.change(input, { target: { value: "abc" } });

    expect(input.value).toBe("");
  });

  test("clicking the clear button clears the input", () => {
    const input = screen.getByLabelText("input-number");
    const clearButton = screen.getByRole("button", { name: /clear/i });

    fireEvent.change(input, { target: { value: "123" } });
    fireEvent.click(clearButton);

    expect(input.value).toBe("");
  });
});
