import type { LucideProps } from "lucide-react";
import { ArrowRight, GitFork, Star } from "lucide-react";

const strokeWidth = 1.8;

export function IconStar(props: LucideProps) {
  return (
    <Star
      aria-hidden="true"
      focusable={false}
      {...props}
      strokeWidth={strokeWidth}
    />
  );
}

export function IconFork(props: LucideProps) {
  return (
    <GitFork
      aria-hidden="true"
      focusable={false}
      {...props}
      strokeWidth={strokeWidth}
    />
  );
}

export function IconArrowRight(props: LucideProps) {
  return (
    <ArrowRight
      aria-hidden="true"
      focusable={false}
      {...props}
      strokeWidth={strokeWidth}
    />
  );
}
