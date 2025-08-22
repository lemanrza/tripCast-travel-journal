// components/profile/dialogs/SocialDialog.tsx
import { useEffect, useState, type JSX } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enqueueSnackbar } from "notistack";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { User } from "@/types/userType";
import { Globe, Instagram, Twitter, X } from "lucide-react";
import { normalizeByPlatform, type Platform } from "@/validations/socialLinks";


type Props = {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    platform: Platform;
    initialValue?: string;
    onSaved?: (url: string) => void;
    me: User;
};

const titles = {
    website: "Add Website",
    instagram: "Add Instagram",
    twitter: "Add Twitter / X",
} as const;

const labels = {
    website: "Website",
    instagram: "Instagram",
    twitter: "Twitter / X",
} as const;

const placeholders = {
    website: "https://example.com",
    instagram: "@yourhandle or https://instagram.com/yourhandle",
    twitter: "@yourhandle or https://x.com/yourhandle",
} as const;

const IconByPlatform: Record<Platform, JSX.Element> = {
    website: <Globe className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
};

export default function SocialDialog({
    open,
    onOpenChange,
    platform,
    initialValue = "",
    onSaved,
    me,
}: Props) {
    const [url, setUrl] = useState(initialValue);
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setUrl(initialValue);
        setError(null);
        setTouched(false);
    }, [initialValue, open]);

    const onChangeUrl = (val: string) => {
        setUrl(val);
        setTouched(true);
        const { error } = normalizeByPlatform(platform, val);
        setError(error);
    };

    const onBlurUrl = () => {
        const norm = normalizeByPlatform(platform, url);
        if (!norm.error && norm.url !== null) setUrl(norm.url);
    };

    const onSubmit = async () => {
        const { url: normalized, error } = normalizeByPlatform(platform, url);
        setError(error || null);
        if (error) return;

        const mergedSocials = {
            website: me?.socials?.website ?? null,
            instagram: me?.socials?.instagram ?? null,
            twitter: me?.socials?.twitter ?? null,
            [platform]: normalized, // may be null if cleared
        };

        setLoading(true);
        try {
            await controller.updateUser(`${endpoints.users}/user`, me._id, { socials: mergedSocials });
            onSaved?.(normalized ?? "");
            enqueueSnackbar("Saved.", { variant: "success" });
            onOpenChange(false);
        } catch (e: any) {
            enqueueSnackbar(e?.message || "Failed to save.", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const saveDisabled =
        loading ||
        (!touched && url === initialValue) ||
        Boolean(error) ||
        (url.trim() === (initialValue || "").trim());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{titles[platform]}</DialogTitle>
                    <DialogDescription>
                        Paste a valid {labels[platform]} link or username. We’ll normalize it for you.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">{labels[platform]}</Label>

                        <div className="group relative flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-md border bg-muted px-2 py-1 text-xs sm:text-sm text-muted-foreground">
                                {IconByPlatform[platform]}
                                <span>{labels[platform]}</span>
                            </span>

                            <Input
                                id="url"
                                placeholder={placeholders[platform]}
                                value={url}
                                onChange={(e) => onChangeUrl(e.target.value)}
                                onBlur={onBlurUrl}
                                className={`pr-9 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                inputMode="url"
                                autoComplete="url"
                                aria-invalid={!!error}
                                aria-describedby={error ? "social-error" : undefined}
                            />

                            {!!url && (
                                <button
                                    type="button"
                                    onClick={() => onChangeUrl("")}
                                    title="Clear"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 hidden h-6 w-6 items-center justify-center rounded hover:bg-muted group-hover:flex"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>

                        {error ? (
                            <p id="social-error" className="text-xs text-destructive">
                                {error}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Tip: You can enter just your @{platform === "website" ? "domain" : "username"}.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={onSubmit} disabled={saveDisabled}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
