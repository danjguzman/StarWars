import { useCallback, useMemo } from "react";
import { Box } from "@mantine/core";
import { TrainRegional as TrainRegionalIcon } from "phosphor-react";
import VehicleModalContent from "@pages/Vehicles/VehicleModalContent";
import ResourceBrowseRoute from "@pages/_shared/ResourceBrowseRoute";
import { type Vehicle } from "@types";
import { useVehiclesStore } from "@stores/vehiclesStore";
import { estimateInitialTargetCount } from "@utils/layout";
import { resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

/* Vehicles page wrapper that passes vehicle-specific data into the shared browse page layout. */
export default function VehiclesPage() {
    const navigate = useNavigate();
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

    /* Open a vehicle modal by moving the route to that vehicle detail path. */
    const openVehicleModal = useCallback((item: Vehicle) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        navigate(routePath);
    }, [navigate]);

    /* Close the modal by going back to the main vehicles page route. */
    const closeVehicleModal = useCallback(() => {
        navigate("/vehicles");
    }, [navigate]);

    return (
        <ResourceBrowseRoute
            title="Vehicles"
            headerIcon={
                <Box className={styles.pageHeaderIcon}>
                    <TrainRegionalIcon size={30} weight="duotone" color="var(--mantine-color-yellow-4)" />
                </Box>
            }
            entityKey="vehicles"
            routeItemId={vehicleId}
            resources={vehicles}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            lastFailedRequestMode={lastFailedRequestMode}
            initialItemCount={initialTargetCount}
            fetchResources={fetchVehicles}
            getItemId={(item) => resourceIdFromUrl(item.url)}
            onOpenItem={openVehicleModal}
            onCloseModal={closeVehicleModal}
            getModalAriaLabel={(item) => `${item.name} details`}
            errorUi={{
                initialTitle: "Couldn't load the Vehicles archive",
                nextPageTitle: "Couldn't load more vehicles",
                initialRetryLabel: "Retry loading vehicles",
                nextPageRetryLabel: "Try loading more again",
            }}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <VehicleModalContent
                    vehicle={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
        />
    );
}
