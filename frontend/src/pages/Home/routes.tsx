import { Route } from "react-router-dom";
import NotFound from "@components/NotFound";
import HomeLayout, { HomePage, HomeSectionPage } from "@pages/Home";
import PeoplePage from "@pages/People";
import { NAV_ITEMS } from "@utils/consts";

export const homeRoutes = (
    <Route element={<HomeLayout />}>
        <Route index element={<HomePage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="people/:personId" element={<PeoplePage />} />
        {NAV_ITEMS.filter((item) => item.path !== "people").map((item) => (
            <Route key={item.path} path={item.path} element={<HomeSectionPage title={item.label} />} />
        ))}
        {NAV_ITEMS.filter((item) => item.path !== "people").map((item) => (
            <Route key={`${item.path}-detail`} path={`${item.path}/:resourceId`} element={<HomeSectionPage title={item.label} />} />
        ))}
        <Route path="*" element={<NotFound />} />
    </Route>
);
