import { Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
};

export default function SearchBar({ value, onChange, className = "" }: Props) {
  return (
    <div
      className={`flex items-center gap-2 border px-3 py-2 rounded-lg bg-white shadow-sm
                  focus-within:ring-2 focus-within:ring-blue-500
                  w-full sm:w-auto sm:min-w-[320px] ${className}`}
    >
      <Search className="text-gray-700 w-5 h-5 shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search destinations, lists..."
        className="w-full border-none outline-none bg-transparent text-[15px]"
      />
    </div>
  );
}
