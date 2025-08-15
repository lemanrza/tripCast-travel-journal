// src/pages/JournalsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FaRegComment, FaRegHeart } from "react-icons/fa";
import { CalendarDays, Search } from "lucide-react";
import { useSelector } from "react-redux";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import formatDate from "@/utils/formatDate";
import type { JournalDetail } from "@/types/JournalType";
import type { Destination } from "@/types/DestinationType";
import type { List } from "@/types/ListType";
import initials from "@/utils/initials";
import type { RootState } from "@/store/store";

type Scope = "all" | "mine" | "shared" | "other";

const idOf = (x: any) => String(x?._id || x?.id || x || "");
const listIdOfDest = (d: any) => idOf(d?.list ?? d?.listId);

export default function JournalsPage() {
  const authUser = useSelector((s: RootState) => s.user);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [lists, setLists] = useState<List[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [_, setJournals] = useState<JournalDetail[]>([]);

  const [viewableJournals, setViewableJournals] = useState<JournalDetail[]>([]);
  const [visibleDestinations, setVisibleDestinations] = useState<Destination[]>([]);

  const [q, setQ] = useState("");
  const [minComments, setMinComments] = useState<number>(0);
  const [scope, setScope] = useState<Scope>("all");
  const [destFilter, setDestFilter] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [listsRes, destsRes, journalsRes] = await Promise.all([
          controller.getAll(endpoints.lists),
          controller.getAll(endpoints.destinations),
          controller.getAll(endpoints.journals),
        ]);

        const ls: List[] = listsRes?.data ?? [];
        const ds: Destination[] = destsRes?.data ?? [];
        const js: JournalDetail[] = journalsRes?.data ?? [];

        if (!alive) return;

        setLists(ls);
        setDestinations(ds);
        setJournals(js);

        const myId = String(authUser?.id);

        const publicListIds = new Set(ls.filter(l => !!(l as any).isPublic).map(l => idOf(l)));
        const ownedListIds = new Set(
          ls.filter(l => idOf(l.owner) === myId).map(l => idOf(l))
        );
        const collabListIds = new Set(
          ls
            .filter(l => (l.collaborators || []).some((c: any) => idOf(c) === myId))
            .map(l => idOf(l))
        );

        const privateMineListIds = new Set<string>([...ownedListIds, ...collabListIds]);

        const publicDestIds = new Set(
          ds.filter(d => publicListIds.has(listIdOfDest(d))).map(d => idOf(d))
        );
        const privateMineDestIds = new Set(
          ds.filter(d => privateMineListIds.has(listIdOfDest(d))).map(d => idOf(d))
        );

        const visibleDests = ds.filter(
          d => publicListIds.has(listIdOfDest(d)) || privateMineListIds.has(listIdOfDest(d))
        );
        setVisibleDestinations(visibleDests);

        const visible = (js || []).filter(j => {
          const destId = idOf((j as any).destination);
          if (privateMineDestIds.has(destId)) return true;
          if (publicDestIds.has(destId)) return !!j.public;
          return false;
        });

        visible.sort((a: any, b: any) => {
          const da = new Date(a?.createdAt || 0).getTime();
          const db = new Date(b?.createdAt || 0).getTime();
          return db - da;
        });

        setViewableJournals(visible);
      } catch (e: any) {
        if (!alive) return;
        console.error("JournalsPage load failed:", e);
        setErr(e?.message || "Failed to load journals");
        setViewableJournals([]);
        setVisibleDestinations([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authUser?.id]);

  const { ownedListIds, collabListIds, publicListIds, destToListId } = useMemo(() => {
    const myId = String(authUser?.id);
    const owned = new Set(lists.filter(l => idOf(l.owner) === myId).map(l => idOf(l)));
    const collab = new Set(
      lists.filter(l => (l.collaborators || []).some((c: any) => idOf(c) === myId)).map(l => idOf(l))
    );
    const pub = new Set(lists.filter(l => !!(l as any).isPublic).map(l => idOf(l)));
    const m = new Map<string, string>();
    for (const d of destinations) m.set(idOf(d), listIdOfDest(d));
    return { ownedListIds: owned, collabListIds: collab, publicListIds: pub, destToListId: m };
  }, [lists, destinations, authUser?.id]);

  const destinationOptions = useMemo(() => {
    const opts = visibleDestinations
      .map(d => ({ id: idOf(d), name: (d as any).name || "Untitled destination" }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [{ id: "all", name: "All destinations" }, ...opts];
  }, [visibleDestinations]);

  const filtered = useMemo(() => {
    const qNorm = q.trim().toLowerCase();

    return viewableJournals.filter((j: any) => {
      const destId = idOf(j.destination);
      const listId = destToListId.get(destId) || "";
      const isOwned = ownedListIds.has(listId);
      const isShared = collabListIds.has(listId) && !isOwned;
      const isOtherPublic = publicListIds.has(listId) && !isOwned && !isShared;

      if (
        (scope === "mine" && !isOwned) ||
        (scope === "shared" && !isShared) ||
        (scope === "other" && !isOtherPublic)
      ) {
        return false;
      }

      if (destFilter !== "all" && destId !== destFilter) return false;

      const commentsCount = Array.isArray(j.comments) ? j.comments.length : Number(j.comments || 0);
      if (commentsCount < minComments) return false;

      if (qNorm) {
        const title = (j.title || "").toLowerCase();
        const content = (j.content || "").toLowerCase();
        const authorName =
          (typeof j.author === "object" && (j.author?.fullName || "").toLowerCase()) || "";
        if (!title.includes(qNorm) && !content.includes(qNorm) && !authorName.includes(qNorm)) {
          return false;
        }
      }

      return true;
    });
  }, [
    viewableJournals,
    q,
    minComments,
    scope,
    destFilter,
    ownedListIds,
    collabListIds,
    publicListIds,
    destToListId,
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 mt-4">
      {/* Header + controls */}
      <div className="mb-6 flex flex-col gap-4  md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Travel Journals</h1>
          <p className="text-muted-foreground">
            Public entries and your private ones, gathered from visible lists.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
          {/* Scope filter */}
          <div className="flex gap-1">
            {[
              { key: "all", label: "All" },
              { key: "mine", label: "My lists" },
              { key: "shared", label: "Shared with me" },
              { key: "other", label: "Other public" },
            ].map((b) => (
              <Button
                key={b.key}
                size="sm"
                variant={scope === (b.key as Scope) ? "default" : "outline"}
                onClick={() => setScope(b.key as Scope)}
              >
                {b.label}
              </Button>
            ))}
          </div>

          {/* Destination filter */}
          <select
            className="w-56 rounded-md border bg-background px-3 py-2 text-sm"
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
          >
            {destinationOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-64 pl-8"
              placeholder="Search title, content, author…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Min comments */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              className="w-28"
              value={minComments}
              onChange={(e) => setMinComments(Math.max(0, Number(e.target.value || 0)))}
              placeholder="Min comments"
            />
            <div className="flex gap-1">
              {[0, 5, 10].map((n) => (
                <Button
                  key={n}
                  variant={minComments === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinComments(n)}
                >
                  {n}+
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQ("");
                setMinComments(0);
                setScope("all");
                setDestFilter("all");
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Body */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-2 text-muted-foreground">Loading journals…</p>
          </div>
        </div>
      ) : err ? (
        <div className="rounded-md border p-6 text-center">
          <p className="text-red-600">{err}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-muted-foreground">
          No journals match your filters.
        </div>
      ) : (
        <div className="relative space-y-6 before:absolute before:left-5 before:top-0 before:h-full before:w-[2px] before:bg-border">
          {filtered.map((j: any) => {
            const id = j.id || j._id;
            const img =
              (Array.isArray(j.photos) && j.photos[0]?.url) ||
              j.image?.url ||
              "";
            const authorName =
              (typeof j.author === "object" && j.author?.fullName) || "Unknown";
            const authorAvatar =
              (typeof j.author === "object" && j.author?.profileImage?.url) || "";
            const created =
              typeof j.createdAt === "string"
                ? j.createdAt
                : j.createdAt
                  ? (j.createdAt as Date).toString()
                  : "";
            const commentsCount = Array.isArray(j.comments)
              ? j.comments.length
              : (j.comments as unknown as number) || 0;
            const likesCount = Array.isArray(j.likes)
              ? j.likes.length
              : (j.likes as unknown as number) || 0;

            return (
              <div key={id} className="relative pl-12">
                {/* timeline dot */}
                <span className="absolute left-[14px] top-8 block h-3 w-3 rounded-full bg-primary" />
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-1 gap-0 md:grid-cols-[260px,1fr]">
                    {/* Image */}
                    <div className="bg-muted/40">
                      {img ? (
                        <img
                          src={img}
                          alt={j.title || "Journal image"}
                          className="h-48 w-90 object-cover"
                        />
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center text-sm text-muted-foreground md:h-full">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            <span>{created ? formatDate(created) : "—"}</span>
                          </div>
                          <h3 className="text-xl font-semibold">{j.title}</h3>
                        </div>

                        <Badge
                          variant="secondary"
                          className={j.public ? "bg-emerald-600 text-white" : "bg-gray-700 text-white"}
                        >
                          {j.public ? "Public" : "Private"}
                        </Badge>
                      </div>

                      <p className="mt-2 line-clamp-3 text-muted-foreground">
                        {j.content}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={authorAvatar} />
                            <AvatarFallback>{initials(authorName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{authorName}</span>
                        </div>

                        {/* Stats */}
                        <span className="ml-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <FaRegHeart /> {likesCount} likes
                        </span>
                        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <FaRegComment /> {commentsCount} comments
                        </span>

                        <div className="ml-auto">
                          <Link to={`/journals/${id}`}>
                            <Button variant="outline" size="sm">
                              Read Detail
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
