import React from 'react';
import { Helmet } from 'react-helmet';

const AdminTools: React.FC = () => {
  // Redirect to the AdminDashboard page
  // This is a simpler approach than rebuilding the missing AdminPanel component
  React.useEffect(() => {
    window.location.href = '/admin-dashboard';
  }, []);
  
  return (
    <>
      <Helmet>
        <title>Admin Tools - GRE Prep</title>
      </Helmet>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">Redirecting to Admin Dashboard...</h1>
        <p className="mt-2">Please wait while we redirect you to the new admin interface.</p>
      </div>
    </>
  );
};

export default AdminTools;