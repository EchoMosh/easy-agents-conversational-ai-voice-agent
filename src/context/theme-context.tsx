
import React, { createContext, useContext, useState, useEffect } from "react";
import { useTheme } from "next-themes";

type ThemeStyle = "amber" | "default" | "blue";

interface ThemeContextType {
  themeStyle: ThemeStyle;
  setThemeStyle: (style: ThemeStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>(() => {
    // Get stored theme style from localStorage or default to 'amber'
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("themeStyle");
      return (stored as ThemeStyle) || "amber";
    }
    return "amber";
  });
  
  const { setTheme } = useTheme();

  // Apply the theme style when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Store theme preference
      localStorage.setItem("themeStyle", themeStyle);
      
      // Add the theme style as a data attribute to the document element
      document.documentElement.setAttribute("data-theme-style", themeStyle);
      
      // Apply any specific configurations for each theme if needed
      // This is where we might add additional class names or other adjustments
    }
  }, [themeStyle]);

  return (
    <ThemeContext.Provider value={{ themeStyle, setThemeStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeStyle = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeStyle must be used within a ThemeProvider");
  }
  return context;
};
