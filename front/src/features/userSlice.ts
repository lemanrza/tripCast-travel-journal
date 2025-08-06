import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

export interface UserState {
    id: string | null;
    username: string | null;
    email: string | null;
    fullName: string | null;
    profileImage: {
        url: string;
        public_id?: string;
    } | null;
    premium: boolean;
    lists: string[];
    journals: string[];
    lastLogin: string | null;
    loginAttempts: number;
    lockUntil: string | null;
    isVerified: boolean;
    provider: 'local' | 'google' | 'instagram';
    providerId: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    token: string | null;
    isAuthenticated: boolean;
}

function getInitialState(): UserState {
    const baseState: UserState = {
        id: null,
        username: null,
        email: null,
        fullName: null,
        profileImage: null,
        premium: false,
        lists: [],
        journals: [],
        lastLogin: null,
        loginAttempts: 0,
        lockUntil: null,
        isVerified: false,
        provider: 'local',
        providerId: null,
        createdAt: null,
        updatedAt: null,
        token: null,
        isAuthenticated: false,
    };

    try {
        const token = localStorage.getItem("token");
        if (token) {
            const decoded: {
                id: string;
                username: string;
                email: string;
                fullName: string;
                profileImage?: {
                    url: string;
                    public_id?: string;
                };
                premium?: boolean;
                lists?: string[];
                journals?: string[];
                lastLogin?: string;
                loginAttempts?: number;
                lockUntil?: string;
                isVerified?: boolean;
                provider?: 'local' | 'google' | 'instagram';
                providerId?: string;
                createdAt?: string;
                updatedAt?: string;
                iat: number;
                exp: number;
            } = jwtDecode(token);

            // Check if token is expired
            const currentTime = Date.now() / 1000;
            if (decoded.exp > currentTime) {
                return {
                    ...baseState,
                    id: decoded.id,
                    username: decoded.username,
                    email: decoded.email,
                    fullName: decoded.fullName,
                    profileImage: decoded.profileImage || null,
                    premium: decoded.premium || false,
                    lists: decoded.lists || [],
                    journals: decoded.journals || [],
                    lastLogin: decoded.lastLogin || null,
                    loginAttempts: decoded.loginAttempts || 0,
                    lockUntil: decoded.lockUntil || null,
                    isVerified: decoded.isVerified || false,
                    provider: decoded.provider || 'local',
                    providerId: decoded.providerId || null,
                    createdAt: decoded.createdAt || null,
                    updatedAt: decoded.updatedAt || null,
                    token: token,
                    isAuthenticated: true,
                };
            } else {
                // Token expired, remove it
                localStorage.removeItem("token");
            }
        }
    } catch (error) {
        console.error("Error loading user data from localStorage:", error);
        localStorage.removeItem("token");
    }

    return baseState;
}

const initialState = getInitialState();

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (
            state,
            action: PayloadAction<{
                id: string;
                username: string;
                email: string;
                fullName: string;
                profileImage?: {
                    url: string;
                    public_id?: string;
                };
                premium?: boolean;
                lists?: string[];
                journals?: string[];
                lastLogin?: string;
                loginAttempts?: number;
                lockUntil?: string;
                isVerified?: boolean;
                provider?: 'local' | 'google' | 'instagram';
                providerId?: string;
                createdAt?: string;
                updatedAt?: string;
                token: string;
            }>
        ) => {
            const { 
                id, 
                username, 
                email, 
                fullName, 
                profileImage, 
                premium, 
                lists, 
                journals, 
                lastLogin, 
                loginAttempts, 
                lockUntil, 
                isVerified, 
                provider, 
                providerId, 
                createdAt, 
                updatedAt, 
                token 
            } = action.payload;
            
            state.id = id;
            state.username = username;
            state.email = email;
            state.fullName = fullName;
            state.profileImage = profileImage || null;
            state.premium = premium || false;
            state.lists = lists || [];
            state.journals = journals || [];
            state.lastLogin = lastLogin || null;
            state.loginAttempts = loginAttempts || 0;
            state.lockUntil = lockUntil || null;
            state.isVerified = isVerified || false;
            state.provider = provider || 'local';
            state.providerId = providerId || null;
            state.createdAt = createdAt || null;
            state.updatedAt = updatedAt || null;
            state.token = token;
            state.isAuthenticated = true;
            localStorage.setItem("token", token);
        },
        updateUserProfile: (state, action: PayloadAction<{
            fullName?: string;
            profileImage?: {
                url: string;
                public_id?: string;
            };
        }>) => {
            if (action.payload.fullName) {
                state.fullName = action.payload.fullName;
            }
            if (action.payload.profileImage) {
                state.profileImage = action.payload.profileImage;
            }
            state.updatedAt = new Date().toISOString();
        },
        updatePremiumStatus: (state, action: PayloadAction<boolean>) => {
            state.premium = action.payload;
            state.updatedAt = new Date().toISOString();
        },
        addList: (state, action: PayloadAction<string>) => {
            if (!state.lists.includes(action.payload)) {
                state.lists.push(action.payload);
            }
            state.updatedAt = new Date().toISOString();
        },
        removeList: (state, action: PayloadAction<string>) => {
            state.lists = state.lists.filter(id => id !== action.payload);
            state.updatedAt = new Date().toISOString();
        },
        addJournal: (state, action: PayloadAction<string>) => {
            if (!state.journals.includes(action.payload)) {
                state.journals.push(action.payload);
            }
            state.updatedAt = new Date().toISOString();
        },
        removeJournal: (state, action: PayloadAction<string>) => {
            state.journals = state.journals.filter(id => id !== action.payload);
            state.updatedAt = new Date().toISOString();
        },
        updateLoginAttempts: (state, action: PayloadAction<number>) => {
            state.loginAttempts = action.payload;
        },
        setLockUntil: (state, action: PayloadAction<string | null>) => {
            state.lockUntil = action.payload;
        },
        setVerificationStatus: (state, action: PayloadAction<boolean>) => {
            state.isVerified = action.payload;
            state.updatedAt = new Date().toISOString();
        },
        logoutUser: (state) => {
            state.id = null;
            state.username = null;
            state.email = null;
            state.fullName = null;
            state.profileImage = null;
            state.premium = false;
            state.lists = [];
            state.journals = [];
            state.lastLogin = null;
            state.loginAttempts = 0;
            state.lockUntil = null;
            state.isVerified = false;
            state.provider = 'local';
            state.providerId = null;
            state.createdAt = null;
            state.updatedAt = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem("token");
        },
    },
});

export const { 
    setUser, 
    updateUserProfile, 
    updatePremiumStatus,
    addList,
    removeList,
    addJournal,
    removeJournal,
    updateLoginAttempts,
    setLockUntil,
    setVerificationStatus,
    logoutUser 
} = userSlice.actions;

export default userSlice.reducer;
