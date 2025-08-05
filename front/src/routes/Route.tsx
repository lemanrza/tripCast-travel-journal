import { type RouteObject } from "react-router-dom";
import ClientLayout from "../layout/ClientLayout";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
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


const ROUTES: RouteObject[] = [
    // client layout
    {
        path: "/",
        element: <Login />,
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
        ],
    },
    // auth layout
    {
        element: <AuthLayout />,
        path: "/auth/",
        children: [
            {
                path: "login",
                element: <Login />,
            },
            {
                path: "register",
                element: <Register />,
            },
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
