import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import UserOnboarding from './pages/UserOnboarding';
import Login from './pages/Login'; // Import the new page

// Layout Wrapper
const AdminLayout = ({ children }) => (
  <div className="app-container">
    <Sidebar />
    <main className="main-content">
      {children}
    </main>
  </div>
);

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // Simple check: If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout>
               {/* Dashboard Placeholder */}
               <div className="p-10 font-bold text-2xl">Dashboard Overview</div>
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/onboard" element={
          <ProtectedRoute>
            <AdminLayout>
              <UserOnboarding />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        {/* Redirect Root */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;