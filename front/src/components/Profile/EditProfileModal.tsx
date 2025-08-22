// components/profile/dialogs/EditProfileDialog.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enqueueSnackbar } from "notistack";

import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { User } from "@/types/userType";
import type { Country } from "@/types/LocationType";
import mockCountries from "@/utils/countryData";

type Props = {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    user: User;
    onUserUpdated?: (patch: Partial<User>) => void;
};

export default function EditProfileDialog({ open, onOpenChange, user, onUserUpdated }: Props) {
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState(user.fullName || "");
    const [bio, setBio] = useState(user.bio || "");

    const [countryQuery, setCountryQuery] = useState("");
    const [cityQuery, setCityQuery] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [selectedCity, setSelectedCity] = useState<string>("");

    const [showCountryList, setShowCountryList] = useState(false);
    const [showCityList, setShowCityList] = useState(false);
    const countryBoxRef = useRef<HTMLDivElement>(null);
    const cityBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        setFullName(user.fullName || "");
        setBio(user.bio || "");

        const initialValue = user.location || "";
        const parts = initialValue.split(",").map((s) => s.trim()).filter(Boolean);
        let initCity = "";
        let initCountryName = "";

        if (parts.length >= 2) {
            initCity = parts[0];
            initCountryName = parts.slice(1).join(", ");
        } else if (parts.length === 1) {
            initCountryName = parts[0];
        }

        const found = mockCountries.find(
            (ct) => ct.name.toLowerCase() === initCountryName.toLowerCase() || ct.code === initCountryName.toUpperCase()
        ) || null;

        setSelectedCountry(found);
        setCountryQuery(found ? found.name : initCountryName);
        setSelectedCity(initCity);
        setCityQuery(initCity);
    }, [open, user]);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (countryBoxRef.current && !countryBoxRef.current.contains(e.target as Node)) setShowCountryList(false);
            if (cityBoxRef.current && !cityBoxRef.current.contains(e.target as Node)) setShowCityList(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const filteredCountries = useMemo(() => {
        const q = countryQuery.trim().toLowerCase();
        if (!q) return mockCountries.slice(0, 10);
        return mockCountries
            .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
            .slice(0, 10);
    }, [countryQuery]);

    const filteredCities = useMemo(() => {
        if (!selectedCountry) return [];
        const q = cityQuery.trim().toLowerCase();
        const list = selectedCountry.cities || [];
        if (!q) return list.slice(0, 10);
        return list.filter((city) => city.toLowerCase().includes(q)).slice(0, 10);
    }, [selectedCountry, cityQuery]);

    const onPickCountry = (c: Country) => {
        setSelectedCountry(c);
        setCountryQuery(c.name);
        setSelectedCity("");
        setCityQuery("");
        setShowCountryList(false);
        setTimeout(() => setShowCityList(true), 0);
    };

    const onPickCity = (city: string) => {
        setSelectedCity(city);
        setCityQuery(city);
        setShowCityList(false);
    };

    const finalLocation = useMemo(() => {
        const country = (selectedCountry?.name || countryQuery).trim();
        const city = (selectedCity || cityQuery).trim();
        if (country && city) return `${city}, ${country}`;
        if (country) return country;
        return "";
    }, [selectedCountry, countryQuery, selectedCity, cityQuery]);

    const onSubmit = async () => {
        if (!user._id) {
            enqueueSnackbar("User id missing.", { variant: "error" });
            return;
        }

        const payload: Partial<User> = {};

        const prevName = user.fullName ?? "";
        const nextName = (fullName ?? "").trim();
        if (nextName !== prevName) {
            if (!nextName) {
                enqueueSnackbar("Full name cannot be empty.", { variant: "error" });
                return;
            }
            payload.fullName = nextName;
        }
        // location
        const prevLoc = user.location ?? "";
        if (finalLocation && finalLocation !== prevLoc) {
            payload.location = finalLocation;
        }

        // bio
        const prevBio = user.bio ?? "";
        const nextBio = (bio ?? "").trim();
        if (nextBio !== prevBio && nextBio) {
            payload.bio = nextBio;
        }


        if (Object.keys(payload).length === 0) {
            enqueueSnackbar("Nothing to update.");
            onOpenChange(false);
            return;
        }

        setSaving(true);
        try {
            await controller.updateUser(`${endpoints.users}/user/${user._id}`, "", payload);
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

    const canSave = Boolean(fullName && fullName.trim());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your public profile details.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 sm:grid-cols-2">
                    {/* Full name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>

                    {/* Country picker */}
                    <div className="space-y-2" ref={countryBoxRef}>
                        <Label htmlFor="country">Country</Label>
                        <div className="relative">
                            <Input
                                id="country"
                                value={countryQuery}
                                onChange={(e) => {
                                    setCountryQuery(e.target.value);
                                    setShowCountryList(true);
                                }}
                                onFocus={() => setShowCountryList(true)}
                                placeholder="Start typing a country…"
                                autoComplete="off"
                            />
                            {showCountryList && (
                                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow">
                                    {filteredCountries.length ? (
                                        filteredCountries.map((c) => (
                                            <button
                                                key={c.code}
                                                type="button"
                                                onClick={() => onPickCountry(c)}
                                                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted"
                                            >
                                                <span>{c.name}</span>
                                                <span className="text-xs text-muted-foreground">{c.code}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* City picker */}
                    <div className="space-y-2 sm:col-span-2" ref={cityBoxRef}>
                        <Label htmlFor="city">City (optional)</Label>
                        <div className="relative">
                            <Input
                                id="city"
                                value={cityQuery}
                                onChange={(e) => {
                                    setCityQuery(e.target.value);
                                    if (selectedCountry) setShowCityList(true);
                                }}
                                onFocus={() => selectedCountry && setShowCityList(true)}
                                placeholder={selectedCountry ? `e.g., ${selectedCountry.cities[0] || "City"}` : "Type a city"}
                                autoComplete="off"
                                disabled={!countryQuery.trim() && !selectedCountry}
                            />
                            {selectedCountry && showCityList && (
                                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow">
                                    {filteredCities.length ? (
                                        filteredCities.map((city) => (
                                            <button
                                                key={city}
                                                type="button"
                                                onClick={() => onPickCity(city)}
                                                className="flex w-full items-center px-3 py-2 text-left hover:bg-muted"
                                            >
                                                {city}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                    </div>
                </div>

                {/* Location preview */}
                <div className="mt-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Will save location as: </span>
                    <span className="font-medium">{finalLocation || "—"}</span>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onSubmit} disabled={saving || !canSave}>
                        {saving ? "Saving..." : "Save changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
