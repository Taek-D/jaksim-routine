import React, { Component } from "react";
import type { ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import App from "./app/App";
import "./styles.css";

class TDSErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // TDS provider fails outside Toss app — fall through to children only
  }

  render() {
    if (this.state.hasError) {
      return this.props.children;
    }
    return <TDSMobileAITProvider>{this.props.children}</TDSMobileAITProvider>;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TDSErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TDSErrorBoundary>
  </React.StrictMode>
);

