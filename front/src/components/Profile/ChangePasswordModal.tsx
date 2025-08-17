// components/profile/dialogs/ChangePasswordDialog.tsx
import { useMemo, useState, type KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enqueueSnackbar } from "notistack";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { User } from "@/types/userType";

function StrengthBar({ value }: { value: number }) {
    return (
        <div className="mt-2 h-2 w-full rounded bg-neutral-200">
            <div
                className={`h-2 rounded transition-all`}
                style={{
                    width: `${Math.min(100, Math.max(0, value))}%`,
                    background:
                        value >= 100 ? "#16a34a" : value >= 60 ? "#f59e0b" : "#dc2626",
                }}
            />
        </div>
    );
}

type Props = { open: boolean; onOpenChange: (o: boolean) => void; me: User };

export default function ChangePasswordDialog({ open, onOpenChange, me }: Props) {
    const [loading, setLoading] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const providerIsGoogle = me?.provider === "google";

    const checks = useMemo(() => {
        const pwd = newPassword || "";
        return {
            length: pwd.length >= 8,
            lower: /[a-z]/.test(pwd),
            upper: /[A-Z]/.test(pwd),
            digit: /\d/.test(pwd),
        };
    }, [newPassword]);

    const totalChecks = 4;
    const metChecks = Object.values(checks).filter(Boolean).length;
    const strengthPct = Math.round((metChecks / totalChecks) * 100);

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    const meetsAll = strongRegex.test(newPassword);

    const canSubmit =
        !providerIsGoogle &&
        oldPassword.trim().length >= 6 &&
        newPassword.trim().length >= 8 &&
        newPassword.trim() !== oldPassword.trim() &&
        meetsAll;

    const submit = async () => {
        if (!me?._id) {
            enqueueSnackbar("Missing user id.", { variant: "error" });
            return;
        }
        if (providerIsGoogle) {
            enqueueSnackbar("This account uses Google sign-in; password changes are disabled.", { variant: "warning" });
            return;
        }
        if (oldPassword.trim() === newPassword.trim()) {
            enqueueSnackbar("New password must be different from current password.", { variant: "error" });
            return;
        }
        if (!meetsAll) {
            enqueueSnackbar("Password must be 8+ chars and include upper, lower, digit, and symbol.", { variant: "error" });
            return;
        }

        setLoading(true);
        try {
            await controller.update(`${endpoints.users}/user/${me._id}/password`, "", {
                oldPassword: oldPassword.trim(),
                newPassword: newPassword.trim(),
            });
            enqueueSnackbar("Password updated successfully.");
            setOldPassword(""); setNewPassword(""); onOpenChange(false);
        } catch (e: any) {
            const status = e?.response?.status;
            const msg = e?.response?.data?.message || e?.message || "Failed to change password.";

            if (status === 400 && /incorrect/i.test(msg)) {
                enqueueSnackbar("Current password is incorrect.", { variant: "error" });
            } else if (status === 403) {
                enqueueSnackbar("You are not allowed to change this password.", { variant: "error" });
            } else {
                enqueueSnackbar(msg, { variant: "error" });
            }
            console.error("Change password error:", e?.response?.data || e);
        }
        finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !loading && canSubmit) {
            e.preventDefault();
            submit();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Enter your current password and a new one.
                        {providerIsGoogle && (
                            <span className="ml-1 text-muted-foreground">
                                This account uses Google sign-in, so password changes are disabled.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="old">Current password</Label>
                        <Input
                            id="old"
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            onKeyDown={onKeyDown}
                            disabled={loading || providerIsGoogle}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new">New password</Label>
                        <Input
                            id="new"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onKeyDown={onKeyDown}
                            disabled={loading || providerIsGoogle}
                            placeholder="Min 8 chars, upper, lower, number, symbol"
                        />
                        {newPassword && <StrengthBar value={strengthPct} />}

                        <ul className="mt-1 grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                            <li className={checks.length ? "text-emerald-600" : ""}>• 8+ characters</li>
                            <li className={checks.upper ? "text-emerald-600" : ""}>• Uppercase letter</li>
                            <li className={checks.lower ? "text-emerald-600" : ""}>• Lowercase letter</li>
                            <li className={checks.digit ? "text-emerald-600" : ""}>• Number</li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button disabled={!canSubmit || loading} onClick={submit}>
                            {loading ? "Saving..." : "Update"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
