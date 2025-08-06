import { type RouteObject } from "react-router-dom";
import ClientLayout from "../layout/ClientLayout";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import AuthLayout from "../layout/AuthLayout";
import Dashboard from "../pages/Client/Dashboard";
import Journals from "../pages/Client/Journals";
import Lists from "../pages/Client/Lists";
import JournalDetail from "../pages/Client/JournalDetail";
import ListDetail from "../pages/Client/ListDetail";
import EmailVerify from "../pages/Auth/EmailVerify";
import AuthCallback from "../pages/Auth/AuthCallback";
import NotFound from "../pages/Client/NotFound";
import LoginRegister from "../pages/Auth/LoginRegister";
import Profile from "@/pages/Client/Profile";
import Explore from "@/pages/Client/Explore";


const ROUTES: RouteObject[] = [
    // client layout
    {
        path: "/",
        element: <LoginRegister />,
    },
    {
        element: <ClientLayout />,
        children: [
            {
                path: "dashboard",
                element: <Dashboard />,
            },
            {
                path: "journals",
                element: <Journals />,
            },
            {
                path: "journals/:id",
                element: <JournalDetail />,
            },
            {
                path: "lists",
                element: <Lists />,
            },
            {
                path: "lists/:id",
                element: <ListDetail />,
            },
               {
                path: "profile",
                element: <Profile />,
            },
            {
                path: "explore",
                element: <Explore />,
            },
        ],
    },
    // auth layout
    {
        element: <AuthLayout />,
        path: "/auth/",
        children: [
            {
                path: "email-verified",
                element: <EmailVerify />,
            },
            {
                path: "forgot-password",
                element: <ForgotPassword />,
            },
            {
                path: "reset-password/:token",
                element: <ResetPassword />,
            },
            {
                path: "success/:token",
                element: <AuthCallback />,
            },
        ],
    },
    {
        path: "*",
        element: <NotFound />,
    },
];

export default ROUTES;
