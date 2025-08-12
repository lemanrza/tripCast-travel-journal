import React, { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Camera, Edit, MapPin, Calendar, Globe, Instagram, Twitter, Plus, Mail, Phone } from "lucide-react";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import controller from "@/services/commonRequest";
import type { User } from "@/types/userType";
import endpoints from "@/services/api";


const formatSince = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  } catch {
    return "—";
  }
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const userRedux = useSelector((state: RootState) => state.user);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!userRedux?.id) {
        console.error("User ID not found");
        return;
      }
      const userData = await controller.getOne(`${endpoints.users}/user`, userRedux.id);
      setUser(userData.data);
    };
    fetchCurrentUser();
  }, [userRedux?.id]);
  console.log(user)
  const [openEdit, setOpenEdit] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const since = useMemo(() => formatSince(user?.createdAt), [user?.createdAt]);
  const hasLocation = Boolean(user?.location);
  const hasBio = Boolean(user?.bio && user.bio.trim());
  const hasAnySocial = Boolean(
    (user?.socials?.website && user?.socials.website.trim()) ||
    (user?.socials?.instagram && user?.socials.instagram.trim()) ||
    (user?.socials?.twitter && user?.socials.twitter.trim())
  );

  const initials = (user?.fullName || "").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  function saveProfile(e?: React.FormEvent) {
    e?.preventDefault?.();
    setOpenEdit(false);
  }

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* Profile header */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr_auto] md:items-start">
              {/* Avatar + change */}
              <div className="relative">
                <Avatar className="h-28 w-28 ring-2 ring-white shadow-sm">
                  <AvatarImage
                    src={previewUrl || (typeof user?.profileImage === 'string' ? user.profileImage : user?.profileImage?.url) || ''}
                    alt={user?.fullName || ''}
                  />
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-neutral-200 hover:scale-105">
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* Name + meta */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold leading-tight">{user?.fullName}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {hasLocation ? (
                      <span>{user?.location}</span>
                    ) : (
                      <button
                        className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
                        onClick={() => setOpenEdit(true)}
                      >
                        Add location
                      </button>
                    )}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Member since {since}
                  </span>
                </div>

                <div className="text-sm text-neutral-700">
                  {hasBio ? (
                    <p>{user?.bio}</p>
                  ) : (
                    <button
                      className="rounded-full border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => setOpenEdit(true)}
                    >
                      Add a short bio
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {hasAnySocial ? (
                    <>
                      {user?.socials?.website && (
                        <a href={user.socials.website} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                          <Globe className="h-4 w-4" /> {new URL(user.socials.website).host}
                        </a>
                      )}
                      {user?.socials?.instagram && (
                        <a href={user.socials.instagram} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                          <Instagram className="h-4 w-4" /> instagram
                        </a>
                      )}
                      {user?.socials?.twitter && (
                        <a href={user.socials.twitter} className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                          <Twitter className="h-4 w-4" /> twitter
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => setOpenEdit(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add social links
                    </button>
                  )}
                </div>
              </div>

              {/* Edit button */}
              <div className="flex justify-end">
                <Button onClick={() => setOpenEdit(true)} className="rounded-xl">
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-6">
              {/* {[
                [user.lists.destinations, "Destinations"],
                [user.lists.completed, "Completed"],
                [user.lists.lists, "Lists"],
                [user.lists.entries, "Entries"],
                [user.lists.followers, "Followers"],
                [user.lists.following, "Following"],
              ].map(([value, label], i) => (
                <div key={i} className="rounded-xl border bg-white p-4 text-center shadow-sm">
                  <div className="text-2xl font-semibold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))} */}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="settings">
            <TabsList className="rounded-2xl">
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Activity placeholder */}
            <TabsContent value="activity" className="mt-4">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No recent activity yet. Start by adding your first destination!
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements placeholder */}
            <TabsContent value="achievements" className="mt-4">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Earn badges by completing trips and writing journal entries.
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="mt-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Account Settings */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</Label>
                      <Input id="email" value={user?.email} onChange={(e) => setUser({ ...user, email: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> Phone Number</Label>
                      <Input id="phone" value={user?.phone || ''} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">Public Profile</div>
                        <div className="text-sm text-muted-foreground">Allow others to find your profile</div>
                      </div>
                      <Switch checked={user?.isPublic || false} onCheckedChange={(v) => setUser({ ...user, isPublic: v })} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">Email Notifications</div>
                        <div className="text-sm text-muted-foreground">Get updates about your lists</div>
                      </div>
                      <Switch checked={user?.emailNotifs} onCheckedChange={(v) => setUser({ ...user, emailNotifs: v })} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">Show Travel Stats</div>
                        <div className="text-sm text-muted-foreground">Display counts on your public profile</div>
                      </div>
                      <Switch checked={user?.showStats} onCheckedChange={(v) => setUser({ ...user, showStats: v })} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={saveProfile} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Fill in as much or as little as you like — empty fields will stay hidden on your public profile.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={user?.fullName} onChange={(e) => setUser({ ...user, fullName: e.target.value })} />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={user?.location ?? ""}
                onChange={(e) => setUser({ ...user, location: e.target.value || null })}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea id="bio" placeholder="Tell the world what you explore" value={user?.bio ?? ""} onChange={(e) => setUser({ ...user, bio: e.target.value })} />
            </div>

            <Separator />
            <div className="grid gap-3">
              <Label className="inline-flex items-center gap-2"><Globe className="h-4 w-4" /> Website</Label>
              <Input placeholder="https://example.com" value={user?.socials?.website || ''} onChange={(e) => setUser({ ...user, socials: { ...user?.socials, website: e.target.value } })} />
            </div>
            <div className="grid gap-3">
              <Label className="inline-flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</Label>
              <Input placeholder="https://instagram.com/username" value={user?.socials?.instagram || ''} onChange={(e) => setUser({ ...user, socials: { ...user?.socials, instagram: e.target.value } })} />
            </div>
            <div className="grid gap-3">
              <Label className="inline-flex items-center gap-2"><Twitter className="h-4 w-4" /> Twitter / X</Label>
              <Input placeholder="https://x.com/username" value={user?.socials?.twitter || ''} onChange={(e) => setUser({ ...user, socials: { ...user?.socials, twitter: e.target.value } })} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="rounded-xl">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
