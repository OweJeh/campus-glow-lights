import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const isAuthenticated = sessionStorage.getItem("admin_auth") === "true";

    if (!isAuthenticated) {
        return <Navigate to="/admin-login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
