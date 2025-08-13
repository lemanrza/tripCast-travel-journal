export type Journal = {
  id: string;
  title: string;
  location: string;
  date: string; // ISO
  visibility: "Public" | "Private";
  excerpt: string;
  images?: string[];
  likes?: number;
  comments?: number;
};