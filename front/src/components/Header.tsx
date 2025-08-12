import { Button } from "@/components/ui/button";
import { Bell, LogOut, Plus, Search, Settings, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, NavLink } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { useSelector } from "react-redux";

export default function Header() {
const user=useSelector((state:any)=>state.user)
const logout=()=>{
  localStorage.removeItem("token");
  window.location.href = "/";
}
  const notifications = [
    {
      title: "New collaborator joined",
      message: 'Sarah joined "European Adventure 2024"',
      time: "2 hours ago",
    },
    {
      title: "Trip reminder",
      message: "Barcelona trip is in 5 days!",
      time: "1 day ago",
    },
    {
      title: "Flight deal alert",
      message: "New deal for Tokyo flights!",
      time: "3 days ago",
    },
    {
      title: "Packing list shared",
      message: "Anna shared 'Iceland Essentials'",
      time: "5 days ago",
    },
    {
      title: "New comment",
      message: "Mike commented on your trip",
      time: "6 days ago",
    },
  ];
  return (
    <header className="flex items-center justify-between px-4 py-4 border-b">
      <div className="flex items-center space-x-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8">
            <img src="/src/assets/image.png" alt="TripCast icon" />
          </div>
          <span className="font-bold text-xl">Trip<span className="text-blue-500">Cast</span></span>
        </div>
        <nav className="flex items-center space-x-7 text-md font-medium text-muted-foreground">
          <NavLink to="/dashboard" className="hover:text-blue-800 transition">Dashboard</NavLink>
          <NavLink to="/lists" className="hover:text-blue-800 transition">Lists</NavLink>
          <NavLink to="/journals" className="hover:text-blue-800 transition">Journal</NavLink>
        </nav>

      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 border px-2 rounded-md bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-0">
          <Search className="text-gray-800 w-5 h-5" />
          <input type="text" name="" id="" placeholder="Search destinations, lists..." className="w-100 border-none py-2 outline-none ring-0 ring-offset-0 focus:outline-none focus:ring-0 focus:ring-offset-0 rounded-none" />
        </div>

        <Link to={"/create/list"} className="flex items-center">
          <Button className="flex items-center w-25 space-x-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </Button>
        </Link>

        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger className="relative align-center flex items-center justify-center hover:bg-gray-100 ">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">
                {notifications.length}
              </Badge>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-80 p-0"
              align="end"
              sideOffset={15}
            >
              <DropdownMenuLabel className="text-md font-semibold px-4 py-4 border-b">
                Notifications
              </DropdownMenuLabel>

              <div className="max-h-72 overflow-y-auto">
                {notifications.map((note, i) => (
                  <div key={i} className="px-4 py-3 border-b last:border-none">
                    <div className="font-semibold text-sm">{note.title}</div>
                    <div className="text-sm text-muted-foreground">{note.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{note.time}</div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none">
            <div>
              <img src={user.profileImage?.url} alt={user.fullName} className="w-8 h-8 rounded-full" />
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
              <button onClick={logout} className="w-full px-4 py-2 text-red-600 font-semibold hover:text-red-800"><LogOut className="text-red-600" /> Logout</button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}