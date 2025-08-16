// components/profile/dialogs/LocationDialog.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enqueueSnackbar } from "notistack";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { User } from "@/types/userType";
import type { Country } from "@/types/LocationType";
import mockCountries from "@/utils/countryData";
// 👇 adjust the path to wherever you put the file you sent

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialValue: string;
  onSaved?: (v: string) => void;
  me: User;
};

export default function LocationDialog({ open, onOpenChange, initialValue, onSaved, me }: Props) {
  const userId = (me as any)?._id || (me as any)?.id;

  const [countryQuery, setCountryQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");

  // simple dropdown visibility control
  const [showCountryList, setShowCountryList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);

  const countryBoxRef = useRef<HTMLDivElement>(null);
  const cityBoxRef = useRef<HTMLDivElement>(null);

  // initialize from initialValue ("City, Country" | "Country")
  useEffect(() => {
    if (!open) return;

    const parts = (initialValue || "").split(",").map((s) => s.trim()).filter(Boolean);
    let initCity = "";
    let initCountryName = "";

    if (parts.length >= 2) {
      initCity = parts[0];
      initCountryName = parts.slice(1).join(", "); // handles rare commas in names
    } else if (parts.length === 1) {
      initCountryName = parts[0];
    }

    const c = mockCountries.find(
      (ct) => ct.name.toLowerCase() === initCountryName.toLowerCase() || ct.code === initCountryName.toUpperCase()
    ) || null;

    setSelectedCountry(c);
    setSelectedCity(c && c.cities.includes(initCity) ? initCity : initCity); // keep manual city even if not in list
    setCountryQuery(c ? c.name : initCountryName);
    setCityQuery(initCity);
  }, [open, initialValue]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return mockCountries.slice(0, 10);
    return mockCountries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [countryQuery]);

  const filteredCities = useMemo(() => {
    if (!selectedCountry) return [];
    const q = cityQuery.trim().toLowerCase();
    const list = selectedCountry.cities || [];
    if (!q) return list.slice(0, 10);
    return list.filter((city) => city.toLowerCase().includes(q)).slice(0, 10);
  }, [selectedCountry, cityQuery]);

  // click-outside closers
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (countryBoxRef.current && !countryBoxRef.current.contains(e.target as Node)) {
        setShowCountryList(false);
      }
      if (cityBoxRef.current && !cityBoxRef.current.contains(e.target as Node)) {
        setShowCityList(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

  const canSave = Boolean(finalLocation);

  const onSubmit = async () => {
    if (!userId) {
      enqueueSnackbar("Missing user id.", { variant: "error" });
      return;
    }
    if (!canSave) return;

    try {
      await controller.updateUser(`${endpoints.users}/user/${userId}`, "", { location: finalLocation });
      onSaved?.(finalLocation);
      enqueueSnackbar("Location updated.");
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update location.";
      enqueueSnackbar(msg, { variant: "error" });
      console.error("Location update error:", e?.response?.data || e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Location</DialogTitle>
          <DialogDescription>Select your country and (optionally) a city.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* City picker (enabled when a country is chosen or typed) */}
          <div className="space-y-2" ref={cityBoxRef}>
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

          {/* Preview */}
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Will save as: </span>
            <span className="font-medium">{finalLocation || "—"}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={!canSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
