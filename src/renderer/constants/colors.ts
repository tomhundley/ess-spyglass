// Tab/folder color palette
export const TAB_COLORS = [
  '#4ade80',
  '#60a5fa',
  '#f472b6',
  '#fbbf24',
  '#a78bfa',
  '#f87171',
  '#2dd4bf',
  '#fb923c',
  '#a3e635',
  '#22d3ee',
] as const;

// Icon colors
export const ICON_COLORS = {
  FOLDER: '#fbbf24',
  FILE: '#60a5fa',
  CHECK: '#4ade80',
} as const;

export type TabColor = typeof TAB_COLORS[number];
