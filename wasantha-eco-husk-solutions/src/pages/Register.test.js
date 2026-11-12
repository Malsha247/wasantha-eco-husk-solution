import { act, fireEvent, render, screen } from "@testing-library/react";
import Register from "./Register";

jest.mock("../contexts/PreferencesContext", () => ({
  usePreferences: () => ({ t: (text) => text }),
}));

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ children }) => <span>{children}</span>,
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

const fillForm = () => {
  fireEvent.change(screen.getByPlaceholderText("First Name"), {
    target: { value: "Test" },
  });
  fireEvent.change(screen.getByPlaceholderText("Last Name"), {
    target: { value: "User" },
  });
  fireEvent.change(screen.getByPlaceholderText("Email"), {
    target: { value: "test@example.invalid" },
  });
  fireEvent.change(screen.getByPlaceholderText("Password"), {
    target: { value: "test-password" },
  });
  fireEvent.change(screen.getByPlaceholderText("Confirm Password"), {
    target: { value: "test-password" },
  });
};

beforeEach(() => {
  global.fetch = jest.fn();
  mockNavigate.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test("registers once, reports welcome email status, and redirects", async () => {
  jest.useFakeTimers();
  fetch.mockResolvedValue({
    ok: true,
    text: async () =>
      JSON.stringify({
        success: true,
        email_sent: true,
      }),
  });
  render(<Register />);
  fillForm();

  const button = screen.getByRole("button", { name: "Register" });
  fireEvent.click(button);
  fireEvent.click(button);

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    firstName: "Test",
    lastName: "User",
    email: "test@example.invalid",
    password: "test-password",
  });
  expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  expect(await screen.findByText("Registration successful! Welcome email sent. Redirecting...")).toBeTruthy();

  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(mockNavigate).toHaveBeenCalledWith("/login");
});

test("stops waiting and explains when registration times out", async () => {
  jest.useFakeTimers();
  jest.spyOn(console, "error").mockImplementation(() => {});
  fetch.mockImplementation(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")));
      }),
  );
  render(<Register />);
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Register" }));

  act(() => {
    jest.advanceTimersByTime(45000);
  });

  expect(
    await screen.findByText(
      "Registration is taking too long. Check whether your account was created, then try logging in.",
    ),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Register" })).toBeEnabled();
});

test("shows backend registration errors", async () => {
  fetch.mockResolvedValue({
    ok: false,
    text: async () =>
      JSON.stringify({
        success: false,
        message: "Email already registered.",
      }),
  });
  render(<Register />);
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Register" }));

  expect(await screen.findByText("Email already registered.")).toBeTruthy();
});
