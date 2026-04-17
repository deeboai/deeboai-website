"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "left" | "right";
  delayMs?: number;
  initiallyVisible?: boolean;
};

export function Reveal({
  children,
  className,
  variant = "default",
  delayMs = 0,
  initiallyVisible = false,
}: RevealProps) {
  const revealRef = useScrollReveal<HTMLDivElement>({
    initialClassName: initiallyVisible ? null : "reveal-element",
  });

  return (
    <div
      ref={revealRef}
      className={cn(!initiallyVisible && "reveal-element", className)}
      data-variant={variant === "default" ? undefined : variant}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
