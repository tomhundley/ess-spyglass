interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return <div className="file-list-empty">{message}</div>;
}

export function LoadingState() {
  return (
    <div className="file-list-loading">
      <div className="loading-spinner" />
    </div>
  );
}

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="file-list-error">
      <span className="error-icon">!</span>
      <span className="error-message">{message}</span>
    </div>
  );
}
