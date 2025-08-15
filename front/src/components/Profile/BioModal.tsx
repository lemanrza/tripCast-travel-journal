// components/profile/dialogs/BioDialog.tsx
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enqueueSnackbar } from "notistack";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { User } from "@/types/userType";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialValue: string;
  onSaved?: (v: string) => void;
  me: User;
};

export default function BioDialog({ open, onOpenChange, initialValue, onSaved, me }: Props) {
  const [val, setVal] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  useEffect(() => setVal(initialValue), [initialValue, open]);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await controller.updateUser(`${endpoints.users}/user`, me._id, { bio: val });
      await new Promise((r) => setTimeout(r, 400));
      onSaved?.(val);
      enqueueSnackbar({ message: "Bio updated." });
      onOpenChange(false);
    } catch (e: any) {
      enqueueSnackbar({ message: e?.message || "Failed to update bio.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Bio</DialogTitle>
          <DialogDescription>Write a short bio for your profile.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={5} value={val} onChange={(e) => setVal(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={loading || !val.trim()}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
