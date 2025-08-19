import type { List } from "./ListType";
import type { User } from "./userType";

export type Group = {
    _id: string;
    name: string;
    description?: string;
    profileImage?: { url: string, public_id: string };
    admins?: User[];
    listId: List;
    members?: User[];
};