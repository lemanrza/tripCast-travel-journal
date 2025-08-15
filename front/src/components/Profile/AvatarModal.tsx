// components/profile/dialogs/AvatarDialog.tsx
import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { enqueueSnackbar } from "notistack";
import type { User as AppUser } from "@/types/userType";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";

type Props = {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    user: AppUser;
    onUserUpdated?: (u: Partial<AppUser>) => void;
};

export default function AvatarDialog({ open, onOpenChange, user, onUserUpdated }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);

    const userId = (user as any)?._id || (user as any)?.id;
    const current = user?.profileImage;
    const photoUrl =
        (typeof current === "string" ? current : current?.url) || "";
    const oldPublicId =
        (typeof current === "object" ? current?.public_id : undefined) || undefined;

    const uploadToCloud = async (file: File): Promise<{ url: string; public_id: string }> => {
        const form = new FormData();
        form.append("image", file);
        const res = await controller.post(`${endpoints.upload}/image`, form);
        const payload = res?.data ?? res;
        if (!payload?.url || !payload?.public_id) {
            throw new Error("Upload response missing url/public_id");
        }
        return { url: payload.url, public_id: payload.public_id };
    };

    const persistAvatar = async (img: { url: string; public_id: string }) => {
        try {
            await controller.updateUser(`${endpoints.users}/user/${userId}`, "", { profileImage: img });
            return "object" as const;
        } catch (err1: any) {
            try {
                await controller.updateUser(`${endpoints.users}/user/${userId}`, "", { profileImage: img.url });
                return "string" as const;
            } catch (err2: any) {
                const msg =
                    err2?.response?.data?.message ||
                    err1?.response?.data?.message ||
                    err2?.message ||
                    err1?.message ||
                    "Internal server error";
                // Bubble up detailed server object if present
                const detail = err2?.response?.data || err1?.response?.data;
                throw new Error(detail ? `${msg} ${JSON.stringify(detail)}` : msg);
            }
        }
    };

const deleteOld = async (public_id?: string) => {
  if (!public_id) return;
  try {
    const encoded = encodeURIComponent(public_id);
    const r1 = await controller.deleteOne(`${endpoints.upload}/image`, encoded);
    console.log("Delete (path) resp:", r1);
    if (!r1?.success) throw new Error("Path delete not success");
  } catch (e1) {
    try {
      const { default: instance } = await import("@/services/instance");
      const r2 = await instance.delete(`${endpoints.upload}/image`, { params: { public_id } });
      console.log("Delete (query) resp:", r2.data);
    } catch (e2) {
      console.error("Old avatar delete failed:", e2);
    }
  }
};



    const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!userId) {
            enqueueSnackbar("Cannot update photo: missing user id.", { variant: "error" });
            return;
        }

        setBusy(true);
        try {
            const uploaded = await uploadToCloud(file);
            const usedShape = await persistAvatar(uploaded);
            await deleteOld(oldPublicId);

            onUserUpdated?.(
                usedShape === "object"
                    ? { profileImage: { url: uploaded.url, public_id: uploaded.public_id } as any }
                    : { profileImage: uploaded.url as any }
            );

            enqueueSnackbar("Profile photo updated.");
            onOpenChange(false);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to update photo.";
            console.error("Avatar update error:", err?.response?.data || err);
            enqueueSnackbar(msg, { variant: "error" });
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Profile Photo</DialogTitle>
                    <DialogDescription>View or change your profile photo.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="overflow-hidden rounded-md border">
                        {photoUrl ? (
                            <img src={photoUrl} alt={user?.fullName || "Profile"} className="max-h-80 w-full object-cover" />
                        ) : (
                            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No photo</div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <a
                            href={photoUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm underline-offset-4 hover:underline ${photoUrl ? "" : "pointer-events-none opacity-50"}`}
                            aria-disabled={!photoUrl}
                        >
                            View full photo
                        </a>
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onChangeFile}
                                disabled={busy}
                            />
                            <Button onClick={() => inputRef.current?.click()} disabled={busy}>
                                {busy ? "Uploading..." : "Change photo"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
