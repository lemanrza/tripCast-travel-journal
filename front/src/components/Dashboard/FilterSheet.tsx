import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";
import type { Filters } from "@/hooks/useFiltering";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  allTags: string[];
  onClear: () => void;
};

export default function FilterSheet({
  open, onOpenChange, filters: f, setFilters, allTags, onClear,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 w-full sm:w-auto">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </SheetTrigger>

      {/* Full-screen on mobile, panel on desktop */}
      <SheetContent
        side="right"
        className="p-0 w-screen sm:w-[420px] sm:max-w-[420px]"
      >
        {/* Sticky header for mobile usability */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <SheetHeader className="px-5 py-4">
            <SheetTitle className="text-base sm:text-lg">Filter lists</SheetTitle>
            <SheetDescription className="text-xs sm:text-sm">
              Refine your lists across both tabs. Updates live.
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scroll area */}
        <div className="px-5 py-4 overflow-y-auto max-h-[calc(100vh-140px)] space-y-6">
          {/* Visibility */}
          <section className="space-y-2">
            <Label className="text-sm">Visibility</Label>
            <select
              className="border rounded-md h-10 px-3 text-sm"
              value={f.visibility}
              onChange={(e) =>
                setFilters({ ...f, visibility: e.target.value as Filters["visibility"] })
              }
            >
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </section>

          {/* Tags */}
          <section className="space-y-2">
            <Label className="text-sm">Tags</Label>
            <div className="flex flex-wrap sm:flex-wrap gap-2 overflow-x-auto pb-1">
              {allTags.length ? (
                allTags.map((t) => {
                  const active = f.tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`px-3 py-1 rounded-full text-xs border transition whitespace-nowrap
                        ${active ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-muted"}`}
                      onClick={() =>
                        setFilters(
                          active
                            ? { ...f, tags: f.tags.filter((k) => k !== t) }
                            : { ...f, tags: [...f.tags, t] }
                        )
                      }
                    >
                      #{t}
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-gray-500">No tags yet</span>
              )}
            </div>
          </section>

          {/* Date range */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Created from</Label>
              <Input
                type="date"
                value={f.createdFrom}
                onChange={(e) => setFilters({ ...f, createdFrom: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Created to</Label>
              <Input
                type="date"
                value={f.createdTo}
                onChange={(e) => setFilters({ ...f, createdTo: e.target.value })}
                className="h-10"
              />
            </div>
          </section>

          {/* Collaborators & Min destinations */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm">Collaborators</Label>
              <select
                className="border rounded-md h-10 px-3 text-sm"
                value={f.withCollaborators}
                onChange={(e) =>
                  setFilters({
                    ...f,
                    withCollaborators: e.target.value as Filters["withCollaborators"],
                  })
                }
              >
                <option value="any">Any</option>
                <option value="solo">Solo (no collaborators)</option>
                <option value="with">With collaborators</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Min destinations</Label>
              <Input
                type="number"
                min={0}
                value={f.minDestinations}
                onChange={(e) =>
                  setFilters({ ...f, minDestinations: Number(e.target.value) || 0 })
                }
                className="h-10"
              />
            </div>
          </section>

          {/* Completed only */}
          <section>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={f.onlyCompleted}
                onChange={(e) =>
                  setFilters({ ...f, onlyCompleted: e.target.checked })
                }
              />
              Only fully completed lists
            </label>
          </section>

          {/* Sort */}
          <section className="space-y-2">
            <Label className="text-sm">Sort by</Label>
            <select
              className="border rounded-md h-10 px-3 text-sm"
              value={f.sortBy}
              onChange={(e) =>
                setFilters({ ...f, sortBy: e.target.value as Filters["sortBy"] })
              }
            >
              <option value="recent">Most recent</option>
              <option value="alpha">A → Z</option>
              <option value="destinations">Most destinations</option>
              <option value="progress">Highest progress</option>
            </select>
          </section>
        </div>

        {/* Sticky footer on mobile */}
        <div className="sticky bottom-0 bg-white border-t">
          <SheetFooter className="px-5 py-3">
            <Button variant="ghost" onClick={onClear} className="w-full sm:w-auto">
              Clear
            </Button>
            <SheetClose asChild>
              <Button className="w-full sm:w-auto">Done</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
