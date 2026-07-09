import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { App } from "./App";
import "./global.css";
import { I18nProvider } from "./i18n";

// Hash routing (#/traffic, #/ads/campaigns/<id>): browser back/forward and refresh
// restore the same view, URLs are copyable, and deep links work on the standalone
// Hono host without an index.html fallback for every path.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <Router hook={useHashLocation}>
        <App />
      </Router>
    </I18nProvider>
  </StrictMode>,
);
