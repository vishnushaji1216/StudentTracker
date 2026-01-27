import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Users, FileText, LogOut, Settings } from 'lucide-react';
import '../index.css';

const Sidebar = () => {
  // Inline styles for specific layout needs
  const styles = {
    sidebar: {
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'white',
      borderRight: '1px solid var(--border)',
      position: 'fixed',
      left: 0, top: 0,
      display: 'flex', flexDirection: 'column',
      padding: '24px'
    },
    logo: {
      color: 'var(--primary)',
      fontSize: '20px', fontWeight: 'bold',
      display: 'flex', alignItems: 'center', gap: '10px',
      marginBottom: '40px'
    },
    link: (isActive) => ({
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '4px',
      textDecoration: 'none',
      fontSize: '14px', fontWeight: '500',
      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
      background: isActive ? 'var(--primary-light)' : 'transparent',
      transition: '0.2s'
    })
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={{ background: 'var(--primary)', color:'white', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center'}}>S</div>
        Stella Admin
      </div>

      <nav style={{ flex: 1 }}>
        <NavLink to="/" style={({isActive}) => styles.link(isActive)}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/onboard" style={({isActive}) => styles.link(isActive)}>
          <UserPlus size={20} /> Onboard Users
        </NavLink>
        <NavLink to="/registry" style={({isActive}) => styles.link(isActive)}>
          <Users size={20} /> Registry
        </NavLink>
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <button style={{ ...styles.link(false), width: '100%', border:'none', cursor:'pointer', color: 'var(--danger)' }} onClick={handleLogout}>
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;