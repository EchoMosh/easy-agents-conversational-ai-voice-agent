import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function CustomModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  className = "",
}: CustomModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Handle ESC key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // Restore body scroll when modal closes
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  // Animation handling
  React.useEffect(() => {
    if (open) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Don't render if not open and not animating
  if (!open && !isAnimating) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        open ? "opacity-100" : "opacity-0"
      }`}
      style={{ backgroundColor: open ? "rgba(0, 0, 0, 0.5)" : "transparent" }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[85vh] transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — fixed at top */}
        {(title || description) && (
          <div className="shrink-0 px-6 py-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
        )}

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}

// Custom Modal Footer component
export function CustomModalFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 ${className}`}
    >
      {children}
    </div>
  );
}
