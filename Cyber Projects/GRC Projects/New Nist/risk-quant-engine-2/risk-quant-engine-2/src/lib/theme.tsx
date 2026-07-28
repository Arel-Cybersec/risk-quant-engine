import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const THEMES = [
  { id: "tactical", label: "TACTICAL", swatch: "#ffc700" },
  { id: "matrix", label: "TERMINAL", swatch: "#00ff66" },
  { id: "slate", label: "SLATE", swatch: "#6f7bf7" },
  { id: "abyss", label: "ABYSS", swatch: "#2dd9c4" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const ThemeCtx = createContext<{ theme: ThemeId; setTheme: (t: ThemeId) => void }>({
  theme: "tactical",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>("tactical");

  useEffect(() => {
    const stored = localStorage.getItem("sentinel_theme") as ThemeId | null;
    if (stored && THEMES.some((t) => t.id === stored)) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sentinel_theme", theme);
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/** Reads a live CSS custom property from :root (client only). */
export function cssVar(name: string, fallback = "#ffc700") {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
