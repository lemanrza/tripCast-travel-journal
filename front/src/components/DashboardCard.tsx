import type { JSX } from "react";

type DashboardCardProps = {
    icon: JSX.Element;
    label: string;
    value: number;
    color?: string;
};

export default function DashboardCard({ icon, label, value, color }: DashboardCardProps) {
    const bgColors: Record<string, string> = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        purple: "bg-purple-100 text-purple-600",
        orange: "bg-orange-100 text-orange-600",
    };

    const appliedColor = color && bgColors[color] ? bgColors[color] : "bg-gray-100 text-gray-600";

    return (
        <div className="border rounded-lg p-4 py-6 bg-white flex items-center space-x-4 shadow-sm">
            <div className={`p-2 rounded-lg ${appliedColor}`}>
                <div className={`text-3xl  text-${color}-600`}>{icon}</div>
            </div>
            <div>
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="text-xl font-bold">{value}</div>
            </div>
        </div>
    );
}
