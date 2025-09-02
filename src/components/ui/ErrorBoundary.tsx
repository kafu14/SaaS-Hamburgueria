// src/components/system/ErrorBoundary.tsx
import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("UI crash", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center p-6">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-semibold mb-2">Algo falhou por aqui.</h1>
            <p className="text-sm opacity-70 mb-4">{this.state.message}</p>
            <a href="/" className="underline">Recarregar</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
