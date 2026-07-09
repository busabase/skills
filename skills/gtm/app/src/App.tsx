"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { GtmDataProvider, GtmLocaleProvider, useGtmLocale } from "./data";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("GTM App error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", color: "red" }}>
          <h2>GTM App Error</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error)}</pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Route, Router, Switch } from "wouter";
import { gtmData } from "~/domains/gtm/data";
import { mockDistributionItems } from "~/domains/gtm/data/distribution";
import { GtmLayout } from "./layout";
import { getSkillGtmRoutes } from "./routes";

function GtmApp() {
  const locale = useGtmLocale();
  const routes = getSkillGtmRoutes(locale);

  return (
    <Router>
      <Switch>
        {routes.map(({ path, element, title }) => (
          <Route key={path} path={path}>
            <GtmLayout title={title}>{element()}</GtmLayout>
          </Route>
        ))}
      </Switch>
    </Router>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <GtmLocaleProvider locale="en">
        <GtmDataProvider value={{ data: gtmData, distributionItems: mockDistributionItems }}>
          <GtmApp />
        </GtmDataProvider>
      </GtmLocaleProvider>
    </ErrorBoundary>
  );
}
