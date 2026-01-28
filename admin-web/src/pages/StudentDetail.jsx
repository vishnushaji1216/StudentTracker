import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, ArrowLeft, Printer, User, Phone, MapPin } from 'lucide-react';
import api from '../services/api';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState({ overall: "0%", subjectPerformance: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', className: '' });

  // Dummy Fees
  const dummyFees = {
    total: 25000, paid: 15000, pending: 10000,
    history: [
      { id: 1, date: "10 Jan 2025", amount: 5000, mode: "Cash", receipt: "REC-001" },
      { id: 2, date: "15 Dec 2024", amount: 10000, mode: "UPI", receipt: "REC-892" },
    ]
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/student/${id}`);
        setStudent(res.data.student);
        setStats(res.data.stats);
        setEditForm({ name: res.data.student.name, mobile: res.data.student.mobile, className: res.data.student.className });
      } catch (error) { alert("Error fetching data"); } finally { setLoading(false); }
    };
    fetchDetail();
  }, [id]);

  const handleUpdate = async () => {
    try {
      await api.put(`/admin/student/${id}`, editForm);
      setStudent({ ...student, ...editForm });
      setIsEditing(false);
      alert("Profile Updated!");
    } catch (error) { alert("Update failed"); }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Profile...</div>;
  if (!student) return <div className="p-10 text-center text-red-500">Student not found</div>;

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn hover:bg-white bg-white border border-slate-200" style={{ padding: 10, borderRadius: '50%' }}>
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: 24, margin: 0, color: '#1e293b' }}>{student.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
               <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-xs font-bold text-slate-600">Class {student.className}</span>
               <span>Roll No: #{student.rollNo}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
           {!isEditing ? (
             <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
               <Edit2 size={16} /> Edit Profile
             </button>
           ) : (
             <>
               <button className="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setIsEditing(false)}>Cancel</button>
               <button className="btn btn-primary" onClick={handleUpdate}><Save size={16} /> Save</button>
             </>
           )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* ROW 1: PROFILE (LEFT) + ACADEMICS (RIGHT) */}
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
          
          {/* 1. STUDENT PROFILE CARD */}
          <div className="card h-full">
            <h3 className="mb-6 text-slate-800 flex items-center gap-2">
              <User size={20} className="text-indigo-500" /> Personal Details
            </h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Full Name</label>
                {isEditing ? (
                  <input className="input-field" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                ) : (
                  <div className="text-slate-700 font-medium text-base">{student.name}</div>
                )}
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Class</label>
                  {isEditing ? (
                    <select className="input-field" value={editForm.className} onChange={e => setEditForm({...editForm, className: e.target.value})}>
                      {["9-A", "9-B", "10-A", "10-B"].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <div className="text-slate-700 font-medium">{student.className}</div>
                  )}
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Roll No</label>
                   <div className="text-slate-700 font-medium">#{student.rollNo}</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Parent Mobile (Login ID)</label>
                {isEditing ? (
                  <input className="input-field" value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} />
                ) : (
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Phone size={16} className="text-slate-400"/> {student.mobile}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. ACADEMIC PERFORMANCE CARD */}
          <div className="card h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="m-0 text-slate-800 flex items-center gap-2">
                 <Printer size={20} className="text-indigo-500" /> Academic Performance
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${parseInt(stats.overall) > 75 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                Avg: {stats.overall}
              </span>
            </div>

            {stats.subjectPerformance.length > 0 ? (
              <div className="flex flex-col gap-4">
                {stats.subjectPerformance.map((subj, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-24 text-sm font-semibold text-slate-500">{subj.subject}</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full mx-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${subj.score}%`, 
                          background: subj.score >= 80 ? '#10b981' : subj.score >= 50 ? '#f59e0b' : '#ef4444' 
                        }}
                      />
                    </div>
                    <div className="text-xs font-bold w-8 text-right text-slate-600">{subj.score}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">No graded submissions yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: FEES (BOTTOM FULL WIDTH) */}
        <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-800 m-0">💰 Fee Dashboard</h3>
              <button className="btn btn-primary" style={{ width: 'auto' }}>+ Record Payment</button>
            </div>
            
            {/* --- FEE CARDS (CENTERED) --- */}
            <div className="grid-2 mb-8" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              
              <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Fees</div>
                <div className="text-3xl font-bold text-slate-800">₹{dummyFees.total.toLocaleString()}</div>
              </div>
              
              <div className="p-6 border border-green-200 rounded-xl bg-green-50 flex flex-col items-center justify-center text-center">
                <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">Paid</div>
                <div className="text-3xl font-bold text-green-700">₹{dummyFees.paid.toLocaleString()}</div>
              </div>
              
              <div className="p-6 border border-red-200 rounded-xl bg-red-50 flex flex-col items-center justify-center text-center">
                <div className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1">Pending Due</div>
                <div className="text-3xl font-bold text-red-600">₹{dummyFees.pending.toLocaleString()}</div>
              </div>

            </div>

            {/* --- TRANSACTION TABLE (CENTERED) --- */}
            <div>
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Transaction History</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-3 border-b border-slate-200 text-slate-500 font-semibold text-center">Date</th>
                      <th className="p-3 border-b border-slate-200 text-slate-500 font-semibold text-center">Amount</th>
                      <th className="p-3 border-b border-slate-200 text-slate-500 font-semibold text-center">Mode</th>
                      <th className="p-3 border-b border-slate-200 text-slate-500 font-semibold text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dummyFees.history.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 border-b border-slate-100 text-slate-600 text-center">{tx.date}</td>
                        <td className="p-3 border-b border-slate-100 font-bold text-slate-800 text-center">₹{tx.amount.toLocaleString()}</td>
                        <td className="p-3 border-b border-slate-100 text-center">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{tx.mode}</span>
                        </td>
                        <td className="p-3 border-b border-slate-100 font-mono text-xs text-slate-400 text-center">{tx.receipt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDetail;