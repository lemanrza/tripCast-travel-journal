import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Search, Settings, User } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // use your shadcn wrapper
import { useSelector } from "react-redux";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  path: string;      // where to navigate
  group: "Pages" | "Lists" | "Journals" | "Destinations";
};

const STATIC_PAGES: Array<Omit<SearchResult, "id" | "group"> & { group?: SearchResult["group"] }> = [
  { title: "Dashboard", path: "/dashboard", subtitle: "App overview", group: "Pages" },
  { title: "Lists", path: "/lists", subtitle: "All your lists", group: "Pages" },
  { title: "Journals", path: "/journals", subtitle: "All journal entries", group: "Pages" },
  { title: "Create List", path: "/create/list", subtitle: "Start a new list", group: "Pages" },
  { title: "Settings", path: "/settings", subtitle: "Account & app settings", group: "Pages" },
  { title: "Profile", path: "/profile", subtitle: "Your profile", group: "Pages" },
];

export default function Header() {
  const user = useSelector((state: any) => state.user);
  const navigate = useNavigate();

  // --- Search state ---
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

        // Pages
        const pageMatches: SearchResult[] = STATIC_PAGES
          .filter(p => p.title.toLowerCase().includes(lc) || p.subtitle?.toLowerCase().includes(lc))
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
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <header className="flex items-center justify-between px-4 py-4 border-b">
      <div className="flex items-center space-x-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8">
            <img src="/src/assets/image.png" alt="TripCast icon" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Trip<span className="font-black">Cast</span>
            </span>
          </h1>
        </div>

        <nav className="flex items-center space-x-7 text-md font-medium text-muted-foreground">
          <NavLink to="/dashboard" className="hover:text-blue-800 transition">Dashboard</NavLink>
          <NavLink to="/lists" className="hover:text-blue-800 transition">Lists</NavLink>
          <NavLink to="/journals" className="hover:text-blue-800 transition">Journal</NavLink>
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        {/* SEARCH */}
        <div className="relative" ref={wrapRef}>
          <div className="flex items-center space-x-2 border px-2 rounded-md bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-0 w-[20rem]">
            <Search className="text-gray-800 w-5 h-5" />
            <input
              type="text"
              placeholder="Search destinations, lists..."
              className="w-full border-none py-2 outline-none ring-0 ring-offset-0 focus:outline-none focus:ring-0 focus:ring-offset-0 rounded-none"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => q.trim() && setOpen(true)}
            />
          </div>

          {/* DROPDOWN */}
          {open && (
            <div
              role="listbox"
              aria-label="Search results"
              className="absolute z-50 mt-1 w-[28rem] right-0 sm:left-0 sm:right-auto rounded-md border bg-white shadow-lg overflow-hidden"
            >
              {loading ? (
                <div className="p-3 text-sm text-muted-foreground">Searching…</div>
              ) : results.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">No results</div>
              ) : (
                <div className="max-h-96 overflow-auto">
                  {(["Pages", "Lists", "Journals", "Destinations"] as const).map((g) =>
                    grouped[g].length ? (
                      <div key={g} className="py-2">
                        <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground">{g}</div>
                        {grouped[g].map((r) => {
                          const globalIndex =
                            results.findIndex((x) => x.id === r.id && x.group === r.group);
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
                              }}
                              className={`w-full text-left px-3 py-2 hover:bg-accent ${
                                isActive ? "bg-accent" : ""
                              }`}
                            >
                              <div className="text-sm font-medium">{r.title}</div>
                              {r.subtitle && (
                                <div className="text-xs text-muted-foreground">{r.subtitle}</div>
                              )}
                              <div className="text-[10px] text-muted-foreground/80 mt-1">{r.path}</div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <Link to={"/create/list"} className="flex items-center">
          <Button className="flex items-center w-25 space-x-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none">
            <div>
              {user?.profileImage?.url ? (
                <img src={user.profileImage.url} alt={user.fullName} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 grid place-items-center text-xs font-semibold">
                  {(user?.fullName || "U").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64 rounded-lg shadow-md p-0" align="end" sideOffset={8}>
            <div className="px-4 py-3">
              <div className="text-sm font-medium text-black">{user.fullName}</div>
              <div className="text-sm text-muted-foreground font-semibold">{user.email}</div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to="/profile" className="w-full px-4 py-2"><User /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="w-full px-4 py-2"><Settings /> Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button onClick={logout} className="w-full px-4 py-2 text-red-600 font-semibold hover:text-red-800">
                <LogOut className="text-red-600" /> Logout
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
