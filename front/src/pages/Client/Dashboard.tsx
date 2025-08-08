import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardCard from "@/components/DashboardCard";
import TravelListCard from "@/components/TravelListCard";
import { IoLocationOutline } from "react-icons/io5";
import { FaRegStar } from "react-icons/fa";
import { LuUsers } from "react-icons/lu";
import { CiCalendar } from "react-icons/ci";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";



export default function Dashboard() {
  const [allLists, setAllLists] = useState([]);
  const user = useSelector((state: any) => state.user);
  useEffect(() => {
    if (!user || !user.id) {
      console.error("User not found or not logged in");
      return;
    }
    const fetchLists = async () => {
      const response = await controller.getAll(endpoints.lists)
      setAllLists(response.data)
    }
    fetchLists()
  }, [user])
  // console.log(user.lists)
  const stats = [
    { icon: <IoLocationOutline />, label: "Total Destinations", value: user.lists?.reduce((total: number, list: any) => total + (list.destinations?.length || 0), 0) || 0, color: "blue" },
    { icon: <FaRegStar />, label: "Completed", value: user.lists?.reduce((total: number, list: any) => total + (list.destinations?.filter((dest: any) => dest.status === 'completed').length || 0), 0) || 0, color: "green" },
    { icon: <LuUsers />, label: "Collaborators", value: user.lists?.reduce((total: number, list: any) => total + (list.collaborators?.length || 0), 0) || 0, color: "purple" },
    { icon: <CiCalendar />, label: "Lists This Year", value: user.lists?.filter((list: any) => new Date(list.createdAt).getFullYear() === new Date().getFullYear()).length || 0, color: "orange" },
  ];

  const travelListsMe = user.lists?.filter((list: any) => list.owner === user.id) || [];
  const travelListsShared = allLists.filter((list: any) => 
    list.collaborators?.some((collab: any) => collab._id === user.id) && list.owner !== user.id
  ) || [];

  const formatList = (list: any) => ({
    title: list.title || "Untitled List",
    desc: list.description || "No description available",
    completed: list.destinations?.filter((dest: any) => dest.status === 'completed').length || 0,
    total: list.destinations?.length || 0,
    tags: list.tags || [],
    visibility: list.isPublic ? "Public" as const : "Private" as const,
    created: new Date(list.createdAt).toLocaleDateString() || "Unknown",
    collaborators: list.collaborators?.length || 0,
    isNew: false,
  });

  const formattedListsMe = travelListsMe.map(formatList);
  const formattedListsShared = travelListsShared.map(formatList);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Welcome back, {user.fullName}! 👋</h1>
          <p className="text-muted-foreground text-md mt-3">Ready for your next adventure?</p>
        </div>
        <Link to={"/create/list"}>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Plus className="w-4 h-4 mr-2" /> Create New List
          </Button>
        </Link>

      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <DashboardCard key={i} icon={stat.icon} label={stat.label} value={stat.value} color={stat.color} />
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center space-x-2 border px-2 rounded-md bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-0">
          <Search className="text-gray-800 w-5 h-5" />
          <input type="text" name="" id="" placeholder="Search destinations, lists..." className="w-330 border-none py-2 outline-none ring-0 ring-offset-0 focus:outline-none focus:ring-0 focus:ring-offset-0 rounded-none" />
        </div>
        <Sheet>
          <SheetTrigger>
            <Button variant="outline" className="ml-auto h-10">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here. Click save when you&apos;re done.
              </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 auto-rows-min gap-6 px-4">
              <div className="grid gap-3">
                <Label htmlFor="sheet-demo-name">Name</Label>
                <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="sheet-demo-username">Username</Label>
                <Input id="sheet-demo-username" defaultValue="@peduarte" />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">Save changes</Button>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

      </div>

      {/* Tabs */}
      <Tabs defaultValue="mine">
        <TabsList className="bg-muted rounded-md w-fit mb-4">
          <TabsTrigger value="mine">My Lists ({formattedListsMe.length})</TabsTrigger>
          <TabsTrigger value="shared">Shared with Me ({formattedListsShared.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {formattedListsMe.length > 0 ? (
              formattedListsMe.map((list: any, i: number) => (
                <TravelListCard key={i} {...list} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <p>You haven't created any travel lists yet.</p>
                <Link to="/create/list">
                  <Button className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Your First List
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shared">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {formattedListsShared.length > 0 ? (
              formattedListsShared.map((list: any, i: number) => (
                <TravelListCard key={i} {...list} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <p>No lists have been shared with you yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
