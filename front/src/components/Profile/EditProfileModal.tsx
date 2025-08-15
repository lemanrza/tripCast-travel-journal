// components/Profile/EditProfileModal.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enqueueSnackbar } from "notistack";

import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { User } from "@/types/userType";

type Props = {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    user: User;                         // must include _id
    onUserUpdated?: (patch: Partial<User>) => void;
};

export default function EditProfileDialog({ open, onOpenChange, user, onUserUpdated }: Props) {
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState(user.fullName || "");
    const [location, setLocation] = useState(user.location || "");
    const [bio, setBio] = useState(user.bio || "");
    const [website, setWebsite] = useState(user.socials?.website || "");
    const [instagram, setInstagram] = useState(user.socials?.instagram || "");
    const [twitter, setTwitter] = useState(user.socials?.twitter || "");

    useEffect(() => {
        if (open) {
            setFullName(user.fullName || "");
            setLocation(user.location || "");
            setBio(user.bio || "");
            setWebsite(user.socials?.website || "");
            setInstagram(user.socials?.instagram || "");
            setTwitter(user.socials?.twitter || "");
        }
    }, [open, user]);

    const onSubmit = async () => {
        if (!user._id) {
            enqueueSnackbar("User id missing.", { variant: "error" });
            return;
        }

        // Build payload safely
        const payload: Partial<User> = {};

        // fullName: must be non-empty if changed
        const prevName = (user.fullName ?? "");
        const nextName = (fullName ?? "").trim();
        if (nextName !== prevName) {
            if (!nextName) {
                enqueueSnackbar("Full name cannot be empty.", { variant: "error" });
                return;
            }
            payload.fullName = nextName;
        }

        // location: send only if changed and non-empty (no nulls for now)
        const prevLoc = (user.location ?? "");
        const nextLoc = (location ?? "").trim();
        if (nextLoc !== prevLoc && nextLoc) {
            payload.location = nextLoc;
        }

        // bio: same rule
        const prevBio = (user.bio ?? "");
        const nextBio = (bio ?? "").trim();
        if (nextBio !== prevBio && nextBio) {
            payload.bio = nextBio;
        }

        // socials: include only keys that changed AND are non-empty strings
        const socials: Record<string, string> = {};
        const prevWebsite = user.socials?.website || "";
        const prevInstagram = user.socials?.instagram || "";
        const prevTwitter = user.socials?.twitter || "";

        if ((website ?? "") !== prevWebsite && (website ?? "").trim()) {
            socials.website = (website as string).trim();
        }
        if ((instagram ?? "") !== prevInstagram && (instagram ?? "").trim()) {
            socials.instagram = (instagram as string).trim();
        }
        if ((twitter ?? "") !== prevTwitter && (twitter ?? "").trim()) {
            socials.twitter = (twitter as string).trim();
        }
        if (Object.keys(socials).length) {
            payload.socials = socials as User["socials"];
        }

        if (Object.keys(payload).length === 0) {
            enqueueSnackbar("Nothing to update.");
            onOpenChange(false);
            return;
        }

        setSaving(true);
        try {
            await controller.updateUser(`${endpoints.users}/user`, user._id, payload);
            onUserUpdated?.(payload);
            enqueueSnackbar("Profile updated.");
            onOpenChange(false);
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || "Failed to update profile.";
            enqueueSnackbar(msg, { variant: "error" });
            console.error("EditProfile update error:", e?.response?.data || e);
        } finally {
            setSaving(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your public profile details.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input id="instagram" placeholder="https://instagram.com/…" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter (X)</Label>
                        <Input id="twitter" placeholder="https://x.com/…" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
                    </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onSubmit} disabled={saving || !(fullName && fullName.trim())}>
                        {saving ? "Saving..." : "Save changes"}
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    );
}
