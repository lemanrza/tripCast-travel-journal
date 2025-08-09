export interface User {
    _id?: string;
    username?: string;
    email?: string;
    password?: string;
    profileImage?: {
        url?: string;
        public_id?: string;
    } | null;
    premium?: boolean;
    lists?: string[];
    journals?: string[];
    isVerified?: boolean;
    provider?: 'google' | 'local';
    providerId?: string | null;
    bio?: string | null;
    location?: string | null;
    socials?: {
        website?: string | null;
        instagram?: string | null;
        twitter?: string | null;
    };
    phoneNumber?: string | null;
    phone?: string | null;
    fullName?: string;
    loginAttempts?: number;
    lockUntil?: string | null;
    createdAt?: string;
    updatedAt?: string;
    isPublic?: boolean;
    emailNotifs?: boolean;
    showStats?: boolean;
}