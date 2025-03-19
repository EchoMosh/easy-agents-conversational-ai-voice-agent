
import React from "react";
import { Building, Briefcase, Globe, Home, Factory } from "lucide-react";
import { cn } from "@/lib/utils";

const iconComponents = {
  building: Building,
  briefcase: Briefcase,
  globe: Globe,
  house: Home,
  factory: Factory,
};

type IconSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  icons?: string[];
  className?: string;
};

export function IconSelector({
  value,
  onChange,
  icons = ["building", "briefcase", "globe", "house", "factory"],
  className,
}: IconSelectorProps) {
  return (
    <div className={cn("grid grid-cols-5 gap-3", className)}>
      {icons.map((iconName) => {
        const IconComponent = iconComponents[iconName as keyof typeof iconComponents];
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={cn(
              "flex h-14 w-full items-center justify-center rounded-md border border-gray-200 transition-all",
              value === iconName
                ? "border-primary bg-primary/10"
                : "hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <IconComponent className="h-6 w-6" />
          </button>
        );
      })}
    </div>
  );
}
