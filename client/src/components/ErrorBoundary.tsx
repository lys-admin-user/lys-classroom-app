import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

// App-wide safety net. Without this, any render-time throw unmounts the whole
// React tree and the user is left staring at a blank white screen with no way
// to recover. This catches the error, keeps the page usable, and offers a way
// back. The error message is surfaced so issues are diagnosable instead of
// silently blanking the app.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Caught render error:", error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? null });
  }

  private handleReload = () => {
    this.setState({ error: null, componentStack: null });
    window.location.assign("/");
  };

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background p-6"
        data-testid="app-error-boundary"
      >
        <div className="max-w-lg w-full text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-lys-red/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-lys-red" />
          </div>
          <h1 className="font-oswald text-2xl text-foreground">Something went wrong</h1>
          <p className="font-roboto text-muted-foreground">
            This page hit an unexpected error. You can head back home and try again.
          </p>
          <pre
            className="text-left text-xs bg-muted/50 rounded-md p-3 overflow-auto max-h-48 whitespace-pre-wrap break-words"
            data-testid="text-error-message"
          >
            {error.message}
            {componentStack ? `\n\nComponent stack:${componentStack}` : ""}
          </pre>
          <Button onClick={this.handleReload} data-testid="button-error-reload">
            Back to home
          </Button>
        </div>
      </div>
    );
  }
}
