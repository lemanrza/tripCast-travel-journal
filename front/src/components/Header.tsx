import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Search, User, Menu, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSelector } from "react-redux";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";

/* ------------------------------ Types ------------------------------ */

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  group: "Pages" | "Lists" | "Journals" | "Destinations";
};

const STATIC_PAGES: Array<
  Omit<SearchResult, "id" | "group"> & { group?: SearchResult["group"] }
> = [
    { title: "Dashboard", path: "/dashboard", subtitle: "App overview", group: "Pages" },
    { title: "Lists", path: "/lists", subtitle: "All your lists", group: "Pages" },
    { title: "Journals", path: "/journals", subtitle: "All journal entries", group: "Pages" },
    { title: "Create List", path: "/create/list", subtitle: "Start a new list", group: "Pages" },
    { title: "Profile", path: "/profile", subtitle: "Your profile", group: "Pages" },
  ];

/* ------------------------------ Component ------------------------------ */

export default function Header() {
  const user = useSelector((state: any) => state.user);
  const navigate = useNavigate();

  // desktop search
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // mobile UI
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    let t: any;
    async function run() {
      const term = q.trim();
      if (!term) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);

      try {
        const lc = term.toLowerCase();

        const pageMatches: SearchResult[] = STATIC_PAGES
          .filter((p) => p.title.toLowerCase().includes(lc) || p.subtitle?.toLowerCase().includes(lc))
          .map((p, i) => ({
            id: `page-${i}-${p.path}`,
            title: p.title,
            subtitle: p.subtitle,
            path: p.path,
            group: "Pages",
          }));

        const [listsRes, journalsRes, destsRes] = await Promise.all([
          controller.getAll?.(`${endpoints.lists}/search?q=${encodeURIComponent(term)}`).catch(() => null),
          controller.getAll?.(`${endpoints.journals}/search?q=${encodeURIComponent(term)}`).catch(() => null),
          controller.getAll?.(`${endpoints.destinations}/search?q=${encodeURIComponent(term)}`).catch(() => null),
        ]);

        const listMatches: SearchResult[] = (listsRes?.data ?? []).map((l: any) => ({
          id: l._id || l.id,
          title: l.title || "(untitled list)",
          subtitle: Array.isArray(l.tags) ? l.tags.join(", ") : l.description,
          path: `/lists/${l._id || l.id}`,
          group: "Lists",
        }));

        const journalMatches: SearchResult[] = (journalsRes?.data ?? []).map((j: any) => ({
          id: j._id || j.id,
          title: j.title,
          subtitle: j.destination?.name ? `Destination: ${j.destination.name}` : undefined,
          path: `/journals/${j._id || j.id}`,
          group: "Journals",
        }));

        const destMatches: SearchResult[] = (destsRes?.data ?? []).map((d: any) => {
          const listId = d.listId || d.list?._id || d.list?.id;
          return {
            id: d._id || d.id,
            title: d.name,
            subtitle: d.country,
            path: listId ? `/lists/${listId}` : "/lists",
            group: "Destinations",
          } as SearchResult;
        });

        const merged = [...pageMatches, ...listMatches, ...journalMatches, ...destMatches];
        setResults(merged);
        setActiveIndex(0);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }

    t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [q]);

  const grouped = useMemo(() => {
    const groups: Record<SearchResult["group"], SearchResult[]> = {
      Pages: [],
      Lists: [],
      Journals: [],
      Destinations: [],
    };
    for (const r of results) groups[r.group].push(r);
    return groups;
  }, [results]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIndex];
      if (r) {
        navigate(r.path);
        setOpen(false);
        setQ("");
        setMobileSearchOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setMobileSearchOpen(false);
    }
  }

  const ResultsList = ({ panel }: { panel?: boolean }) => {
    if (loading) return <div className="p-3 text-sm text-muted-foreground">Searching…</div>;
    if (results.length === 0) return <div className="p-3 text-sm text-muted-foreground">No results</div>;

    return (
      <div className={panel ? "max-h-[65vh] overflow-auto" : "max-h-96 overflow-auto"}>
        {(["Pages", "Lists", "Journals", "Destinations"] as const).map((g) =>
          grouped[g].length ? (
            <div key={g} className="py-2">
              <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground">{g}</div>
              {grouped[g].map((r) => {
                const globalIndex = results.findIndex((x) => x.id === r.id && x.group === r.group);
                const isActive = globalIndex === activeIndex;
                return (
                  <button
                    key={r.id}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(globalIndex)}
                    onClick={() => {
                      navigate(r.path);
                      setOpen(false);
                      setQ("");
                      setMobileSearchOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-accent ${isActive ? "bg-accent" : ""
                      }`}
                  >
                    <div className="text-sm font-medium">{r.title}</div>
                    {r.subtitle && <div className="text-xs text-muted-foreground">{r.subtitle}</div>}
                    <div className="text-[10px] text-muted-foreground/80 mt-1">{r.path}</div>
                  </button>
                );
              })}
            </div>
          ) : null
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-8xl px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: logo + desktop nav */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/src/assets/image.png" alt="TripCast icon" className="w-8 h-8 shrink-0" />
            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Trip<span className="font-black">Cast</span>
              </span>
            </h1>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <NavLink to="/dashboard" className="hover:text-blue-800 transition">Dashboard</NavLink>
            <NavLink to="/lists" className="hover:text-blue-800 transition">Lists</NavLink>
            <NavLink to="/journals" className="hover:text-blue-800 transition">Journal</NavLink>
          </nav>
        </div>

        {/* Right: desktop actions */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Desktop search */}
          <div className="relative" ref={wrapRef}>
            <div className="flex items-center gap-2 border px-3 py-2 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500
                            w-56 lg:w-72 xl:w-[20rem]">
              <Search className="text-gray-800 w-5 h-5" />
              <input
                type="text"
                placeholder="Search destinations, lists..."
                className="w-full border-none outline-none bg-transparent"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => q.trim() && setOpen(true)}
              />
            </div>

            {open && (
              <div
                role="listbox"
                aria-label="Search results"
                className="absolute z-50 mt-1 w-[28rem] right-0 rounded-md border bg-white shadow-lg overflow-hidden"
              >
                <ResultsList />
              </div>
            )}
          </div>

          <Link to="/create/list">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Plus className="w-4 h-4 mr-1" /> Create
            </Button>
          </Link>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center focus:outline-none">
              {user?.profileImage?.url ? (
                <img
                  src={user.profileImage.url}
                  alt={user.fullName}
                  className="w-8 h-8 lg:w-9 lg:h-9 rounded-full shrink-0"
                />
              ) : (
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gray-200 grid place-items-center text-xs font-semibold shrink-0">
                  {(user?.fullName || "U").slice(0, 2).toUpperCase()}
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-lg p-0" align="end" sideOffset={8}>
              <div className="px-4 py-3">
                <div className="text-sm font-medium">{user.fullName}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="w-full px-4 py-2"><User /> Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <button onClick={logout} className="w-full px-4 py-2 text-red-600">
                  <LogOut className="text-red-600" /> Logout
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: mobile actions */}
        <div className="flex lg:hidden items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setMobileSearchOpen(true)}>
            <Search className="w-4 h-4" />
          </Button>

          <Link to="/create/list">
            <Button size="icon" className="h-9 w-9 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>

          {/* Avatar menu (reuse desktop dropdown) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              {user?.profileImage?.url ? (
                <img src={user.profileImage.url} alt={user.fullName} className="w-8 h-8 rounded-full shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 grid place-items-center text-xs font-semibold shrink-0">
                  {(user?.fullName || "U").slice(0, 2).toUpperCase()}
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/profile"><User className="mr-2 h-4 w-4" /> Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button onClick={logout} className="w-full text-red-600">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu (left drawer) */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <img src="/src/assets/image.png" className="w-6 h-6" />
                  TripCast
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 grid gap-2 text-sm">
                <NavLink to="/dashboard" className="px-3 py-2 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/lists" className="px-3 py-2 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  Lists
                </NavLink>
                <NavLink to="/journals" className="px-3 py-2 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  Journal
                </NavLink>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile search sheet (full width) */}
      <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <SheetContent side="top" className="h-[85vh] p-0">
          <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileSearchOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 border px-3 py-2 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 flex-1">
              <Search className="text-gray-800 w-5 h-5" />
              <input
                autoFocus
                type="text"
                placeholder="Search destinations, lists..."
                className="w-full border-none outline-none bg-transparent"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => q.trim() && setOpen(true)}
              />
            </div>
          </div>

          <div className="px-2">
            <ResultsList panel />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
