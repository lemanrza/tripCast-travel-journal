export const API_BASE_URL: string = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

const endpoints = {
    users: "/auth",
    lists: "/lists",
    journals: "/journals",
    upload: "/upload",
    destinations: "/destinations",
};

export default endpoints;
