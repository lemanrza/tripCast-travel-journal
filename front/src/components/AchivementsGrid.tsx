// src/components/profile/AchievementsGrid.tsx
// CHANGES: removed 'shared' everywhere, count only mine

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, NotebookPen } from "lucide-react";
import { useSelector } from "react-redux";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";

type RootUser = { id: string; fullName?: string };
type List = { destinations?: Array<{ status?: string }> };
type Journal = { _id?: string };
type Unlocked = { key: string; unlockedAt: string };

type Ctx = { completed: number; journals: number };

const ACHIEVEMENTS = [
  { key: "first_journey", title: "First Journey", desc: "Completed your first destination",
    icon: <Star className="w-6 h-6 text-yellow-600" />, dot: "bg-yellow-100", bar: "bg-yellow-500",
    goal: 1, progress: (c: Ctx) => c.completed },
  { key: "explorer_10", title: "Explorer", desc: "Visited 10 destinations",
    icon: <MapPin className="w-6 h-6 text-blue-600" />, dot: "bg-blue-100", bar: "bg-blue-500",
    goal: 10, progress: (c: Ctx) => c.completed },
  { key: "storyteller_3", title: "Storyteller", desc: "Wrote 3 journals",
    icon: <NotebookPen className="w-6 h-6 text-rose-600" />, dot: "bg-rose-100", bar: "bg-rose-500",
    goal: 3, progress: (c: Ctx) => c.journals },
];

export default function AchievementsGrid() {
  const auth = useSelector((s: any) => s.user) as RootUser;

  const [mine, setMine] = useState<List[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [unlocked, setUnlocked] = useState<Unlocked[]>([]);
  const patchingRef = useRef(false);

  useEffect(() => {
    if (!auth?.id) return;
    (async () => {
      try {
        const [me, js, userRes] = await Promise.all([
          controller.getAll(`${endpoints.lists}/my-lists`),
          controller.getAll(`${endpoints.journals}/my`),
          controller.getOne(`${endpoints.users}/user`, auth.id),
        ]);
        setMine(me?.data || []);
        setJournals(js?.data || []);
        setUnlocked(userRes?.data?.achievements || []);
      } catch (e) {
        console.error("[achievements] load", e);
      }
    })();
  }, [auth?.id]);

  const isCompleted = (s?: string) => {
    const v = (s || "").toLowerCase();
    return v === "completed" || v === "complete" || v === "visited" || v === "done";
  };

  const ctx: Ctx = useMemo(() => {
    const completed =
      (mine || []).reduce(
        (sum, l) => sum + (l.destinations || []).filter((d) => isCompleted(d?.status)).length,
        0
      ) || 0;
    return { completed, journals: journals.length || 0 };
  }, [mine, journals]);

  useEffect(() => {
    if (!auth?.id || patchingRef.current) return;
    const have = new Set((unlocked || []).map((u) => u.key));
    const toAdd = ACHIEVEMENTS
      .filter((a) => !have.has(a.key) && a.progress(ctx) >= a.goal)
      .map((a) => a.key);
    if (!toAdd.length) return;

    patchingRef.current = true;
    (async () => {
      try {
        const res = await controller.updateUser(`${endpoints.users}/user`, auth.id, {
          achievementsAdd: toAdd,
        });
        setUnlocked(
          res?.data?.achievements ??
            [...unlocked, ...toAdd.map((k) => ({ key: k, unlockedAt: new Date().toISOString() }))]
        );
      } catch (e) {
        console.error("[achievements] patch failed", e);
      } finally {
        patchingRef.current = false;
      }
    })();
  }, [ctx, auth?.id, unlocked]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {ACHIEVEMENTS.map((a) => {
        const value = a.progress(ctx);
        const isUnlocked = value >= a.goal;
        const pct = Math.min(100, Math.round((value / a.goal) * 100));
        return (
          <Card key={a.key} className="border border-gray-200 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className={`w-16 h-16 rounded-full grid place-items-center ${a.dot}`}>{a.icon}</div>
              <div className="space-y-1">
                <div className="text-lg font-semibold">{a.title}</div>
                <div className="text-sm text-muted-foreground">{a.desc}</div>
              </div>
              <Badge variant="secondary" className={isUnlocked ? "bg-black text-white px-3" : "px-3"}>
                {isUnlocked ? "Unlocked" : "Locked"}
              </Badge>
              {!isUnlocked && (
                <div className="w-full mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${a.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{value} / {a.goal}</div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
