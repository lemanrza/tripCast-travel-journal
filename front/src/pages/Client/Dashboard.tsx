import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardCard from "@/components/DashboardCard";
import { IoLocationOutline } from "react-icons/io5";
import { FaRegStar } from "react-icons/fa";
import { LuUsers } from "react-icons/lu";
import { CiCalendar } from "react-icons/ci";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { User } from "@/types/userType";
import type { List } from "@/types/ListType";
import { DEFAULT_FILTERS, useListFiltering, type Filters } from "@/hooks/useFiltering";
import SearchBar from "@/components/Dashboard/SearchBar";
import FilterSheet from "@/components/Dashboard/FilterSheet";
import ListsTab from "@/components/Dashboard/ListsTab";


export default function Dashboard() {
  const [myLists, setMyLists] = useState<List[]>([]);
  const [sharedLists, setSharedLists] = useState<List[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const userRedux = useSelector((state: any) => state.user);

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [openFilter, setOpenFilter] = useState(false);

  useEffect(() => {
    if (!userRedux?.id) return;

    const fetchUser = async () => {
      try {
        const response = await controller.getOne(`${endpoints.users}/user`, userRedux.id);
        setUser(response.data);
      } catch {}
    };
    const fetchMyLists = async () => {
      try {
        const r = await controller.getAll(`${endpoints.lists}/my-lists`);
        setMyLists(r.data || []);
      } catch {}
    };
    const fetchSharedLists = async () => {
      try {
        const r = await controller.getAll(`${endpoints.lists}/collaborative`);
        setSharedLists(r.data || []);
      } catch {}
    };

    fetchUser();
    fetchMyLists();
    fetchSharedLists();
  }, [userRedux?.id]);

  const totalDestinations = [...myLists, ...sharedLists].reduce(
    (t, l) => t + (l.destinations?.length || 0), 0
  );
  const completedDestinations = [...myLists, ...sharedLists].reduce((t, l) => {
    const done = (l.destinations || []).filter((d: any) => d?.status === "completed").length;
    return t + done;
  }, 0);
  const totalCollaborators = myLists.reduce((t, l) => t + (l.collaborators?.length || 0), 0);
  const listsThisYear = myLists.filter(
    (l) => new Date(l.created).getFullYear() === new Date().getFullYear()
  ).length;

  const stats = [
    { icon: <IoLocationOutline />, label: "Total Destinations", value: totalDestinations, color: "blue" },
    { icon: <FaRegStar />, label: "Completed", value: completedDestinations, color: "green" },
    { icon: <LuUsers />, label: "Collaborators", value: totalCollaborators, color: "purple" },
    { icon: <CiCalendar />, label: "Lists This Year", value: listsThisYear, color: "orange" },
  ];

  const allTags = useMemo(() => {
    const set = new Set<string>();
    [...myLists, ...sharedLists].forEach((l) => (l.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [myLists, sharedLists]);

  const filteredMy = useListFiltering(myLists, q, filters);
  const filteredShared = useListFiltering(sharedLists, q, filters);

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Welcome back, {user?.fullName}! 👋
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-2">
            Ready for your next adventure?
          </p>
        </div>
        <Link to={"/create/list"} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Plus className="w-4 h-4 mr-2" /> Create New List
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div
        className="
          grid gap-3 sm:gap-4
          grid-cols-2 sm:grid-cols-2 lg:grid-cols-4
        "
      >
        {stats.map((s, i) => (
          <DashboardCard
            key={i}
            icon={s.icon}
            label={s.label}
            value={s.value}
            color={s.color}
          />
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={q} onChange={setQ} className="flex-1" />
        <FilterSheet
          open={openFilter}
          onOpenChange={setOpenFilter}
          filters={filters}
          setFilters={setFilters}
          allTags={allTags}
          onClear={clearFilters}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mine">
        <TabsList className="bg-muted rounded-md mb-4">
          <TabsTrigger className="flex-1 sm:flex-none" value="mine">
            My Lists ({filteredMy.length})
          </TabsTrigger>
          <TabsTrigger className="flex-1 sm:flex-none" value="shared">
            Shared with Me ({filteredShared.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          <ListsTab
            lists={filteredMy}
            emptyMessage="No lists match your filters."
            showCreateCta
          />
        </TabsContent>

        <TabsContent value="shared">
          <ListsTab
            lists={filteredShared}
            emptyMessage="No shared lists match your filters."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
