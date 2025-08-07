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



export default function Dashboard() {
  const stats = [
    { icon: <IoLocationOutline />, label: "Total Destinations", value: 26, color: "blue" },
    { icon: <FaRegStar />, label: "Completed", value: 11, color: "green" },
    { icon: <LuUsers />, label: "Collaborators", value: 8, color: "purple" },
    { icon: <CiCalendar />, label: "This Year", value: 5, color: "orange" },
  ];

  const travelListsShared = [
    {
      title: "European Adventure 2024",
      desc: "Exploring the historic cities and beautiful landscapes of Europe",
      completed: 3,
      total: 8,
      tags: ["#culture", "#history", "#food"],
      visibility: "Public" as const,
      created: "1/15/2024",
      collaborators: 2,
      isNew: true,
    },
    {
      title: "Southeast Asia Backpacking",
      desc: "Budget-friendly adventure through Thailand, Vietnam, and Cambodia",
      completed: 0,
      total: 12,
      tags: ["#adventure", "#budget", "#culture"],
      visibility: "Private" as const,
      created: "2/1/2024",
      collaborators: 0,
    },
    {
      title: "Japan Cherry Blossom Tour",
      desc: "Experiencing the magical sakura season across Japan",
      completed: 6,
      total: 6,
      tags: ["#nature", "#culture", "#photography"],
      visibility: "Public" as const,
      created: "3/10/2023",
      collaborators: 1,
    },
  ];

  const travelListsMe = [
    {
      title: "European Adventure 2024",
      desc: "Exploring the historic cities and beautiful landscapes of Europe",
      completed: 3,
      total: 8,
      tags: ["#culture", "#history", "#food"],
      visibility: "Public" as const,
      created: "1/15/2024",
      collaborators: 2,
      isNew: true,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Welcome back, John! 👋</h1>
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
          <TabsTrigger value="mine">My Lists ({travelListsMe.length})</TabsTrigger>
          <TabsTrigger value="shared">Shared with Me ({travelListsShared.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {travelListsMe.map((list, i) => (
              <TravelListCard key={i} {...list} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shared">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {travelListsShared.map((list, i) => (
              <TravelListCard key={i} {...list} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
