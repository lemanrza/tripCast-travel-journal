import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Edit, MapPin, Calendar, Globe, Instagram, Twitter, Plus } from "lucide-react";

import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import { enqueueSnackbar } from "notistack";

import initials from "@/utils/initials";
import type { User } from "@/types/userType";

import EditProfileDialog from "@/components/Profile/EditProfileModal";
import BioDialog from "@/components/Profile/BioModal";
import LocationDialog from "@/components/Profile/LocationModal";
import SocialDialog from "@/components/Profile/SocialLinksModal";
import ChangePasswordDialog from "@/components/Profile/ChangePasswordModal";
import AvatarDialog from "@/components/Profile/AvatarModal";

const formatSince = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
};

type CollabReq = {
  _id: string;
  fromUser: { fullName: string; email: string; profileImage?: { url?: string } };
  list: { _id: string; title: string; coverImage?: { url?: string } };
};

export default function ProfilePage() {
  const userRedux = useSelector((state: RootState) => state.user);
  const [me, setMe] = useState<User | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  // Modal states
  const [openEdit, setOpenEdit] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [openAvatar, setOpenAvatar] = useState(false);

  const [openAddWebsite, setOpenAddWebsite] = useState(false);
  const [openAddInstagram, setOpenAddInstagram] = useState(false);
  const [openAddTwitter, setOpenAddTwitter] = useState(false);

  const [openLocation, setOpenLocation] = useState(false);
  const [openBio, setOpenBio] = useState(false);

  // Collab requests
  const [reqs, setReqs] = useState<CollabReq[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqErr, setReqErr] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (!userRedux?.id) return;
        setLoadingMe(true);
        const userData = await controller.getOne(`${endpoints.users}/user`, userRedux.id);
        setMe(userData.data as User);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMe(false);
      }
    };
    fetchCurrentUser();
  }, [userRedux?.id]);

  const applyPatch = (patch: Partial<User>) => {
    setMe((prev) => {
      if (!prev) return prev;
      const next: User = {
        ...prev,
        ...patch,
        socials: {
          ...prev.socials,
          ...(patch.socials ?? {}),
        },
      };
      return next;
    });
  };

  const since = useMemo(() => formatSince(me?.createdAt), [me?.createdAt]);

  const photoUrl = useMemo(() => {
    if (!me?.profileImage) return "";
    return me.profileImage.url || "";
  }, [me?.profileImage]);

  const hasLocation = Boolean(me?.location);
  const hasBio = Boolean(me?.bio);

  const hasWebsite = Boolean(me?.socials?.website);
  const hasInstagram = Boolean(me?.socials?.instagram);
  const hasTwitter = Boolean(me?.socials?.twitter);

  const profileInitials = initials(me?.fullName || "");

  // Collab Requests
  async function loadCollabReqs() {
    try {
      setReqLoading(true);
      setReqErr(null);
      const resp = await controller.getAll(`${endpoints.lists}/me/collab-requests`);
      const data = resp?.data ?? [];
      setReqs(data);
    } catch (e: any) {
      setReqErr(e?.message || "Failed to load requests");
    } finally {
      setReqLoading(false);
    }
  }
  useEffect(() => {
    loadCollabReqs();
  }, []);

  async function acceptReq(requestId: string) {
    try {
      setActingId(requestId);
      const resp = await controller.post(
        `${endpoints.lists}/me/collab-requests/${requestId}/accept`,
        {}
      );
      if (!resp || (resp as any).error) throw new Error((resp as any)?.message || "Failed to accept");
      setReqs((r) => r.filter((x) => x._id !== requestId));
      enqueueSnackbar("Joined the list 🎉", { variant: "success" });
    } catch (e: any) {
      enqueueSnackbar(e?.message || "Failed to accept", { variant: "error" });
    } finally {
      setActingId(null);
    }
  }

  async function rejectReq(requestId: string) {
    try {
      setActingId(requestId);
      const resp = await controller.post(
        `${endpoints.lists}/me/collab-requests/${requestId}/reject`,
        {}
      );
      if (!resp || (resp as any).error) throw new Error((resp as any)?.message || "Failed to reject");
      setReqs((r) => r.filter((x) => x._id !== requestId));
      enqueueSnackbar("Invite dismissed", { variant: "default" });
    } catch (e: any) {
      enqueueSnackbar(e?.message || "Failed to reject", { variant: "error" });
    } finally {
      setActingId(null);
    }
  }

  if (loadingMe) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Card className="mx-auto mt-6 max-w-5xl border-none shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">Loading profile…</CardContent>
        </Card>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Card className="mx-auto mt-6 max-w-5xl border-none shadow-sm">
          <CardContent className="p-6 text-sm text-destructive">Couldn’t load your profile.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Profile header */}
<div className="pt-6">
      <Card className="mx-auto p-4 max-w-5xl border-none shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr_auto] md:items-start">
            {/* Avatar + change */}
            <div className="relative">
              <Avatar className="h-28 w-28 ring-2 ring-white shadow-sm">
                <AvatarImage src={photoUrl} alt={me.fullName || ""} />
                <AvatarFallback className="text-xl">{profileInitials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => setOpenAvatar(true)}
                className="absolute -bottom-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-neutral-200 hover:scale-105"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Name + meta */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold leading-tight">{me.fullName}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {hasLocation ? (
                    <button className="underline-offset-4 hover:underline" onClick={() => setOpenLocation(true)}>
                      {me.location}
                    </button>
                  ) : (
                    <button
                      className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
                      onClick={() => setOpenLocation(true)}
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
                  <button className="underline-offset-4 hover:underline" onClick={() => setOpenBio(true)}>
                    {me.bio}
                  </button>
                ) : (
                  <button
                    className="rounded-full border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                    onClick={() => setOpenBio(true)}
                  >
                    Add a short bio
                  </button>
                )}
              </div>

              {/* Socials */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {hasWebsite && (
                  <a
                    href={me.socials!.website!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                    title="Website"
                    aria-label="Website"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
                {hasInstagram && (
                  <a
                    href={me.socials!.instagram!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                    title="Instagram"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {hasTwitter && (
                  <a
                    href={me.socials!.twitter!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                    title="Twitter"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}

                {!hasWebsite && (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setOpenAddWebsite(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Website
                  </Button>
                )}
                {!hasInstagram && (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setOpenAddInstagram(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Instagram
                  </Button>
                )}
                {!hasTwitter && (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setOpenAddTwitter(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Twitter
                  </Button>
                )}
              </div>
            </div>

            {/* Edit + Change Password */}
            <div className="flex flex-col items-end gap-2">
              <Button onClick={() => setOpenEdit(true)} className="rounded-xl">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
              <Button variant="secondary" onClick={() => setOpenPassword(true)} className="rounded-xl">
                Change Password
              </Button>
            </div>
          </div>

          {/* Stats placeholder */}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-6">{/* … */}</div>
        </CardContent>

        <AvatarDialog
          open={openAvatar}
          onOpenChange={setOpenAvatar}
          user={me}
          onUserUpdated={applyPatch}
        />
        <ChangePasswordDialog me={me} open={openPassword} onOpenChange={setOpenPassword} />

        <SocialDialog
          open={openAddWebsite}
          me={me}
          onOpenChange={setOpenAddWebsite}
          platform="website"
          initialValue={me?.socials?.website || ""}
          onSaved={(url) => applyPatch({ socials: { website: url } })}
        />
        <SocialDialog
          open={openAddInstagram}
          me={me}
          onOpenChange={setOpenAddInstagram}
          platform="instagram"
          initialValue={me?.socials?.instagram || ""}
          onSaved={(url) => applyPatch({ socials: { instagram: url } })}
        />
        <SocialDialog
          open={openAddTwitter}
          me={me}
          onOpenChange={setOpenAddTwitter}
          platform="twitter"
          initialValue={me?.socials?.twitter || ""}
          onSaved={(url) => applyPatch({ socials: { twitter: url } })}
        />

        <LocationDialog
          open={openLocation}
          me={me}
          onOpenChange={setOpenLocation}
          initialValue={me?.location || ""}
          onSaved={(loc) => applyPatch({ location: loc })}
        />
        <BioDialog
          me={me}
          open={openBio}
          onOpenChange={setOpenBio}
          initialValue={me?.bio || ""}
          onSaved={(bio) => applyPatch({ bio })}
        />

        <EditProfileDialog
          open={openEdit}
          onOpenChange={setOpenEdit}
          user={me}
          onUserUpdated={applyPatch}
        />
      </Card>
</div>

      {/* Tabs */}
      <div className="mx-auto mt-6 max-w-5xl">
        <Tabs defaultValue="settings">
          <TabsList className="rounded-2xl">
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No recent activity yet. Start by adding your first destination!
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Earn badges by completing trips and writing journal entries.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Collaboration Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reqLoading && <div className="text-sm text-muted-foreground">Loading requests…</div>}
                {reqErr && <div className="text-sm text-destructive">{reqErr}</div>}
                {!reqLoading && !reqErr && reqs.length === 0 && (
                  <div className="text-sm text-muted-foreground">No pending collaboration requests.</div>
                )}

                <ul className="space-y-2">
                  {reqs.map((r) => (
                    <li key={r._id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                          {r.fromUser?.profileImage?.url ? (
                            <img
                              src={r.fromUser.profileImage.url}
                              alt={r.fromUser.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className="font-medium">{r.list?.title ?? "Untitled list"}</div>
                          <div className="text-xs text-muted-foreground">Owner: {r.fromUser?.fullName ?? "Unknown"}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => acceptReq(r._id)}
                          disabled={actingId === r._id}
                        >
                          {actingId === r._id ? "Accepting…" : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectReq(r._id)}
                          disabled={actingId === r._id}
                        >
                          {actingId === r._id ? "Rejecting…" : "Reject"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
