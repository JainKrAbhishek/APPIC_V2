import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Use this to enable React strict mode in development
// For now, disabling strict mode to reduce double-render and flicker
// Strict mode causes components to render twice in development
createRoot(document.getElementById("root")!).render(
  <App />
);
