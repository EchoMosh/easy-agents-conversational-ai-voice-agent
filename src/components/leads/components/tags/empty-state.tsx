interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <p className="text-sm text-muted-foreground py-4 text-center">
      No tags yet
    </p>
  );
}
