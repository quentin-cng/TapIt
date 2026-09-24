import Link from "next/link";

type TapItWordmarkProps = {
  href?: string;
  className?: string;
};

export function TapItWordmark({
  href = "/dashboard",
  className = "",
}: TapItWordmarkProps) {
  return (
    <Link
      aria-label="TapIt home"
      className={`wordmark ${className}`.trim()}
      href={href}
    >
      Tap<span>It</span>
    </Link>
  );
}
