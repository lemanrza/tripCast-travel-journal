import type { Destination } from "./DestinationType";
import type { User } from "./userType";
export type GroupLite = {
    _id: string;
    name?: string;
};
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
    group: GroupLite
};
export function mapListFromApi(api: any): List {
  return {
    id: api._id,
    title: api.title,
    description: api.description,
    tags: api.tags ?? [],
    isPublic: Boolean(api.isPublic),
    owner: api.owner,
    collaborators: api.collaborators ?? [],
    coverImage: api.coverImage,
    destinations: api.destinations ?? [],
    created: api.createdAt,
    group: api.group ?? null,
  };
}
