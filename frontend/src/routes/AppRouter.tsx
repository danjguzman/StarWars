import { Routes, useLocation, type Location } from "react-router-dom";
import { homeRoutes, modalRoutes } from "@routes/routes";

interface ModalRouteState {
    backgroundLocation?: Location;
}

function getBackgroundLocation(state: unknown) {
    if (!state || typeof state !== "object") return null;
    const candidate = (state as ModalRouteState).backgroundLocation;
    return candidate ?? null;
}

/* Render browse pages with an optional modal route layered above the background page. */
export default function AppRouter() {
    const location = useLocation();
    const backgroundLocation = getBackgroundLocation(location.state);

    return (
        <>
            <Routes location={backgroundLocation ?? location}>{homeRoutes}</Routes>
            {backgroundLocation ? <Routes>{modalRoutes}</Routes> : null}
        </>
    );
}
