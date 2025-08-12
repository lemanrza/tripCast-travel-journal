import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Users2, MapPin, Pencil, Trash2, MessageSquare, Share2, Settings, Plus, Star, CalendarDays } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import formatDate from "@/utils/formatDate";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import Members from "@/components/ListDetail/Members";

// Demo data types


export default function TravelListDetail() {
  const { id: listId } = useParams();
  const [listData, setListData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchListData = async () => {
      if (!listId) {
        setError("No list ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await controller.getOne(endpoints.lists, listId);

        if (response && response.data) {
          setListData(response.data);
          console.log("Fetched list data:", response.data);
        } else {
          setError("Failed to fetch list data");
        }
      } catch (err: any) {
        console.error("Error fetching list:", err);
        setError(err.message || "Failed to fetch list data");
      } finally {
        setLoading(false);
      }
    };

    fetchListData();
  }, [listId]);
  console.log("List ID from URL:", listData);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading list details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  const listTitle = listData?.title || "European Adventure 2024";
  const description = listData?.description || "Exploring the historic cities and beautiful landscapes of Europe";
  const tags = listData?.tags || ["culture", "history", "food"];

  const photos = new Array(8).fill(null);

  const statDestinations = listData?.destinations?.length || 0;
  const statCompleted = listData?.destinations?.filter((d: any) => d.status === "completed")?.length || 0;
  const statMembers = listData?.collaborators?.length || 0;

  return (
    <div className="mx-auto max-w-8xl px-4 pb-16">
      {/* Back */}
      <div className="mb-4 text-sm">
        <Link to={"/dashboard"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">← Back to Dashboard</Link>
      </div>

      {/* Cover / Hero */}
      <div className="relative mb-6 overflow-hidden rounded-xl border bg-muted/60">
        {listData?.coverImage ? (
          <img
            src={listData.coverImage}
            alt={listTitle}
            className="aspect-[16/5] w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/5] w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
          <h1 className="text-4xl font-semibold text-white drop-shadow-sm">{listTitle}</h1>
          <p className="mt-2 max-w-2xl text-white/90">{description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t: string) => (
              <Badge key={t} variant="secondary" className="bg-white/90 text-gray-900">#{t}</Badge>
            ))}
          </div>

          <div className="mt-4 flex gap-2 self-end">
            <Button variant="secondary" className="bg-white/90 text-gray-900"><MessageSquare className="mr-2 h-4 w-4" /> Chat</Button>
            <Button variant="secondary" className="bg-white/90 text-gray-900"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            <Button variant="secondary" className="bg-white/90 text-gray-900"><Settings className="mr-2 h-4 w-4" /> Settings</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<MapPin className="h-5 w-5 text-blue-500" />} value={statDestinations} label="Destinations" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} value={statCompleted} label="Completed" />
        <StatCard icon={<Users2 className="h-5 w-5 text-purple-600" />} value={statMembers} label="Members" />
        {/* <StatCard icon={<Pencil className="h-5 w-5 text-orange-500" />} value={statJournals} label="Journal Entries" /> */}
      </div>

      <Members 
        collaborators={listData?.collaborators || []} 
        onSearchUsers={async (q) => {
          const response = await controller.getAll(`${endpoints.users}/search?q=${encodeURIComponent(q)}`);
          if (response && response.data) {
            // Map _id to id for compatibility
            return response.data.map((user: any) => ({
              ...user,
              id: user._id || user.id,
              avatarUrl: user.profileImage?.url
            }));
          }
          return [];
        }}
        onInvite={async (userId) => {
          const response = await controller.post(`${endpoints.lists}/${listId}/invite`, {
            userId,
          });
          if (!response || !response.success) {
            throw new Error("Invite failed");
          }
        }} 
      />

      {/* Tabs */}
      <Tabs defaultValue="destinations" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="journals">Journal Entries</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        {/* Destinations Tab */}
        <TabsContent value="destinations">
          <div className="mb-4 flex justify-end">
            <Button variant="default" className="gap-2"><Plus className="h-4 w-4" /> Add Destination</Button>
          </div>

          <Card>
            {listData?.destinations?.length > 0 ? (
              listData.destinations.map((d: any) => (
                <div key={d.id || d._id} className="grid grid-cols-2 md:grid-cols-[320px,1fr]">
                  {/* image placeholder */}
                  {d.image?.url ? (
                    <img src={d.image.url} alt={d.name || 'Destination'} className="h-64 w-full object-cover" />
                  ) : (
                    <div className="h-64 w-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                  {/* details */}
                  <div className="border-t md:border-l md:border-t-0">
                    <div className="flex items-start justify-between p-6">
                      <div>
                        <h3 className="text-xl font-semibold">{d.name}</h3>
                        <p className="text-muted-foreground">{d.country}</p>
                        <div className="mt-2">
                          <StatusPill status={d.status} />
                        </div>
                        {d.rating && (
                          <div className="mt-3 flex items-center gap-1">
                            {new Array(5).fill(null).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < (d.rating || 0) ? "fill-current" : "opacity-30"}`} />
                            ))}
                            <span className="ml-1 text-sm text-muted-foreground">({d.rating}/5)</span>
                          </div>
                        )}
                        <p className="mt-3 text-sm text-muted-foreground max-w-3xl">{d.notes}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {d.datePlanned && (
                            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Planned: {formatDate(d.datePlanned)}</span>
                          )}
                          {d.dateVisited && (
                            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Visited: {formatDate(d.dateVisited)}</span>
                          )}
                          {d.journalCount ? (
                            <span className="inline-flex items-center gap-2"><Pencil className="h-4 w-4" /> {d.journalCount} journal entries</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" aria-label="Edit destination"><Pencil className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" aria-label="Delete destination"><Trash2 className="h-5 w-5" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p>No destinations yet. Click "Add Destination" to get started!</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Journals Tab */}
        <TabsContent value="journals">
          <div className="mb-4 flex justify-end">
            <Button className="gap-2"><Plus className="h-4 w-4" /> Write Entry</Button>
          </div>

          <div className="space-y-4">
            {listData?.journals?.map((j: any) => (
              <Card key={j.id}>
                <div className="flex flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold">{j.title}</h3>
                      <div className="text-sm text-muted-foreground"> {formatDate(j.createdAt)}</div>
                    </div>
                    <Badge variant="secondary" className={j.public ? "bg-emerald-600 text-white" : "bg-gray-700 text-white"}>
                      {j.public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <p className="max-w-4xl text-muted-foreground">{j.excerpt}</p>
                  <div className="flex items-center gap-3">
                    {j.photos?.slice(0, 2).map((_: any, i: string) => (
                      <div key={i} className="h-16 w-16 rounded-md bg-muted" />
                    ))}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {j.likes != null && <span>♡ {j.likes.length} likes</span>}
                    {j.comments != null && <span>💬 {j.comments.length} comments</span>}
                    <div className="ml-auto">
                      <Button variant="outline" size="sm">Read More</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <div className="mb-4 flex justify-end">
            <Button className="gap-2"><Plus className="h-4 w-4" /> Upload Photos</Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {photos.map((_, i) => (
              <div key={i} className="aspect-[4/3] w-full rounded-lg bg-muted" />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


