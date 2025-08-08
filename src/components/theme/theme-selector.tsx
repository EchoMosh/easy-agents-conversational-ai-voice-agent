
import { useThemeStyle } from "@/context/theme-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

export function ThemeSelector() {
  const { themeStyle, setThemeStyle } = useThemeStyle();

  const themes = [
    {
      id: "default",
      name: "Classic",
      description: "Clean monochromatic design with neutral colors",
      primaryColor: "bg-[hsl(240,5.9%,10%)]",
      secondaryColor: "bg-[hsl(240,4.8%,95.9%)]",
    },
    {
      id: "blue",
      name: "Blue",
      description: "Modern blue design with clean interface",
      primaryColor: "bg-[hsl(221.2,83.2%,53.3%)]",
      secondaryColor: "bg-[hsl(210,40%,96.1%)]",
    },
    {
      id: "green",
      name: "Green",
      description: "Fresh green theme with nature-inspired colors",
      primaryColor: "bg-[hsl(142.1,76.2%,36.3%)]",
      secondaryColor: "bg-[hsl(240,4.8%,95.9%)]",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium">Theme Style</h3>
      <p className="text-muted-foreground">Choose a color theme for your workspace</p>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
          <Button
            key={theme.id}
            variant="outline"
            className={cn(
              "relative h-auto flex-col items-start justify-start p-4 text-left",
              themeStyle === theme.id && "border-2 border-primary"
            )}
            onClick={() => {
              setThemeStyle(theme.id as "default" | "blue" | "green");
              // Force a style refresh by toggling a data attribute on the root element
              setTimeout(() => {
                document.documentElement.setAttribute("data-theme-style", theme.id);
              }, 0);
            }}
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
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">
              {theme.description}
            </p>
          </Button>
        ))}
      </div>
    </div>
  );
}
