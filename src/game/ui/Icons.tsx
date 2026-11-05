import type { SVGProps } from "react";

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function DiamondIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12 2 22 12 12 22 2 12Z" fill="none" stroke="currentColor" strokeWidth={2.4} />
      <path d="M12 8 16 12 12 16 8 12Z" fill="currentColor" />
    </svg>
  );
}

export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 5h16v11H9l-5 4z" />
      <circle cx="9" cy="10.5" r="0.6" fill="currentColor" />
      <circle cx="12" cy="10.5" r="0.6" fill="currentColor" />
      <circle cx="15" cy="10.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function ArmIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M5 20c0-4 1-7 3-9l2-5c.6-1.4 2.6-1.4 3 0l.6 2-2 2 1 2c2-1.5 5-1 6 1.5 1 3-1 6.5-5 6.5Z" />
    </svg>
  );
}

export function BrainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h1V4z" />
      <path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h-1V4z" />
      <path d="M7 10h3M14 14h3M7 15h2M15 9h2" />
    </svg>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </svg>
  );
}

export function HandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11m0-6a1.5 1.5 0 0 1 3 0v6m0-5a1.5 1.5 0 0 1 3 0v6m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 14.5a1.5 1.5 0 0 1 2.5-1.6L7 14" />
    </svg>
  );
}

export function MouseIcon(props: SVGProps<SVGSVGElement> & { button?: "left" | "none" }) {
  const { button = "none", ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" {...base} {...rest}>
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <path d="M12 3v6" />
      {button === "left" && <path d="M6.5 9V8a5.5 5.5 0 0 1 5.5-5v6Z" fill="currentColor" />}
    </svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...base} strokeWidth={3} {...props}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}
