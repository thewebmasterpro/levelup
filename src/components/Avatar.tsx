/* eslint-disable @next/next/no-img-element */

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export default function Avatar({
  url,
  name,
  size = "md",
}: {
  url: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizes[size]} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-amber-400/15 font-semibold text-amber-400`}
    >
      {initials || "?"}
    </span>
  );
}
