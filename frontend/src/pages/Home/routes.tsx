import { Route } from "react-router-dom";
import HomeLayout, { HomePage, HomeSectionPage, navItems } from "./index";

export const homeRoutes = (
    <Route element={<HomeLayout />}>
        <Route index element={<HomePage />} />
        {navItems.map((item) => (
            <Route
                key={item.path}
                path={item.path}
                element={<HomeSectionPage title={item.label} />}
            />
        ))}
    </Route>
);
