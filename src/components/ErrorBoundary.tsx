import { Component, type ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-svh w-full items-center justify-center bg-background p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center max-w-sm"
          >
            <span className="text-4xl">💥</span>
            <h2 className="text-lg font-medium text-foreground">Something broke</h2>
            <p className="text-xs text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground signal-glow signal-ease mt-2"
            >
              Reload
            </motion.button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
