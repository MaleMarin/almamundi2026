export function CintaStripe({
  colors,
  height,
  className,
}: {
  colors?: string[];
  height: number;
  className?: string;
}) {
  const list = (colors ?? []).filter((color) => /^#[0-9A-Fa-f]{6}$/.test(color));
  if (list.length === 0) return null;
  const background = list.length === 1 ? list[0] : `linear-gradient(90deg, ${list.join(", ")})`;
  return (
    <div
      aria-hidden
      className={className}
      style={{ height, width: "100%", background, flexShrink: 0, pointerEvents: "none" }}
    />
  );
}
