import { Card, CardContent } from "./ui/card";

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card>
      <CardContent className="flex items-center flex-col gap-2 justify-between px-6">
        <div className="flex items-center gap-3 text-primary">{icon}</div>
        <div className="text-center">
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
export default StatCard;