import { Route } from "react-router-dom";
import HomeLayout, { HomePage, NotFoundPage } from "@pages/Home";
import PeoplePage from "@pages/People";

export const homeRoutes = (
    <Route element={<HomeLayout />}>
        <Route index element={<HomePage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="person/:personId" element={<PeoplePage />} />
        <Route path="*" element={<NotFoundPage />} />
    </Route>
);
