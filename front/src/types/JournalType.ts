import type { User } from "./userType";

export type JournalDetail = {
  id: string;
  title: string;
  destination: string;
  author: User;
  content: string;
  createdAt: string | Date;
  comments: JournalComment[];
  photos: { url: string; public_id: string }[];
  likes: string[];
  public: boolean
};

export type JournalComment = {
  id: string;
  author: { name: string; avatarUrl?: string };
  content: string;
  createdAt: string | Date;
};