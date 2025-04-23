import React from "react";
import type { UserRecord as User } from "@shared/types";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AdminDashboard as AdminDashboardComponent } from "@/components/admin";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  // This page now just wraps the component in the DashboardLayout
  return (
    <DashboardLayout title="Admin Dashboard" user={user}>
      <AdminDashboardComponent user={user} />
    </DashboardLayout>
  );
};

export default AdminDashboard;