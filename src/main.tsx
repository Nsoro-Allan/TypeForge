import React from "react";
import ReactDOM from "react-dom/client";
import "./App.css";
import App from "./App";
import { loadSettings } from "./lib/storage";
import { applyTheme } from "./lib/themes";

// Apply the saved theme before the first paint so there is no flash of the default colours.
const saved = loadSettings();
applyTheme(saved.theme);
document.documentElement.style.setProperty("--tf-font-size", `${saved.fontSize}rem`);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
