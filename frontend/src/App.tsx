import { BrowserRouter, Routes } from "react-router-dom";
import { homeRoutes } from "./pages/Home/routes";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>{homeRoutes}</Routes>
        </BrowserRouter>
    );
}
