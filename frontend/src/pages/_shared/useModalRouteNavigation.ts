import { useCallback } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";

interface ModalRouteState {
    backgroundLocation?: Location;
}

function getBackgroundLocation(state: unknown) {
    if (!state || typeof state !== "object") return null;
    const candidate = (state as ModalRouteState).backgroundLocation;
    return candidate ?? null;
}

/* Preserve the current browse page while modal routes update on top of it. */
export default function useModalRouteNavigation(closePath: string) {
    const navigate = useNavigate();
    const location = useLocation();
    const backgroundLocation = getBackgroundLocation(location.state) ?? {
        ...location,
        pathname: closePath,
        search: "",
        hash: "",
        state: null,
    };

    const openModalRoute = useCallback((routePath: string) => {
        navigate(routePath, {
            state: {
                backgroundLocation,
            },
        });
    }, [backgroundLocation, navigate]);

    const closeModalRoute = useCallback(() => {
        const previousLocation = getBackgroundLocation(location.state);

        if (!previousLocation) {
            navigate(closePath);
            return;
        }

        navigate(`${previousLocation.pathname}${previousLocation.search}${previousLocation.hash}`, {
            replace: true,
        });
    }, [closePath, location.state, navigate]);

    return {
        openModalRoute,
        closeModalRoute,
    };
}
