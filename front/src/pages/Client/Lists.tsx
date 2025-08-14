import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import TravelListCard from "@/components/TravelListCard";
import type { List } from "@/types/ListType";
import { enqueueSnackbar } from "notistack";

const Lists = () => {
  const [lists, setLists] = useState<List[]>([]);
  const userId = useSelector((state: any) => state.user.id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const fetchLists = async () => {
        const response = await controller.getAll(endpoints.lists);
        console.log(response)
        setLists(response.data)
      }
      fetchLists()
    } catch (error) {
      enqueueSnackbar("Failed to fetch lists");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredLists = useMemo(() => {
    let result = Array.isArray(lists)
      ? lists.filter(l => l.isPublic || (l.owner && (l.owner._id === userId)))
      : [];
    if (search.trim()) {
      result = result.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase()));
    }
    
    // Handle filters
    if (filter === "all") {
      result = result.filter(l => l.destinations.length > 0);
    } else if (filter) {
      const min = parseInt(filter, 10);
      if (!isNaN(min)) {
        result = result.filter(l => l.destinations.length >= min);
      }
    }
    return result;
  }, [lists, search, filter, userId]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Card className="mb-8">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-2xl font-bold">All Travel Lists</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search lists..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="sm:w-64"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Filter by destinations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="2">2+ destinations</SelectItem>
                <SelectItem value="5">5+ destinations</SelectItem>
                <SelectItem value="10">10+ destinations</SelectItem>
                <SelectItem value="15">15+ destinations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading lists...</div>
          ) : filteredLists.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No lists found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLists.map(list => (
                <TravelListCard
                  key={list.id}
                  id={list.id}
                  user={list.owner}
                  title={list.title}
                  desc={list.description}
                  completed={list.destinations.filter(d => d.status === 'completed').length}
                  total={list.destinations.length}
                  tags={list.tags}
                  coverImage={list.coverImage}
                  visibility={list.isPublic ? 'Public' : 'Private'}
                  created={list.created}
                  collaborators={list.collaborators.length}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Lists;
