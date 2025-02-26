
interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="text-center p-6 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-4">No variables added yet</p>
      <button
        onClick={onAddClick}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        Add your first variable
      </button>
    </div>
  );
}
