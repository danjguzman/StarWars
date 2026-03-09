import { Navigate, useParams } from "react-router-dom";

export default function LegacyPersonRedirect() {
    const { personId } = useParams<{ personId?: string }>();
    return <Navigate to={personId ? `/people/${personId}` : "/people"} replace />;
}
