import { Navigate, Route } from "react-router-dom";
import NotFound from "@components/NotFound";
import FilmsPage from "@pages/Films";
import HomeLayout, { HomeSectionPage } from "@pages/Home";
import PlanetsPage from "@pages/Planets";
import PeoplePage from "@pages/People";
import SpeciesPage from "@pages/Species";
import StarshipsPage from "@pages/Starships";
import VehiclesPage from "@pages/Vehicles";
import { NAV_ITEMS } from "@utils/consts";

const IMPLEMENTED_BROWSE_ROUTES = new Set(["films", "people", "planets", "species", "vehicles", "starships"]);

export const homeRoutes = (
    <Route element={<HomeLayout />}>
        <Route index element={<Navigate to="/films" replace />} />
        <Route path="films" element={<FilmsPage />} />
        <Route path="films/:filmId" element={<FilmsPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="people/:personId" element={<PeoplePage />} />
        <Route path="planets" element={<PlanetsPage />} />
        <Route path="planets/:planetId" element={<PlanetsPage />} />
        <Route path="species" element={<SpeciesPage />} />
        <Route path="species/:speciesId" element={<SpeciesPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:vehicleId" element={<VehiclesPage />} />
        <Route path="starships" element={<StarshipsPage />} />
        <Route path="starships/:starshipId" element={<StarshipsPage />} />
        {NAV_ITEMS.filter((item) => !IMPLEMENTED_BROWSE_ROUTES.has(item.path)).map((item) => (
            <Route key={item.path} path={item.path} element={<HomeSectionPage title={item.label} />} />
        ))}
        {NAV_ITEMS.filter((item) => !IMPLEMENTED_BROWSE_ROUTES.has(item.path)).map((item) => (
            <Route key={`${item.path}-detail`} path={`${item.path}/:resourceId`} element={<HomeSectionPage title={item.label} />} />
        ))}
        <Route path="*" element={<NotFound />} />
    </Route>
);
