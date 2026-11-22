import type { ReactNode } from "react";

function Icon({ children, className = "w-[18px] h-[18px]" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const KeyboardIcon = () => (
  <Icon>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
  </Icon>
);
export const GameIcon = () => (
  <Icon>
    <rect x="2" y="6" width="20" height="12" rx="5" />
    <path d="M7 10v4M5 12h4M15.5 11h.01M18 13h.01" />
  </Icon>
);
export const ChartIcon = () => (
  <Icon>
    <path d="M4 20V11M10 20V4M16 20v-6M22 20H2" />
  </Icon>
);
export const SettingsIcon = () => (
  <Icon>
    <path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0" />
    <circle cx="15" cy="6" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="18" r="2" />
  </Icon>
);
export const CommandIcon = () => (
  <Icon>
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </Icon>
);
export const RestartIcon = () => (
  <Icon className="w-5 h-5">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </Icon>
);
