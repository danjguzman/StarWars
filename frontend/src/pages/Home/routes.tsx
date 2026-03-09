import { Route } from "react-router-dom";
import HomeLayout, { HomePage, HomeSectionPage, NotFoundPage } from "@pages/Home";
import LegacyPersonRedirect from "@pages/People/LegacyPersonRedirect";
import PeoplePage from "@pages/People";
import { navItems } from "@pages/Home/constants";

export const homeRoutes = (
    <Route element={<HomeLayout />}>
        <Route index element={<HomePage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="people/:personId" element={<PeoplePage />} />
        <Route path="person/:personId" element={<LegacyPersonRedirect />} />
        {navItems.filter((item) => item.path !== "people").map((item) => (
            <Route key={item.path} path={item.path} element={<HomeSectionPage title={item.label} />} />
        ))}
        {navItems.filter((item) => item.path !== "people").map((item) => (
            <Route key={`${item.path}-detail`} path={`${item.path}/:resourceId`} element={<HomeSectionPage title={item.label} />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
    </Route>
);
