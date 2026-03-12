import { useCallback, useEffect, useMemo } from "react";
import FilmModalContent from "@pages/Films/FilmModalContent";
import PersonModalContent from "@pages/People/PersonModalContent";
import PlanetModalContent from "@pages/Planets/PlanetModalContent";
import SpeciesModalContent from "@pages/Species/SpeciesModalContent";
import StarshipModalContent from "@pages/Starships/StarshipModalContent";
import VehicleModalContent from "@pages/Vehicles/VehicleModalContent";
import ResourceModalLayer from "@pages/_shared/ResourceModalLayer";
import useModalRouteNavigation from "@pages/_shared/useModalRouteNavigation";
import { getPreloadedCollection } from "@services/preloadService";
import { useFilmsStore } from "@stores/filmsStore";
import { useModalStackStore, type ModalStackEntry } from "@stores/modalStackStore";
import { usePeopleStore } from "@stores/peopleStore";
import { usePlanetsStore } from "@stores/planetsStore";
import { useSpeciesStore } from "@stores/speciesStore";
import { useStarshipsStore } from "@stores/starshipsStore";
import { useVehiclesStore } from "@stores/vehiclesStore";
import { type Film, type Person, type Planet, type Species, type Starship, type Vehicle } from "@types";
import { modalRouteTargetFromPathname, resourceIdFromUrl, resourceRoutePathFromUrl } from "@utils/swapi";
import { useLocation } from "react-router-dom";

const MODAL_STACK_Z_INDEX_BASE = 1000;
const MODAL_STACK_Z_INDEX_STEP = 10;

interface ModalEntryRendererProps {
    entry: ModalStackEntry;
    zIndex: number;
    isTopmost: boolean;
    onExitComplete: (instanceId: string) => void;
}

export default function AppModalHost() {
    const location = useLocation();
    const stack = useModalStackStore((state) => state.stack);
    const syncToRoute = useModalStackStore((state) => state.syncToRoute);
    const removeEntry = useModalStackStore((state) => state.removeEntry);
    const modalTarget = useMemo(() => modalRouteTargetFromPathname(location.pathname), [location.pathname]);

    useEffect(() => {
        syncToRoute(modalTarget);
    }, [modalTarget, syncToRoute]);

    const handleExitComplete = useCallback((instanceId: string) => {
        removeEntry(instanceId);
    }, [removeEntry]);

    return stack.map((entry, index) => (
        <ModalEntryRenderer
            key={entry.instanceId}
            entry={entry}
            zIndex={MODAL_STACK_Z_INDEX_BASE + index * MODAL_STACK_Z_INDEX_STEP}
            isTopmost={index === stack.length - 1}
            onExitComplete={handleExitComplete}
        />
    ));
}

function ModalEntryRenderer({ entry, zIndex, isTopmost, onExitComplete }: ModalEntryRendererProps) {
    switch (entry.resourceKey) {
        case "films":
            return <FilmModalEntry entry={entry} zIndex={zIndex} isTopmost={isTopmost} onExitComplete={onExitComplete} />;
        case "people":
            return <PeopleModalEntry entry={entry} zIndex={zIndex} isTopmost={isTopmost} onExitComplete={onExitComplete} />;
        case "planets":
            return <PlanetModalEntry entry={entry} zIndex={zIndex} isTopmost={isTopmost} onExitComplete={onExitComplete} />;
        case "species":
            return <SpeciesModalEntry entry={entry} zIndex={zIndex} isTopmost={isTopmost} onExitComplete={onExitComplete} />;
        case "vehicles":
            return <VehicleModalEntry entry={entry} zIndex={zIndex} isTopmost={isTopmost} onExitComplete={onExitComplete} />;
        case "starships":
            return <StarshipModalEntry entry={entry} zIndex={zIndex} isTopmost={isTopmost} onExitComplete={onExitComplete} />;
        default:
            return null;
    }
}

function FilmModalEntry({ entry, zIndex, isTopmost, onExitComplete }: ModalEntryRendererProps) {
    const { films, loading, loadingMore, error } = useFilmsStore();
    const modalFilms = getPreloadedCollection<Film>("films") ?? films;
    const { openModalRoute, closeModalRoute } = useModalRouteNavigation("/films");

    const openFilmModal = useCallback((film: Film) => {
        const routePath = resourceRoutePathFromUrl(film.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    return (
        <ResourceModalLayer
            title="Films"
            entry={entry}
            resources={modalFilms}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            onCloseModal={closeModalRoute}
            onOpenItem={openFilmModal}
            getItemId={(film) => resourceIdFromUrl(film.url)}
            getModalAriaLabel={(film) => `${film.title} details`}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <FilmModalContent
                    film={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
            zIndex={zIndex}
            interactive={isTopmost && entry.state === "open"}
            lockScroll={isTopmost}
            onExitComplete={onExitComplete}
        />
    );
}

function PeopleModalEntry({ entry, zIndex, isTopmost, onExitComplete }: ModalEntryRendererProps) {
    const { people, loading, loadingMore, error } = usePeopleStore();
    const modalPeople = getPreloadedCollection<Person>("people") ?? people;
    const { openModalRoute, closeModalRoute } = useModalRouteNavigation("/people");

    const openPersonModal = useCallback((person: Person) => {
        const routePath = resourceRoutePathFromUrl(person.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    return (
        <ResourceModalLayer
            title="People"
            entry={entry}
            resources={modalPeople}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            onCloseModal={closeModalRoute}
            onOpenItem={openPersonModal}
            getItemId={(person) => resourceIdFromUrl(person.url)}
            getModalAriaLabel={(person) => `${person.name} details`}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <PersonModalContent
                    person={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
            zIndex={zIndex}
            interactive={isTopmost && entry.state === "open"}
            lockScroll={isTopmost}
            onExitComplete={onExitComplete}
        />
    );
}

function PlanetModalEntry({ entry, zIndex, isTopmost, onExitComplete }: ModalEntryRendererProps) {
    const { planets, loading, loadingMore, error } = usePlanetsStore();
    const modalPlanets = getPreloadedCollection<Planet>("planets") ?? planets;
    const { openModalRoute, closeModalRoute } = useModalRouteNavigation("/planets");

    const openPlanetModal = useCallback((planet: Planet) => {
        const routePath = resourceRoutePathFromUrl(planet.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    return (
        <ResourceModalLayer
            title="Planets"
            entry={entry}
            resources={modalPlanets}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            onCloseModal={closeModalRoute}
            onOpenItem={openPlanetModal}
            getItemId={(planet) => resourceIdFromUrl(planet.url)}
            getModalAriaLabel={(planet) => `${planet.name} details`}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <PlanetModalContent
                    planet={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
            zIndex={zIndex}
            interactive={isTopmost && entry.state === "open"}
            lockScroll={isTopmost}
            onExitComplete={onExitComplete}
        />
    );
}

function SpeciesModalEntry({ entry, zIndex, isTopmost, onExitComplete }: ModalEntryRendererProps) {
    const { species, loading, loadingMore, error } = useSpeciesStore();
    const modalSpecies = getPreloadedCollection<Species>("species") ?? species;
    const { openModalRoute, closeModalRoute } = useModalRouteNavigation("/species");

    const openSpeciesModal = useCallback((item: Species) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    return (
        <ResourceModalLayer
            title="Species"
            entry={entry}
            resources={modalSpecies}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            onCloseModal={closeModalRoute}
            onOpenItem={openSpeciesModal}
            getItemId={(item) => resourceIdFromUrl(item.url)}
            getModalAriaLabel={(item) => `${item.name} details`}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <SpeciesModalContent
                    species={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
            zIndex={zIndex}
            interactive={isTopmost && entry.state === "open"}
            lockScroll={isTopmost}
            onExitComplete={onExitComplete}
        />
    );
}

function VehicleModalEntry({ entry, zIndex, isTopmost, onExitComplete }: ModalEntryRendererProps) {
    const { vehicles, loading, loadingMore, error } = useVehiclesStore();
    const modalVehicles = getPreloadedCollection<Vehicle>("vehicles") ?? vehicles;
    const { openModalRoute, closeModalRoute } = useModalRouteNavigation("/vehicles");

    const openVehicleModal = useCallback((item: Vehicle) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    return (
        <ResourceModalLayer
            title="Vehicles"
            entry={entry}
            resources={modalVehicles}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            onCloseModal={closeModalRoute}
            onOpenItem={openVehicleModal}
            getItemId={(item) => resourceIdFromUrl(item.url)}
            getModalAriaLabel={(item) => `${item.name} details`}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <VehicleModalContent
                    vehicle={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
            zIndex={zIndex}
            interactive={isTopmost && entry.state === "open"}
            lockScroll={isTopmost}
            onExitComplete={onExitComplete}
        />
    );
}

function StarshipModalEntry({ entry, zIndex, isTopmost, onExitComplete }: ModalEntryRendererProps) {
    const { starships, loading, loadingMore, error } = useStarshipsStore();
    const modalStarships = getPreloadedCollection<Starship>("starships") ?? starships;
    const { openModalRoute, closeModalRoute } = useModalRouteNavigation("/starships");

    const openStarshipModal = useCallback((item: Starship) => {
        const routePath = resourceRoutePathFromUrl(item.url);
        if (!routePath) return;
        openModalRoute(routePath);
    }, [openModalRoute]);

    return (
        <ResourceModalLayer
            title="Starships"
            entry={entry}
            resources={modalStarships}
            loading={loading}
            loadingMore={loadingMore}
            error={error}
            onCloseModal={closeModalRoute}
            onOpenItem={openStarshipModal}
            getItemId={(item) => resourceIdFromUrl(item.url)}
            getModalAriaLabel={(item) => `${item.name} details`}
            renderModalContent={({ item, selectedIndex, total, onPrev, onNext }) => (
                <StarshipModalContent
                    starship={item}
                    selectedIndex={selectedIndex}
                    total={total}
                    onPrev={onPrev}
                    onNext={onNext}
                />
            )}
            zIndex={zIndex}
            interactive={isTopmost && entry.state === "open"}
            lockScroll={isTopmost}
            onExitComplete={onExitComplete}
        />
    );
}
