import { useMemo } from "react";
import type { List } from "@/types/ListType";

export type Filters = {
  visibility: "all" | "public" | "private";
  tags: string[];
  createdFrom: string;
  createdTo: string;
  withCollaborators: "any" | "solo" | "with";
  minDestinations: number;
  onlyCompleted: boolean;
  sortBy: "recent" | "alpha" | "destinations" | "progress";
};

export const DEFAULT_FILTERS: Filters = {
  visibility: "all",
  tags: [],
  createdFrom: "",
  createdTo: "",
  withCollaborators: "any",
  minDestinations: 0,
  onlyCompleted: false,
  sortBy: "recent",
};

export function useListFiltering(lists: List[], q: string, f: Filters) {
  return useMemo(() => {
    const query = q.trim().toLowerCase();

    const progress = (l: List) => {
      const t = l.destinations?.length || 0;
      const c = (l.destinations || []).filter((d: any) => d?.status === "completed").length;
      return t ? c / t : 0;
    };

    let arr = lists.filter((l) => {
      // Search
      const matchesSearch =
        !query ||
        (l.title || "").toLowerCase().includes(query) ||
        (l.description || "").toLowerCase().includes(query) ||
        (l.tags || []).some((t) => t.toLowerCase().includes(query));
      if (!matchesSearch) return false;

      // Visibility
      if (f.visibility === "public" && !l.isPublic) return false;
      if (f.visibility === "private" && l.isPublic) return false;

      // Tags (AND logic)
      if (f.tags.length && !f.tags.every((t) => (l.tags || []).includes(t))) return false;

      // Date range (created is ISO string in your ListType)
      const created = new Date(l.created).getTime();
      if (f.createdFrom) {
        const from = new Date(f.createdFrom).getTime();
        if (created < from) return false;
      }
      if (f.createdTo) {
        const to = new Date(`${f.createdTo}T23:59:59`).getTime();
        if (created > to) return false;
      }

      // Collaborators
      const collabs = l.collaborators?.length || 0;
      if (f.withCollaborators === "solo" && collabs > 0) return false;
      if (f.withCollaborators === "with" && collabs === 0) return false;

      // Min destinations
      const destTotal = l.destinations?.length || 0;
      if (destTotal < (f.minDestinations || 0)) return false;

      // Only fully completed lists
      if (f.onlyCompleted) {
        const done = (l.destinations || []).filter((d: any) => d?.status === "completed").length;
        if (!(destTotal > 0 && done === destTotal)) return false;
      }

      return true;
    });

    // Sort
    switch (f.sortBy) {
      case "alpha":
        arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "destinations":
        arr.sort(
          (a, b) => (b.destinations?.length || 0) - (a.destinations?.length || 0)
        );
        break;
      case "progress":
        arr.sort((a, b) => progress(b) - progress(a));
        break;
      case "recent":
      default:
        arr.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );
    }

    return arr;
  }, [lists, q, f]);
}
