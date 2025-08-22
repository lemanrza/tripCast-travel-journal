// components/Profile/RecentActivity.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, NotebookPen, List as ListIcon } from "lucide-react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";

import type { List as ListType } from "@/types/ListType";
import type { Destination } from "@/types/DestinationType";
import type { JournalDetail } from "@/types/JournalType";

type Props = { userId?: string | null };

const idOf = (x: any) => String(x?._id || x?.id || x || "");

// helpers to safely pick an image url
const firstPhoto = (arr: any[] | undefined): string | "" => {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const p = arr[0];
  return typeof p === "string" ? p : p?.url || "";
};

const pickImageUrl = (obj: any): string => {
  return obj?.coverImage?.url || obj?.image?.url || firstPhoto(obj?.photos) || "";
};

export default function RecentActivity({ userId }: Props) {
  const [loading, setLoading] = useState(true);
  const [lastList, setLastList] = useState<ListType | null>(null);
  const [lastDest, setLastDest] = useState<
    (Destination & { _listId?: string; _listTitle?: string; _imgUrl?: string }) | null
  >(null);
  const [lastJournal, setLastJournal] = useState<JournalDetail | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // your own lists & journals
        const [listsRes, journalsRes] = await Promise.all([
          controller.getAll(`${endpoints.lists}/my-lists`),
          controller.getAll(`${endpoints.journals}/my`),
        ]);

        const myLists: ListType[] = listsRes?.data ?? [];
        const myJournals: JournalDetail[] = journalsRes?.data ?? [];

        // latest list
        const latestList =
          myLists
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(b?.createdAt || b?.updatedAt || 0).getTime() -
                new Date(a?.createdAt || a?.updatedAt || 0).getTime()
            )[0] || null;

        // flatten destinations with list info + image
        const destsWithList = myLists.flatMap((l: any) =>
          (l?.destinations || []).map((d: any) => ({
            ...d,
            _listId: idOf(l),
            _listTitle: l?.title,
            _imgUrl: pickImageUrl(d),
          }))
        );

        // latest destination (prefer by updatedAt/createdAt)
        let latestDest =
          destsWithList
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(b?.createdAt || b?.updatedAt || 0).getTime() -
                new Date(a?.createdAt || a?.updatedAt || 0).getTime()
            )[0] || null;

        // fallback image for destination: first journal photo linked to that destination
        if (latestDest && !latestDest._imgUrl) {
          const did = idOf(latestDest);
          const j = (myJournals || []).find(
            (jj: any) => idOf(jj?.destination) === did && Array.isArray(jj?.photos) && jj.photos.length > 0
          );
          latestDest = {
            ...latestDest,
            _imgUrl: j ? firstPhoto(j.photos as any[]) : "",
          };
        }

        // latest journal
        const latestJournal =
          myJournals
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
            )[0] || null;

        if (!alive) return;
        setLastList(latestList);
        setLastDest(latestDest);
        setLastJournal(latestJournal);
      } catch {
        if (!alive) return;
        setLastList(null);
        setLastDest(null);
        setLastJournal(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex h-36 items-center justify-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Latest List */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 ring-1 ring-blue-100">
                  <ListIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-blue-700">Latest List</div>
              </div>

              {lastList ? (
                <>
                  <h3 className="line-clamp-2 text-lg font-semibold">
                    {lastList.title || "Untitled list"}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {lastList.description || "No description"}
                  </p>

                  {lastList?.coverImage ? (
                    <div className="mt-3 overflow-hidden rounded-lg">
                      <img
                        src={lastList.coverImage}
                        alt={lastList.title || "List cover"}
                        className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <Link to={`/lists/${idOf(lastList)}`}>
                      <Button size="sm" variant="secondary" className="w-full">
                        Open List
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  You don’t have any lists yet.
                  <div className="mt-3">
                    <Link to="/dashboard">
                      <Button size="sm" variant="outline" className="w-full">
                        Create your first list
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Latest Destination */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-sm font-medium text-emerald-700">Latest Destination</div>
              </div>

              {lastDest ? (
                <>
                  <h3 className="line-clamp-2 text-lg font-semibold">
                    {(lastDest as any).name || "Unnamed destination"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    in <span className="font-medium">{(lastDest as any)._listTitle || "—"}</span>
                  </p>

                  {lastDest._imgUrl ? (
                    <div className="mt-3 overflow-hidden rounded-lg">
                      <img
                        src={lastDest._imgUrl}
                        alt={(lastDest as any).name || "Destination image"}
                        className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <Link to={`/lists/${(lastDest as any)._listId ?? ""}`}>
                      <Button size="sm" variant="secondary" className="w-full">
                        Open List
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No destinations yet.
                  <div className="mt-3">
                    <Link to="/dashboard">
                      <Button size="sm" variant="outline" className="w-full">
                        Add a destination
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Latest Journal */}
            <div className="group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-rose-50 ring-1 ring-rose-100">
                  <NotebookPen className="h-5 w-5 text-rose-600" />
                </div>
                <div className="text-sm font-medium text-rose-700">Latest Journal</div>
              </div>

              {lastJournal ? (
                <>
                  <h3 className="line-clamp-2 text-lg font-semibold">
                    {lastJournal.title || "Untitled journal"}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {lastJournal.content || "No content"}
                  </p>

                  {Array.isArray(lastJournal.photos) && lastJournal.photos.length > 0 ? (
                    <div className="mt-3 overflow-hidden rounded-lg">
                      <img
                        src={
                          typeof lastJournal.photos[0] === "string"
                            ? (lastJournal.photos[0] as string)
                            : (lastJournal.photos[0] as any)?.url
                        }
                        alt={lastJournal.title || "Journal photo"}
                        className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <Link to={`/journals/${idOf(lastJournal)}`}>
                      <Button size="sm" variant="secondary" className="w-full">
                        Read Journal
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No journal entries yet.
                  <div className="mt-3">
                    <Link to="/dashboard">
                      <Button size="sm" variant="outline" className="w-full">
                        Write your first journal
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
