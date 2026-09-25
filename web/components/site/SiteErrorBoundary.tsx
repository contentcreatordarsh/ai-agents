"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class SiteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="site-loading" role="alert">
          <p>STRIKEMAP encountered a display error.</p>
          <button type="button" className="btn-cta" onClick={() => window.location.reload()}>
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
