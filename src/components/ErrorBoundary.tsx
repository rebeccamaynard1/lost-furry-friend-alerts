import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logger } from "@/lib/logger";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("ErrorBoundary caught", {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted px-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="mb-2 text-3xl font-bold font-heading text-foreground">
              Something went wrong
            </h1>
            <p className="mb-6 text-muted-foreground">
              We hit an unexpected error. Please try again, and if the problem
              persists let us know.
            </p>
            {this.state.error?.message && (
              <p className="mb-6 text-xs text-muted-foreground/70 break-words">
                {this.state.error.message}
              </p>
            )}
            <Button variant="hero" onClick={this.handleReset}>
              Return Home
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
