import { Route } from "react-router-dom";
import NotFound from "@components/NotFound";
import FilmsPage from "@pages/Films";
import HomeLayout, { HomePage, HomeSectionPage } from "@pages/Home";
import PeoplePage from "@pages/People";
import { NAV_ITEMS } from "@utils/consts";

const IMPLEMENTED_BROWSE_ROUTES = new Set(["films", "people"]);

export const homeRoutes = (
    <Route element={<HomeLayout />}>
        <Route index element={<HomePage />} />
        <Route path="films" element={<FilmsPage />} />
        <Route path="films/:filmId" element={<FilmsPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="people/:personId" element={<PeoplePage />} />
        {NAV_ITEMS.filter((item) => !IMPLEMENTED_BROWSE_ROUTES.has(item.path)).map((item) => (
            <Route key={item.path} path={item.path} element={<HomeSectionPage title={item.label} />} />
        ))}
        {NAV_ITEMS.filter((item) => !IMPLEMENTED_BROWSE_ROUTES.has(item.path)).map((item) => (
            <Route key={`${item.path}-detail`} path={`${item.path}/:resourceId`} element={<HomeSectionPage title={item.label} />} />
        ))}
        <Route path="*" element={<NotFound />} />
    </Route>
);
