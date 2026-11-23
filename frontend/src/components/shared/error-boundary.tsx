"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in UI:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.fallback) {
        return this.fallback;
      }
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-red-200">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
          <h2 className="text-lg font-semibold text-[#362A22] mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-[#79695B] max-w-md mb-4">
            {this.state.error?.message || "An unexpected error occurred in this view."}
          </p>
          <Button
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }

  private get fallback() {
    return this.props.fallback;
  }
}
