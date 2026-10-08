import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import DashboardLayout from "../components/layout/DashboardLayout";
import Dashboard from "../dashboard/Dashboard";


export default function AppRoutes(){

  return (

    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />


      <Route
        path="/dashboard"
        element={
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        }
      />


    </Routes>

  );

}
