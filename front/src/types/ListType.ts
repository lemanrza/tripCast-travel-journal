import type { Destination } from "./DestinationType";
import type { User } from "./userType";

export type List = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  owner: User;
  collaborators: User[];
  coverImage: string;
  destinations: Destination[];
  created: string;
};
