import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface TechProtectedRouteProps {
    children: ReactNode;
}

const TechProtectedRoute = ({ children }: TechProtectedRouteProps) => {
    const isAuthenticated = sessionStorage.getItem("tech_auth") === "true";

    if (!isAuthenticated) {
        return <Navigate to="/tech-login" replace />;
    }

    return <>{children}</>;
};

export default TechProtectedRoute;
