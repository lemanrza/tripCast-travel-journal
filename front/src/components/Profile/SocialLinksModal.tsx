// components/profile/dialogs/SocialDialog.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enqueueSnackbar } from "notistack";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { User } from "@/types/userType";
// import controller from "@/services/commonRequest";
// import endpoints from "@/services/api";

type Platform = "website" | "instagram" | "twitter";

type Props = {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    platform: Platform;
    initialValue?: string;
    onSaved?: (url: string) => void;
    me: User;
};

const titles: Record<Platform, string> = {
    website: "Add Website",
    instagram: "Add Instagram",
    twitter: "Add Twitter",
};

export default function SocialDialog({ open, onOpenChange, platform, initialValue = "", onSaved, me }: Props) {
    const [url, setUrl] = useState(initialValue);
    const [loading, setLoading] = useState(false);

    useEffect(() => setUrl(initialValue), [initialValue, open]);

    const onSubmit = async () => {
        if (!url) return;
        setLoading(true);
        try {
            await controller.updateUser(`${endpoints.users}/user`, me._id, { platform, url });
            await new Promise((r) => setTimeout(r, 500));
            onSaved?.(url);
            enqueueSnackbar({ message: "Saved." });
            onOpenChange(false);
        } catch (e: any) {
            enqueueSnackbar({ message: e?.message || "Failed to save.", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{titles[platform]}</DialogTitle>
                    <DialogDescription>Paste a valid URL for your {platform}.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">URL</Label>
                        <Input id="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={onSubmit} disabled={!url || loading}>{loading ? "Saving..." : "Save"}</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
