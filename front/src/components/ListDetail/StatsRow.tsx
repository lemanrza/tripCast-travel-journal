import StatCard from "@/components/StatCard";
import { MapPin, CheckCircle2, Users2, Pencil } from "lucide-react";

type Props = {
  destCount: number;
  completedCount: number;
  memberCount: number;
  journalCount: number;
};

export default function StatsRow({ destCount, completedCount, memberCount, journalCount }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <StatCard icon={<MapPin className="h-5 w-5 text-blue-500" />} value={destCount} label="Destinations" />
      <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} value={completedCount} label="Completed" />
      <StatCard icon={<Users2 className="h-5 w-5 text-purple-600" />} value={memberCount} label="Members" />
      <StatCard icon={<Pencil className="h-5 w-5 text-orange-500" />} value={journalCount} label="Journal Entries" />
    </div>
  );
}
