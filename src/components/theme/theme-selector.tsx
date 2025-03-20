
import { useThemeStyle } from "@/context/theme-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

export function ThemeSelector() {
  const { themeStyle, setThemeStyle } = useThemeStyle();

  const themes = [
    {
      id: "amber",
      name: "Amber",
      description: "Warm amber accents with neutral backgrounds",
      primaryColor: "bg-[hsl(47.9,95.8%,53.1%)]",
      secondaryColor: "bg-[hsl(60,4.8%,95.9%)]",
    },
    {
      id: "default",
      name: "Classic",
      description: "Clean monochromatic design with neutral colors",
      primaryColor: "bg-[hsl(240,5.9%,10%)]",
      secondaryColor: "bg-[hsl(240,4.8%,95.9%)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {themes.map((theme) => (
        <Button
          key={theme.id}
          variant="outline"
          className={cn(
            "relative h-auto flex-col items-start justify-start p-4 text-left",
            themeStyle === theme.id && "border-2 border-primary"
          )}
          onClick={() => setThemeStyle(theme.id as "amber" | "default")}
        >
          {themeStyle === theme.id && (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CheckIcon className="h-4 w-4" />
            </span>
          )}
          <div className="mb-4 flex w-full gap-2">
            <div className={cn("h-6 w-6 rounded-full", theme.primaryColor)} />
            <div
              className={cn("h-6 w-6 rounded-full", theme.secondaryColor)}
            />
          </div>
          <div className="font-medium">{theme.name}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {theme.description}
          </p>
        </Button>
      ))}
    </div>
  );
}
