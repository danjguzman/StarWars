import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { TrainRegional as TrainRegionalIcon } from "phosphor-react";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import { type Vehicle } from "@types";
import { useVehiclesStore } from "@stores/vehiclesStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Vehicles page wrapper that passes vehicle-specific data into the shared browse page layout. */
export default function VehiclesPage() {
    const { vehicleId } = useParams<{ vehicleId?: string }>();
    const {
        vehicles,
        loading,
        loadingMore,
        error,
        lastFailedRequestMode,
        hasMore,
        fetchVehicles,
    } = useVehiclesStore();
    const initialTargetCount = useMemo(() => estimateInitialTargetCount(), []);
    const { openModalRoute } = useModalRouteNavigation("/vehicles");

    /* Open a vehicle modal by moving the route to that vehicle detail path. */
    const openVehicleModal = useCallback((item: Vehicle) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    const sharedProps = {
        title: "Vehicles",
        entityKey: "vehicles",
        routeItemId: vehicleId,
        resources: vehicles,
        loading,
        loadingMore,
        hasMore,
        error,
        lastFailedRequestMode,
        initialItemCount: initialTargetCount,
        fetchResources: fetchVehicles,
        getItemId: (item: Vehicle) => resourceIdFromUrl(item.url),
        onOpenItem: openVehicleModal,
    };

    return (
        <ResourceBrowseRoute
            {...sharedProps}
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <TrainRegionalIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            errorUi={{
                initialTitle: "Couldn't load the Vehicles archive",
                nextPageTitle: "Couldn't load more vehicles",
                initialRetryLabel: "Retry loading vehicles",
                nextPageRetryLabel: "Try loading more again",
            }}
        />
    );
}
