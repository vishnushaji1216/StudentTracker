import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, ArrowRight, UserPlus, Info } from 'lucide-react';
import api from '../services/api';

const UserOnboarding = () => {
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('bulk');
  const [step, setStep] = useState(1);
  
  const [fileData, setFileData] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  
  const [mapping, setMapping] = useState({ name: '', mobile: '', className: '', rollNo: '', subject: '' });
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      if (data.length > 0) {
        setFileHeaders(Object.keys(data[0]));
        setFileData(data);
        setStep(2);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImport = async () => {
    // ... (Same Logic as before) ...
    const cleanData = fileData.map(row => {
      const userObj = { role, name: row[mapping.name], mobile: row[mapping.mobile] };
      if (role === 'student') { userObj.className = row[mapping.className]; userObj.rollNo = row[mapping.rollNo]; }
      else { userObj.subject = row[mapping.subject]; }
      return userObj;
    });

    try {
      await api.post('/admin/onboard-bulk', { users: cleanData });
      alert(`Success! Imported ${cleanData.length} users.`);
      setStep(1); setFileData([]);
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  // Styles object for cleaner JSX
  const styles = {
    header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' },
    roleToggle: { background: '#e2e8f0', padding:'4px', borderRadius:'8px', display:'flex' },
    roleBtn: (isActive) => ({
      padding: '8px 24px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:'600',
      background: isActive ? 'white' : 'transparent', color: isActive ? 'var(--primary)' : 'var(--text-muted)',
      boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
    }),
    uploadBox: {
      border: '2px dashed #cbd5e1', borderRadius:'12px', padding:'48px',
      textAlign:'center', cursor:'pointer', background: '#f8fafc', color: 'var(--text-muted)'
    },
    tableHeader: { textAlign:'left', padding:'12px', borderBottom:'1px solid var(--border)', fontSize:'12px', color:'var(--text-muted)', textTransform:'uppercase' }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>User Onboarding</h1>
          <p style={{ color: 'var(--text-muted)' }}>Add new {role}s to the system.</p>
        </div>
        <div style={styles.roleToggle}>
          {['student', 'teacher'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={styles.roleBtn(role === r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'24px', borderBottom:'1px solid var(--border)', marginBottom:'32px' }}>
        {['single', 'bulk'].map(m => (
          <button 
            key={m} onClick={() => setMode(m)}
            style={{ 
              paddingBottom:'12px', border: 'none', background:'none', cursor:'pointer',
              fontWeight:'600', color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: mode === m ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            {m === 'single' ? 'Single Entry' : 'Bulk Import'}
          </button>
        ))}
      </div>

      {/* Bulk Import View */}
      {mode === 'bulk' && (
        <div className="card" style={{ minHeight: '400px' }}>
          
          {step === 1 && (
            <div style={styles.uploadBox} onClick={() => fileInputRef.current.click()}>
              <Upload size={40} style={{ color: 'var(--primary)', marginBottom:'16px' }} />
              <h3>Click to upload Excel Sheet</h3>
              <input type="file" hidden ref={fileInputRef} accept=".xlsx, .csv" onChange={handleFileUpload} />
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom:'24px' }}>
                <div className="flex items-center gap-2" style={{ fontWeight:'600' }}>
                  <FileSpreadsheet color="green" /> {fileName}
                </div>
                <button onClick={() => setStep(1)} style={{ background:'none', border:'none', color:'red', cursor:'pointer' }}>Change File</button>
              </div>

              <div style={{ background:'#fffbeb', padding:'12px', borderRadius:'8px', fontSize:'13px', color:'#92400e', marginBottom:'24px', display:'flex', gap:'8px' }}>
                <Info size={16} /> Map your Excel columns (Right) to Database fields (Left).
              </div>

              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Database Field</th>
                    <th style={styles.tableHeader}></th>
                    <th style={styles.tableHeader}>Excel Header</th>
                  </tr>
                </thead>
                <tbody>
                  <MappingRow label="Full Name" value={mapping.name} onChange={v => setMapping({...mapping, name: v})} options={fileHeaders} required />
                  <MappingRow label="Mobile (Login ID)" value={mapping.mobile} onChange={v => setMapping({...mapping, mobile: v})} options={fileHeaders} required />
                  {role === 'student' && (
                    <>
                      <MappingRow label="Class ID" value={mapping.className} onChange={v => setMapping({...mapping, className: v})} options={fileHeaders} required />
                      <MappingRow label="Roll Number" value={mapping.rollNo} onChange={v => setMapping({...mapping, rollNo: v})} options={fileHeaders} required />
                    </>
                  )}
                </tbody>
              </table>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:'12px', marginTop:'32px' }}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkImport}> <UserPlus size={18} /> Import {fileData.length} Users</button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'single' && <div className="card"><p style={{textAlign:'center', color:'var(--text-muted)'}}>Single Entry Form (Existing Feature)</p></div>}
    </div>
  );
};

const MappingRow = ({ label, value, onChange, options, required }) => (
  <tr style={{ borderBottom:'1px solid #f1f5f9' }}>
    <td style={{ padding:'16px', fontSize:'14px', fontWeight:'500' }}>
      {label} {required && <span style={{ color:'red' }}>*</span>}
    </td>
    <td style={{ textAlign:'center', color:'var(--border)' }}><ArrowRight size={16} /></td>
    <td style={{ padding:'16px' }}>
      <select className="input-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- Select --</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </td>
  </tr>
);

export default UserOnboarding;