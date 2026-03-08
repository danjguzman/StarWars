import { Route } from "react-router-dom";
import HomeLayout, { HomePage, HomeSectionPage } from "@pages/Home";
import { navItems } from "@pages/Home/constants";
import PeoplePage from "@pages/People";

export const homeRoutes = (
    <Route element={<HomeLayout />}>
        <Route index element={<HomePage />} />
        <Route path="people" element={<PeoplePage />} />
        {navItems.filter((item) => item.path !== "people").map((item) => (
            <Route
                key={item.path}
                path={item.path}
                element={<HomeSectionPage title={item.label} />}
            />
        ))}
    </Route>
);
