
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lead } from "@/pages/dashboard/leads";

interface CardProps {
  lead: Lead;
  isOverlay?: boolean;
  onClick?: () => void;
}

export function Card({ lead, isOverlay = false, onClick }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 mb-2 bg-white border rounded-md shadow-sm hover:shadow cursor-pointer ${
        isOverlay ? "shadow-lg" : ""
      }`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <h3 className="font-medium text-gray-900 truncate">{lead.name}</h3>
      {lead.company && (
        <p className="text-sm text-gray-500 truncate">{lead.company}</p>
      )}
      {lead.email && (
        <p className="text-sm text-gray-500 truncate">{lead.email}</p>
      )}
    </div>
  );
}
