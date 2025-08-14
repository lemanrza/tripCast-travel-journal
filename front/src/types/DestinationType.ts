import type { JournalDetail } from "./JournalType";
import type { List } from "./ListType";

export type Destination = {
  _id: string;
  name: string;
  country: string;
  datePlanned?: string;
  dateVisited?: string;
  status: "wishlist" | "planned" | "completed";
  notes?: string;
  image: {
    url: string;
    public_id: string;
  };
  listId: List;
  journals: JournalDetail[]
};