import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

export interface UserState {
    id: string | null;
    username: string | null;
    email: string | null;
    fullName?: string | null;
    lastLogin: string | null;
    loginAttempts: number;
    lockUntil: string | null;
    lastSeen: string | null;
    isVerified: boolean;
}

function getInitialState(): UserState {
    const baseState: UserState = {
        id: null,
        status: null,
        socketId: null,
        profileVisibility: null,
        username: null,
        email: null,
        profile: null,
        hobbies: [],
        connections: [],
        lastLogin: null,
        loginAttempts: 0,
        lockUntil: null,
        lastSeen: null,
        isOnline: false,
        emailVerified: false,
        connectionsRequests: [],
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
                profile: UserProfile;
                status: string;
                socketId: string | null;
                profileVisibility: string;
                hobbies: string[];
                connections: string[];
                lastLogin: string | null;
                isOnline: boolean;
                emailVerified: boolean;
                connectionsRequests: string[];
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
                    profile: decoded.profile,
                    status: decoded.status,
                    socketId: decoded.socketId,
                    profileVisibility: decoded.profileVisibility,
                    hobbies: decoded.hobbies || [],
                    connections: decoded.connections || [],
                    lastLogin: decoded.lastLogin,
                    isOnline: decoded.isOnline,
                    emailVerified: decoded.emailVerified,
                    connectionsRequests: decoded.connectionsRequests || [],
                    lastSeen: new Date().toISOString(),
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
                profile: UserProfile;
                status: string;
                socketId: string | null;
                profileVisibility: string;
                hobbies: string[];
                connections: string[];
                lastLogin: string | null;
                isOnline: boolean;
                emailVerified: boolean;
                connectionsRequests: string[];
                lastSeen?: string;
                token: string;
            }>
        ) => {
            const { id, username, email, profile, status, socketId, profileVisibility, hobbies, connections, lastLogin, isOnline, emailVerified, connectionsRequests, token } = action.payload;
            state.id = id;
            state.username = username;
            state.email = email;
            state.profile = profile;
            state.status = status;
            state.socketId = socketId;
            state.profileVisibility = profileVisibility;
            state.hobbies = hobbies || [];
            state.connections = connections || [];
            state.lastLogin = lastLogin;
            state.isOnline = isOnline;
            state.emailVerified = emailVerified;
            state.connectionsRequests = connectionsRequests || [];
            state.token = token;
            state.isAuthenticated = true;
            state.lastSeen = new Date().toISOString();
            localStorage.setItem("token", token);
        },
        updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
            if (state.profile) {
                state.profile = { ...state.profile, ...action.payload };
            }
        },
        updateUserHobbies: (state, action: PayloadAction<string[]>) => {
            state.hobbies = action.payload;
        },
        addConnection: (state, action: PayloadAction<string>) => {
            if (!state.connections.includes(action.payload)) {
                state.connections.push(action.payload);
            }
        },
        removeConnection: (state, action: PayloadAction<string>) => {
            state.connections = state.connections.filter(id => id !== action.payload);
        },
        setOnlineStatus: (state, action: PayloadAction<boolean>) => {
            state.isOnline = action.payload;
            state.lastSeen = new Date().toISOString();
        },
        logoutUser: (state) => {
            state.id = null;
            state.status = null;
            state.socketId = null;
            state.profileVisibility = null;
            state.username = null;
            state.email = null;
            state.profile = null;
            state.hobbies = [];
            state.connections = [];
            state.lastLogin = null;
            state.loginAttempts = 0;
            state.lockUntil = null;
            state.lastSeen = null;
            state.isOnline = false;
            state.emailVerified = false;
            state.connectionsRequests = [];
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem("token");
        },
    },
});

export const { 
    setUser, 
    updateUserProfile, 
    updateUserHobbies, 
    addConnection, 
    removeConnection, 
    setOnlineStatus, 
    logoutUser 
} = userSlice.actions;

export default userSlice.reducer;
