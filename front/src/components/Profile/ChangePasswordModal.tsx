// components/profile/dialogs/ChangePasswordDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enqueueSnackbar } from "notistack";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { User } from "@/types/userType";

type Props = { open: boolean; onOpenChange: (o: boolean) => void, me: User };

export default function ChangePasswordDialog({ open, onOpenChange, me }: Props) {
    const [loading, setLoading] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const canSubmit = oldPassword.length >= 6 && newPassword.length >= 6;

    const onSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            // await controller.post(endpoints.users.changePassword, { oldPassword, newPassword });
            await new Promise((r) => setTimeout(r, 800));

            enqueueSnackbar({ message: "Password updated successfully." });
            onOpenChange(false);
            setOldPassword("");
            setNewPassword("");
        } catch (e: any) {
            enqueueSnackbar({ message: e?.message || "Failed to change password.", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>Enter your current and new password.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="old">Current password</Label>
                        <Input id="old" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new">New password</Label>
                        <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button disabled={!canSubmit || loading} onClick={onSubmit}>
                            {loading ? "Saving..." : "Update"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
