type Props = { replied: any; preview: (m: any) => string };

export default function QuoteBlock({ replied, preview }: Props) {
  if (!replied) return null;
  const a = replied?.author;
  const name = typeof a === "string" ? "Someone" : a?.fullName || "Someone";
  return (
    <div className="mb-1 rounded border-l-2 border-l-blue-400 bg-white/60 px-2 py-1 text-[11px] text-gray-600">
      <span className="font-medium">{name}:</span> {preview(replied)}
    </div>
  );
}
