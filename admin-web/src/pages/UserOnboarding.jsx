import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, FileSpreadsheet, ArrowRight, UserPlus, Info, Check, 
  Trash2, Plus, AlertCircle, ChevronRight, User 
} from 'lucide-react';
import api from '../services/api';

// --- CONFIGURATION: DROPDOWN OPTIONS ---
const CLASS_OPTIONS = ["9-A", "9-B", "10-A", "10-B", "11-Science", "11-Commerce", "12-Science", "12-Commerce"];
const SUBJECT_OPTIONS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "History", "Geography", "Computer Science", "Physical Education"];

const UserOnboarding = () => {
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('bulk');

  // --- STUDENT BULK STATE ---
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [mapping, setMapping] = useState({ name: '', mobile: '', className: '', rollNo: '' });
  const fileInputRef = useRef(null);

  // --- STUDENT SINGLE STATE ---
  const [studentForm, setStudentForm] = useState({ name: '', mobile: '', className: '', rollNo: '' });

  // --- TEACHER SINGLE STATE ---
  const [teacherForm, setTeacherForm] = useState({ name: '', mobile: '', classTeachership: '' });
  const [assignments, setAssignments] = useState([{ class: '', subject: '' }]);

  // --- HANDLERS: RESET & SWITCH ---
  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    // If Teacher, force 'single'. If Student, default to 'bulk'
    setMode(newRole === 'teacher' ? 'single' : 'bulk');
    
    // Reset all states
    setStep(1); setFileData([]); setFileName(''); setSelectedClass('');
    setStudentForm({ name: '', mobile: '', className: '', rollNo: '' });
    setTeacherForm({ name: '', mobile: '', classTeachership: '' });
    setAssignments([{ class: '', subject: '' }]);
  };

  // --- HANDLERS: BULK IMPORT ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if(data.length>0) { setFileHeaders(Object.keys(data[0])); setFileData(data); setStep(2); }
    };
    reader.readAsBinaryString(file);
  };

  const getCleanData = () => {
    return fileData.map((row, index) => {
      const userObj = {
        role: 'student',
        name: row[mapping.name],
        mobile: String(row[mapping.mobile] || '').replace(/[^0-9]/g, ''),
        className: selectedClass || row[mapping.className],
        rollNo: row[mapping.rollNo] || `T-${index+1}`,
      };
      const errors = [];
      if (!userObj.name) errors.push("Missing Name");
      if (!userObj.mobile || userObj.mobile.length < 10) errors.push("Invalid Mobile");
      if (!userObj.className) errors.push("Missing Class");
      userObj.errors = errors;
      userObj.isValid = errors.length === 0;
      return userObj;
    });
  };

  const handleBulkImport = async () => {
    const cleanData = getCleanData();
    const validUsers = cleanData.filter(u => u.isValid);
    if (validUsers.length === 0) return alert("No valid users to import.");
    try {
      await api.post('/admin/onboard-bulk', { users: validUsers });
      alert(`Success! Imported ${validUsers.length} students.`);
      setStep(1); setFileData([]); setFileName('');
    } catch (error) { alert("Error: " + (error.response?.data?.message || error.message)); }
  };

  // --- HANDLER: SINGLE STUDENT CREATE ---
  const handleCreateStudent = async () => {
    if(!studentForm.name || !studentForm.mobile || !studentForm.className || !studentForm.rollNo) {
      return alert("All fields are required for a student.");
    }
    try {
      await api.post('/admin/onboard', { role: 'student', ...studentForm });
      alert("Student Created Successfully!");
      setStudentForm({ name: '', mobile: '', className: '', rollNo: '' });
    } catch(e) { alert(e.message); }
  };
  
  // --- HANDLER: SINGLE TEACHER CREATE ---
  const handleCreateTeacher = async () => {
    if(!teacherForm.name || !teacherForm.mobile) return alert("Name/Mobile required");
    try {
        await api.post('/admin/onboard', { 
            role: 'teacher', 
            ...teacherForm, 
            assignments: assignments.filter(a => a.class && a.subject) 
        });
        alert("Teacher Created!");
        handleRoleSwitch('teacher');
    } catch(e) { alert(e.message); }
  };

  const cleanData = step === 3 ? getCleanData() : [];

  return (
    <div style={{ padding: '40px' }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <div>
          <h1>User Onboarding</h1>
          <p>Register new {role}s into the ecosystem.</p>
        </div>
        
        {/* Role Toggle */}
        <div style={{ background: '#e2e8f0', padding: '4px', borderRadius: '8px', display: 'flex' }}>
          {['student', 'teacher'].map(r => (
            <button 
              key={r} 
              onClick={() => handleRoleSwitch(r)} 
              style={{
                padding: '8px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontWeight: '600', fontSize: '13px',
                background: role === r ? 'white' : 'transparent',
                color: role === r ? 'var(--primary)' : '#64748b',
                boxShadow: role === r ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* MODE TABS (Only visible for Students) */}
      {role === 'student' ? (
        <div className="flex justify-center gap-6 mb-8 border-b border-slate-200">
          {['bulk', 'single'].map(m => (
            <button 
              key={m} 
              onClick={() => setMode(m)}
              style={{
                paddingBottom: '12px', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: '600', fontSize: '14px',
                color: mode === m ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: mode === m ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {m === 'single' ? 'Single Entry' : 'Bulk Import'}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-8 border-b border-slate-200 pb-3 text-center text-slate-400 font-medium text-sm">
          Teacher Registration Form
        </div>
      )}

      {/* ========================================================= */}
      {/* STUDENT BULK VIEW */}
      {/* ========================================================= */}
      {role === 'student' && mode === 'bulk' && (
        <div className="card">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
            <Step number={1} label="Upload" active={step >= 1} />
            <div className="h-0.5 bg-slate-200 flex-1 mx-4" />
            <Step number={2} label="Map Data" active={step >= 2} />
            <div className="h-0.5 bg-slate-200 flex-1 mx-4" />
            <Step number={3} label="Preview" active={step >= 3} />
          </div>

          {step === 1 && (
            <div className="max-w-xl mx-auto">
              <div className="mb-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <label className="mb-2 flex items-center gap-2">Target Class <span className="text-slate-400 font-normal">(Optional)</span></label>
                <select className="input-field" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="">-- Apply to all students in file --</option>
                  {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-2">If selected, we will ignore any "Class" column in your Excel file.</p>
              </div>
              <div onClick={() => fileInputRef.current.click()} className="cursor-pointer border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-indigo-50 hover:border-indigo-400 transition-colors">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Upload size={32} className="text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Upload Student Data</h3>
                <input type="file" hidden ref={fileInputRef} accept=".xlsx, .csv" onChange={handleFileUpload} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4 font-bold text-slate-700"><FileSpreadsheet className="text-green-600"/> {fileName}</div>
              <div className="table-wrapper mb-6">
                <table>
                  <thead><tr><th>Database Field</th><th>Mapping</th><th>Excel Header</th></tr></thead>
                  <tbody>
                    <MappingRow label="Full Name" value={mapping.name} onChange={v=>setMapping({...mapping, name:v})} options={fileHeaders} required />
                    <MappingRow label="Mobile" value={mapping.mobile} onChange={v=>setMapping({...mapping, mobile:v})} options={fileHeaders} required />
                    {!selectedClass && <MappingRow label="Class" value={mapping.className} onChange={v=>setMapping({...mapping, className:v})} options={fileHeaders} required />}
                    <MappingRow label="Roll No" value={mapping.rollNo} onChange={v=>setMapping({...mapping, rollNo:v})} options={fileHeaders} required />
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3">
                 <button className="btn" style={{border:'1px solid #e2e8f0'}} onClick={()=>setStep(1)}>Back</button>
                 <button className="btn btn-primary" onClick={()=>setStep(3)}>Next Step <ChevronRight size={16}/></button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="modern-table">
                  <thead><tr><th>Status</th><th>Name</th><th>Mobile</th><th>Class</th></tr></thead>
                  <tbody>
                    {cleanData.map((row, i) => (
                      <tr key={i} style={{ background: row.isValid ? 'transparent' : '#fff1f2' }}>
                        <td>{row.isValid ? <span style={{color:'green', fontWeight:'bold', fontSize:'12px'}}>Valid</span> : <span style={{color:'red', fontWeight:'bold', fontSize:'12px'}}>Invalid</span>}</td>
                        <td>{row.name}</td><td>{row.mobile}</td><td>{row.className}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                 <button className="btn btn-primary" onClick={handleBulkImport}><Check size={18}/> Confirm Import</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STUDENT SINGLE VIEW (NEW) */}
      {/* ========================================================= */}
      {role === 'student' && mode === 'single' && (
        <div className="card">
          <div className="mb-6 flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
               <User size={20} />
             </div>
             <div>
               <h3 className="text-sm font-bold text-slate-800 m-0">Single Student Registration</h3>
               <p className="text-xs text-slate-500 m-0">Create a student account manually.</p>
             </div>
          </div>

          <div className="grid-2 mb-6">
            <div>
              <label>Full Name <span className="text-red-500">*</span></label>
              <input 
                className="input-field" placeholder="e.g. Rahul Kumar"
                value={studentForm.name} 
                onChange={e => setStudentForm({...studentForm, name: e.target.value})}
              />
            </div>
            <div>
              <label>Parent Mobile (Login ID) <span className="text-red-500">*</span></label>
              <input 
                className="input-field" placeholder="98765 43210" maxLength={10}
                value={studentForm.mobile} 
                onChange={e => setStudentForm({...studentForm, mobile: e.target.value})}
              />
            </div>
            <div>
              <label>Class <span className="text-red-500">*</span></label>
              <select 
                className="input-field"
                value={studentForm.className}
                onChange={e => setStudentForm({...studentForm, className: e.target.value})}
              >
                <option value="">-- Select Class --</option>
                {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label>Roll Number <span className="text-red-500">*</span></label>
              <input 
                className="input-field" placeholder="e.g. 101"
                value={studentForm.rollNo} 
                onChange={e => setStudentForm({...studentForm, rollNo: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button className="btn btn-primary" onClick={handleCreateStudent}>
              <UserPlus size={18} /> Create Student
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TEACHER SINGLE VIEW */}
      {/* ========================================================= */}
      {role === 'teacher' && (
        <div className="card">
          <div className="grid-2 mb-6">
            <div>
              <label>Full Name <span className="text-red-500">*</span></label>
              <input 
                className="input-field" placeholder="e.g. Dr. A.P.J. Abdul"
                value={teacherForm.name} 
                onChange={e => setTeacherForm({...teacherForm, name: e.target.value})}
              />
            </div>
            <div>
              <label>Mobile Number (Login ID) <span className="text-red-500">*</span></label>
              <input 
                className="input-field" placeholder="98765 43210" maxLength={10}
                value={teacherForm.mobile} 
                onChange={e => setTeacherForm({...teacherForm, mobile: e.target.value})}
              />
            </div>
          </div>

          <div className="info-box mb-8">
            <Info className="text-indigo-600 flex-shrink-0" size={24} />
            <div className="flex-1">
              <label className="text-indigo-900 mb-1">Class Teachership (Optional)</label>
              <p className="text-indigo-700 text-sm mb-3">Is this teacher responsible for a specific class?</p>
              <select 
                className="input-field" 
                style={{ borderColor: '#c7d2fe', backgroundColor: '#eef2ff' }}
                value={teacherForm.classTeachership} 
                onChange={e => setTeacherForm({...teacherForm, classTeachership: e.target.value})}
              >
                <option value="">-- No Class Teachership --</option>
                {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-end mb-3">
              <label>Subject Assignments</label>
              <span className="text-xs text-slate-500">Assign classes and subjects</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Class</th>
                    <th style={{ width: '55%' }}>Subject</th>
                    <th style={{ width: '10%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assign, i) => (
                    <tr key={i}>
                      <td>
                        <select 
                          className="input-field"
                          value={assign.class}
                          onChange={(e) => {
                            const list = [...assignments]; list[i].class = e.target.value; setAssignments(list);
                          }}
                        >
                          <option value="">-- Select Class --</option>
                          {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td>
                        <select 
                          className="input-field"
                          value={assign.subject}
                          onChange={(e) => {
                            const list = [...assignments]; list[i].subject = e.target.value; setAssignments(list);
                          }}
                        >
                          <option value="">-- Select Subject --</option>
                          {SUBJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                      <td className="text-center">
                        {assignments.length > 1 && (
                          <button 
                            onClick={() => { const list = [...assignments]; list.splice(i, 1); setAssignments(list); }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              onClick={() => setAssignments([...assignments, { class: '', subject: '' }])}
              className="btn btn-dashed mt-3"
            >
              <Plus size={16} /> Add Another Subject
            </button>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button className="btn btn-primary" onClick={handleCreateTeacher}>
              <UserPlus size={18} /> Create Teacher Account
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// --- HELPER COMPONENTS ---
const Step = ({ number, label, active }) => (
  <div className="flex items-center gap-3">
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: active ? 'var(--primary)' : '#f1f5f9',
      color: active ? 'white' : '#94a3b8',
      fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {number}
    </div>
    <span style={{ fontWeight: '600', color: active ? '#0f172a' : '#94a3b8' }}>{label}</span>
  </div>
);

const MappingRow = ({ label, value, onChange, options, required }) => (
  <tr>
    <td className="font-medium text-slate-700">{label} {required && <span className="text-red-500">*</span>}</td>
    <td className="text-slate-400 text-center"><ArrowRight size={16}/></td>
    <td>
      <select className="input-field" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">-- Select Column --</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </td>
  </tr>
);

export default UserOnboarding;