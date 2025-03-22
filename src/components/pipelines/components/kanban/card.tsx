
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
      {lead.email && (
        <p className="text-sm text-gray-500 truncate">{lead.email}</p>
      )}
      {lead.phone && (
        <p className="text-sm text-gray-500 truncate">{lead.phone}</p>
      )}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {lead.tags.slice(0, 2).map(tag => (
            <span 
              key={tag.id} 
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
            >
              {tag.name}
            </span>
          ))}
          {lead.tags.length > 2 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              +{lead.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
