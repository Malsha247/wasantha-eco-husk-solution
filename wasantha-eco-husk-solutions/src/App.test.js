import { fireEvent, render, screen } from "@testing-library/react";
import {
  PreferenceControls,
  PreferencesProvider,
} from "./contexts/PreferencesContext";
import { ToastProvider, useToast } from "./contexts/ToastContext";

const ToastTestControls = () => {
  const showToast = useToast();

  return (
    <>
      <button onClick={() => showToast("Deleted successfully")}>Success</button>
      <button onClick={() => showToast("Delete failed", "error")}>Failure</button>
    </>
  );
};

beforeEach(() => {
  window.localStorage.removeItem("wehs-language");
  window.localStorage.removeItem("wehs-theme");
});

afterEach(() => {
  window.localStorage.removeItem("wehs-language");
  window.localStorage.removeItem("wehs-theme");
  document.documentElement.lang = "en";
  delete document.documentElement.dataset.theme;
});

test("saves language and theme preferences when toggled", () => {
  render(
    <PreferencesProvider>
      <PreferenceControls />
    </PreferencesProvider>
  );

  fireEvent.click(screen.getByRole("button", { name: "Language: English" }));
  fireEvent.click(screen.getByRole("button", { pressed: false }));

  expect(document.documentElement.lang).toBe("si");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();
  expect(window.localStorage.getItem("wehs-language")).toBe("si");
  expect(window.localStorage.getItem("wehs-theme")).toBe("dark");
});

test("shows success and error toast notifications", () => {
  render(
    <PreferencesProvider>
      <ToastProvider>
        <ToastTestControls />
      </ToastProvider>
    </PreferencesProvider>
  );

  fireEvent.click(screen.getByRole("button", { name: "Success" }));
  expect(screen.getByRole("status")).toHaveTextContent("Deleted successfully");

  fireEvent.click(screen.getByRole("button", { name: "Failure" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Delete failed");
});
