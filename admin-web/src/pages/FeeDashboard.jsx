import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, CheckCircle, AlertCircle, Search, 
  ArrowRight, Users, Phone, Lock 
} from 'lucide-react';
import api from '../services/api';

const FeeDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [summary, setSummary] = useState({ totalExpected: 0, totalCollected: 0, totalPending: 0 });
  const [defaulters, setDefaulters] = useState([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/fees/dashboard');
      setSummary(res.data.summary);
      setDefaulters(res.data.defaulters);
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredDefaulters = defaulters.filter(d => 
    d.name.toLowerCase().includes(filterText.toLowerCase()) || 
    d.className.toLowerCase().includes(filterText.toLowerCase()) ||
    d.grNumber.toLowerCase().includes(filterText.toLowerCase())
  );

  // --- STYLES ---
  const cardStyle = { backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', flex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
  const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' };
  const valueStyle = { fontSize: '32px', fontWeight: 'bold', color: '#1e293b', lineHeight: 1 };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Financial Data...</div>;

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. HEADER & METRICS */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '32px' }}>Fee Overview</h1>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
          
          {/* Card 1: Total Expected */}
          <div style={cardStyle}>
            <div style={labelStyle}><TrendingUp size={16} /> Total Expected Revenue</div>
            <div style={valueStyle}>₹{summary.totalExpected.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>Academic Year 2024-25</div>
          </div>

          {/* Card 2: Collected */}
          <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>
            <div style={{ ...labelStyle, color: '#059669' }}><CheckCircle size={16} /> Collected Amount</div>
            <div style={{ ...valueStyle, color: '#047857' }}>₹{summary.totalCollected.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: '#10b981', marginTop: '8px', fontWeight: '500' }}>
              {summary.totalExpected > 0 ? Math.round((summary.totalCollected / summary.totalExpected) * 100) : 0}% of target
            </div>
          </div>

          {/* Card 3: Pending */}
          <div style={{ ...cardStyle, borderLeft: '4px solid #ef4444' }}>
            <div style={{ ...labelStyle, color: '#dc2626' }}><AlertCircle size={16} /> Outstanding Dues</div>
            <div style={{ ...valueStyle, color: '#b91c1c' }}>₹{summary.totalPending.toLocaleString()}</div>
            <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '8px', fontWeight: '500' }}>
              From {defaulters.length} students
            </div>
          </div>

        </div>

        {/* 2. DEFAULTERS LIST SECTION */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          
          {/* Table Header / Toolbar */}
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Users size={18} className="text-indigo-500" /> Defaulters List
            </h3>
            
            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                placeholder="Search name, class..." 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{ 
                  padding: '10px 16px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', width: '250px', backgroundColor: '#f8fafc' 
                }} 
              />
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Student Name</th>
                <th style={{ padding: '16px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Class</th>
                <th style={{ padding: '16px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Contact</th>
                <th style={{ padding: '16px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Total Due</th>
                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDefaulters.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No defaulters found matching your search.</td></tr>
              ) : filteredDefaulters.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }} className="hover:bg-slate-50">
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{d.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>GR: {d.grNumber}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: '600', color: '#475569', fontSize: '12px' }}>
                      {d.className}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="#94a3b8" /> {d.parentMobile}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {d.isLocked ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                        <Lock size={12} /> App Locked
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff7ed', color: '#ea580c', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                        Active
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>
                    ₹{d.totalDue.toLocaleString()}
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>{d.pendingCount} Pending Items</div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <button 
                      onClick={() => navigate(`/student/${d.id}`)}
                      style={{ 
                        backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', 
                        padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: '#4f46e5',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      View Profile <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default FeeDashboard;