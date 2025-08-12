export type Destination = {
  id: string;
  name: string;
  country: string;
  status: "wishlist" | "planned" | "completed";
  rating?: number; // 1..5
  notes?: string;
  datePlanned?: string; // ISO
  dateVisited?: string; // ISO
  journalCount?: number;
  cover?: string;
};