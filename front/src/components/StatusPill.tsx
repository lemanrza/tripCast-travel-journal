import type { Destination } from "@/types/DestinationType";
import { CheckCircle2 } from "lucide-react";

function StatusPill({ status }: { status: Destination["status"] }) {
    const styles: Record<string, string> = {
        wishlist: "bg-slate-200 text-slate-900",
        planned: "bg-amber-100 text-amber-900",
        completed: "bg-emerald-100 text-emerald-900",
    };
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}> <CheckCircle2 className="h-3.5 w-3.5" /> {label}</span>;
}
export default StatusPill;