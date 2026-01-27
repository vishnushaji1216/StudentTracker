import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import UserOnboarding from './pages/UserOnboarding';

const AdminLayout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-body)' }}>
    <Sidebar />
    <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1 }}>
      {children}
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/onboard" />} />
        <Route path="/onboard" element={<AdminLayout><UserOnboarding /></AdminLayout>} />
      </Routes>
    </Router>
  );
}

export default App;