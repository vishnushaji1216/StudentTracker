import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, BookOpen, Star, Phone } from 'lucide-react';
import api from '../services/api';

const CLASS_OPTIONS = ["9-A", "9-B", "10-A", "10-B", "11-Science", "11-Commerce"];

const Registry = () => {
  const navigate = useNavigate();
  
  // 1. INITIALIZE STATE FROM SESSION STORAGE (Preserves state on back button)
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('reg_tab') || 'teachers');
  const [selectedClass, setSelectedClass] = useState(() => sessionStorage.getItem('reg_class') || '');
  const [search, setSearch] = useState(() => sessionStorage.getItem('reg_search') || '');
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 2. SAVE STATE ON CHANGE
  useEffect(() => {
    sessionStorage.setItem('reg_tab', activeTab);
    sessionStorage.setItem('reg_class', selectedClass);
    sessionStorage.setItem('reg_search', search);
  }, [activeTab, selectedClass, search]);

  // --- FETCH LOGIC ---
  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = activeTab === 'teachers' ? '/admin/teachers' : '/admin/students';
      let params = {};

      if (activeTab === 'teachers') {
        if (search) params.search = search;
      } else {
        if (selectedClass) params.className = selectedClass;
        if (search) params.search = search;
      }

      const res = await api.get(endpoint, { params });
      setData(res.data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchData(); }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, selectedClass, search]);

  return (
    <div style={{ padding: '40px' }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 max-w-6xl mx-auto">
        <div>
          <h1>Registry</h1>
          <p>Manage and view all registered members.</p>
        </div>
        
        {/* TABS */}
        <div style={{ background: '#e2e8f0', padding: 4, borderRadius: 8, display: 'flex' }}>
          {['teachers', 'students'].map(tab => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab); setSearch(''); setSelectedClass(''); }}
              style={{
                padding: '8px 24px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13,
                background: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? '#4f46e5' : '#64748b',
                boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card mb-8 max-w-6xl mx-auto" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            className="input-field" 
            style={{ paddingLeft: 40 }}
            placeholder={`Search ${activeTab} by name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {activeTab === 'students' && (
          <div style={{ minWidth: 200 }}>
            <select 
              className="input-field" 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">-- All Classes --</option>
              {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* RESULTS GRID */}
      {loading ? (
        <div className="text-center p-10 text-slate-500">Loading registry...</div>
      ) : (
        <div className="max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          
          {data.length === 0 && (
             <div className="text-center p-10 text-slate-400 col-span-full border-2 border-dashed border-slate-200 rounded-xl">
               No records found.
             </div>
          )}

          {activeTab === 'teachers' && data.map(t => (
            <div 
              key={t._id} 
              className="card hover:shadow-lg transition-all"
              onClick={() => navigate(`/teacher/${t._id}`)}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div className="flex items-center gap-4">
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, margin: 0 }}>{t.name}</h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{t.teacherCode}</span>
                </div>
              </div>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                <div className="flex items-center gap-2 mb-2 text-slate-700">
                  <Star size={14} className="text-indigo-600"/> <strong>{t.roleDisplay}</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <BookOpen size={14} className="text-indigo-600"/> Subject: {t.mainSubject}
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'students' && data.map(s => (
            <div 
              key={s._id} 
              className="card hover:shadow-lg transition-all"
              onClick={() => navigate(`/student/${s._id}`)}
              style={{ padding: '24px', cursor: 'pointer' }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20}/>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, margin: 0 }}>{s.name}</h3>
                    <span style={{ fontSize: 12, background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                      {s.className}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-400">#{s.rollNo}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 6, fontSize: '13px', color: '#475569', display:'flex', alignItems:'center', gap:'6px' }}>
                 <Phone size={12} /> {s.parentMobile}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default Registry;    