import { Camera, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import type { Group } from "@/types/GroupType";

type GroupInfoDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    group: Group | null;
    isAdmin: boolean;
    groupId: string;
    onSaved: (g: Group) => void;
};

function GroupInfoDialog({
    open, onOpenChange, group, isAdmin, groupId, onSaved
}: GroupInfoDialogProps) {
    const [name, setName] = useState(group?.name || "");
    const [desc, setDesc] = useState(group?.description || "");
    const [saving, setSaving] = useState(false);
    const [imgUrl, setImgUrl] = useState(group?.profileImage?.url || "");
    const [imgPid, _] = useState(group?.profileImage?.public_id || "");
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        setName(group?.name || "");
        setDesc(group?.description || "");
        setImgUrl(group?.profileImage?.url || "");
        setFile(null);
    }, [group, open]);

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        const reader = new FileReader();
        reader.onload = () => setImgUrl(reader.result as string);
        reader.readAsDataURL(f);
    };

    const onSave = async () => {
        try {
            setSaving(true);

            let finalUrl = imgUrl;
            let finalPid = imgPid;

            if (file) {
                const fd = new FormData();
                // ✅ your backend expects the field name "image"
                fd.append("image", file, file.name);

                // Auth header comes from axios instance interceptor; no need to pass here
                const up = await controller.post(`${endpoints.upload}/image`, fd, {
                    headers: { "Content-Type": "multipart/form-data" }, // optional; axios can infer
                });

                if (!up?.success) throw new Error(up?.message || "Upload failed");

                finalUrl = up.data?.url || finalUrl;
                finalPid = up.data?.public_id || finalPid;
            }

            const body = {
                name,
                description: desc,
                // ✅ match your group schema field names
                profileImage: finalUrl ? { url: finalUrl, public_id: finalPid || "" } : undefined,
            };

            // Uses your common service; axios instance adds Authorization automatically
            const res = await controller.update(endpoints.groups, groupId, body);
            if (!res?.success) throw new Error(res?.message || "Update failed");

            onSaved(res.data);
            onOpenChange(false);
        } catch (e: any) {
            alert(e?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isAdmin ? "Edit Group" : "Group Info"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-1 ring-black/10">
                            {imgUrl ? (
                                <img src={imgUrl} alt="Group" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full grid place-items-center bg-blue-50 text-blue-700 font-semibold">
                                    {group?.name?.[0]?.toUpperCase() || "G"}
                                </div>
                            )}
                        </div>
                        {isAdmin && (
                            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border hover:bg-muted">
                                    <Camera className="w-4 h-4" /> Change photo
                                </span>
                            </label>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-xs font-medium text-gray-600">Name</label>
                        {isAdmin ? (
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        ) : (
                            <div className="text-sm">{group?.name}</div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <label className="text-xs font-medium text-gray-600">Description</label>
                        {isAdmin ? (
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="min-h-[90px] w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="Describe this group"
                            />
                        ) : (
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {group?.description || "—"}
                            </div>
                        )}
                    </div>

                    {!!group?.members && (
                        <div className="text-xs text-gray-500">
                            Members: <span className="font-medium text-gray-700">{group.members.length}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
                            Cancel
                        </Button>
                        {isAdmin && (
                            <Button onClick={onSave} disabled={saving || !name.trim()}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Save
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
export default GroupInfoDialog;
