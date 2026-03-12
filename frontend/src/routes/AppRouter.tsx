import { Routes } from "react-router-dom";
import { homeRoutes } from "@routes/routes";

/* Render the app route tree. */
export default function AppRouter() {
    return <Routes>{homeRoutes}</Routes>;
}
