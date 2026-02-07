import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import UserOnboarding from './pages/UserOnboarding';
import Registry from './pages/Registry';
import StudentDetail from './pages/StudentDetail';
import TeacherDetail from './pages/TeacherDetail';
import FeeDashboard from './pages/FeeDashboard'; // Imported

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
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<Navigate to="/registry" />} />
        
        <Route path="/onboard" element={
          <ProtectedRoute><AdminLayout><UserOnboarding /></AdminLayout></ProtectedRoute>
        } />
        
        <Route path="/registry" element={
          <ProtectedRoute><AdminLayout><Registry /></AdminLayout></ProtectedRoute>
        } />

        {/* --- FEE DASHBOARD ROUTE --- */}
        <Route path="/feedashboard" element={
          <ProtectedRoute><AdminLayout><FeeDashboard /></AdminLayout></ProtectedRoute>
        } />

        {/* --- DETAIL ROUTES --- */}
        <Route path="/student/:id" element={
          <ProtectedRoute><AdminLayout><StudentDetail /></AdminLayout></ProtectedRoute>
        } />
        
        <Route path="/teacher/:id" element={
          <ProtectedRoute><AdminLayout><TeacherDetail /></AdminLayout></ProtectedRoute>
        } />
        
      </Routes>
    </Router>
  );
}

export default App;