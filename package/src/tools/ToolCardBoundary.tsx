import React from 'react';

export interface ToolCardBoundaryProps {
  /** Reset key: a new value renders the children again after a failure, for example the call id */
  resetKey?: string;
  /** Rendered instead of the children once they throw */
  fallback: React.ReactNode;
  /** Called with the error the children threw */
  onError?: (error: unknown) => void;
  children?: React.ReactNode;
}

type ToolCardBoundaryState = { hasError: boolean; resetKey: string | undefined };

/** Keeps a throwing tool card from unmounting the transcript around it */
export class ToolCardBoundary extends React.Component<
  ToolCardBoundaryProps,
  ToolCardBoundaryState
> {
  constructor(props: ToolCardBoundaryProps) {
    super(props);
    this.state = { hasError: false, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(): Partial<ToolCardBoundaryState> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(
    props: ToolCardBoundaryProps,
    state: ToolCardBoundaryState
  ): Partial<ToolCardBoundaryState> | null {
    if (state.resetKey === props.resetKey) {
      return null;
    }
    return { hasError: false, resetKey: props.resetKey };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
