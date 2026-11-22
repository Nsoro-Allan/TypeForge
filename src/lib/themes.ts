export interface Theme {
  id: string;
  name: string;
  bg: string;
  main: string;
  sub: string;
  subAlt: string;
  text: string;
  error: string;
  errorExtra: string;
}

export const themes: Theme[] = [
  { id: "forge", name: "forge", bg: "#111111", main: "#facc15", sub: "#5b5b5b", subAlt: "#181818", text: "#e5e5e5", error: "#ef4444", errorExtra: "#7f2a2a" },
  { id: "serika", name: "serika dark", bg: "#323437", main: "#e2b714", sub: "#646669", subAlt: "#2c2e31", text: "#d1d0c5", error: "#ca4754", errorExtra: "#7e2a33" },
  { id: "dracula", name: "dracula", bg: "#282a36", main: "#bd93f9", sub: "#6272a4", subAlt: "#232530", text: "#f8f8f2", error: "#ff5555", errorExtra: "#a33a3a" },
  { id: "nord", name: "nord", bg: "#242933", main: "#88c0d0", sub: "#616e88", subAlt: "#1e222a", text: "#d8dee9", error: "#bf616a", errorExtra: "#7e3b40" },
  { id: "gruvbox", name: "gruvbox dark", bg: "#282828", main: "#d79921", sub: "#7c6f64", subAlt: "#222222", text: "#ebdbb2", error: "#cc241d", errorExtra: "#8f1b17" },
  { id: "solarized", name: "solarized dark", bg: "#002b36", main: "#b58900", sub: "#586e75", subAlt: "#00252e", text: "#93a1a1", error: "#dc322f", errorExtra: "#8c2220" },
  { id: "rosepine", name: "rosé pine", bg: "#191724", main: "#ebbcba", sub: "#6e6a86", subAlt: "#15131f", text: "#e0def4", error: "#eb6f92", errorExtra: "#8f4258" },
  { id: "synthwave", name: "synthwave", bg: "#10091f", main: "#ff2ec4", sub: "#5b4c8a", subAlt: "#0c0718", text: "#e8e4ff", error: "#ffb454", errorExtra: "#8f6530" },
  { id: "matrix", name: "matrix", bg: "#000000", main: "#15ff00", sub: "#0b6b00", subAlt: "#060d06", text: "#b8ffb0", error: "#e03c3c", errorExtra: "#7a2020" },
  { id: "paper", name: "paper", bg: "#eeeeee", main: "#2b2b2b", sub: "#aaaaaa", subAlt: "#e2e2e2", text: "#444444", error: "#d70000", errorExtra: "#e9a0a0" },
];

export const DEFAULT_THEME = "forge";

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? themes[0];
}

/** Writes the theme into CSS variables on <html>; Tailwind tokens read from these. */
export function applyTheme(id: string): void {
  const t = getTheme(id);
  const s = document.documentElement.style;
  s.setProperty("--tf-bg", t.bg);
  s.setProperty("--tf-main", t.main);
  s.setProperty("--tf-sub", t.sub);
  s.setProperty("--tf-sub-alt", t.subAlt);
  s.setProperty("--tf-text", t.text);
  s.setProperty("--tf-error", t.error);
  s.setProperty("--tf-error-extra", t.errorExtra);
  document.documentElement.dataset.theme = t.id;
}
