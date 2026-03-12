import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { modalRouteTargetFromPathname } from "@utils/swapi";

/* Navigate between modal URLs while keeping same-category steps replace-only. */
export default function useModalRouteNavigation(closePath: string) {
    const navigate = useNavigate();
    const location = useLocation();

    const openModalRoute = useCallback((routePath: string) => {
        const currentTarget = modalRouteTargetFromPathname(location.pathname);
        const nextTarget = modalRouteTargetFromPathname(routePath);
        const shouldReplace = currentTarget !== null
            && nextTarget !== null
            && currentTarget.resourceKey === nextTarget.resourceKey;

        navigate(routePath, { replace: shouldReplace });
    }, [location.pathname, navigate]);

    const closeModalRoute = useCallback(() => {
        navigate(closePath, {
            replace: true,
        });
    }, [closePath, navigate]);

    return {
        openModalRoute,
        closeModalRoute,
    };
}
