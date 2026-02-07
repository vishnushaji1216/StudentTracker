import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit2, Save, ArrowLeft, Printer, User, Phone, 
  Lock, Unlock, Plus, CreditCard, History 
} from 'lucide-react';
import api from '../services/api';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // --- STATE ---
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [feeSummary, setFeeSummary] = useState({ total: 0, paid: 0, pending: 0 });
  const [stats, setStats] = useState({ overall: "0%", subjectPerformance: [] });
  
  // Derived State for History
  const [transactionHistory, setTransactionHistory] = useState([]);

  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', className: '', rollNo: '' });
  
  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState(''); 

  // Forms
  const [assignForm, setAssignForm] = useState({ title: '', amount: '', dueDate: '', remarks: '' });
  const [payForm, setPayForm] = useState({ amount: '', mode: 'Cash', note: '' });

  // --- 1. DATA FETCHING ---
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const studentRes = await api.get(`/admin/student/${id}`);
      setStudent(studentRes.data.identity);
      setStats({
          overall: studentRes.data.metrics.avgScore, 
          subjectPerformance: studentRes.data.subjects.map(sub => ({
              subject: sub.name, score: sub.score
          }))
      });
      setEditForm({ 
          name: studentRes.data.identity.name, 
          mobile: studentRes.data.identity.mobile, 
          className: studentRes.data.identity.className,
          rollNo: studentRes.data.identity.rollNo 
      });

      const feesRes = await api.get(`/admin/fees/student/${id}`);
      const fetchedFees = feesRes.data.fees;
      setFees(fetchedFees);
      calculateSummary(fetchedFees);
      processHistory(fetchedFees); // <--- Process History Here

    } catch (error) { 
      console.error("Fetch Error:", error);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  // --- HELPERS ---
  const calculateSummary = (feeList) => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    feeList.forEach(f => {
      total += f.totalAmount;
      paid += f.paidAmount;
      pending += f.remainingAmount;
    });
    setFeeSummary({ total, paid, pending });
  };

  // Extract all transactions from all fees into one sorted list
  const processHistory = (feeList) => {
      const allTx = [];
      feeList.forEach(fee => {
          if (fee.transactions && fee.transactions.length > 0) {
              fee.transactions.forEach(tx => {
                  allTx.push({
                      ...tx,
                      feeTitle: fee.title, // Add context
                      feeId: fee._id
                  });
              });
          }
      });
      // Sort Newest First
      allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactionHistory(allTx);
  };

  // --- HANDLERS ---
  const handleProfileUpdate = async () => {
    try {
      await api.put(`/admin/student/${id}`, editForm);
      setStudent({ ...student, ...editForm });
      setIsEditing(false);
      alert("Profile Updated!");
    } catch (error) { alert("Update failed"); }
  };

  const handleToggleLock = async () => {
    try {
      const newStatus = !student.isFeeLocked;
      await api.post('/admin/fees/lock', {
        studentId: id,
        lockStatus: newStatus,
        reason: newStatus ? "Manual Admin Lock" : ""
      });
      setStudent({ ...student, isFeeLocked: newStatus });
    } catch (error) { alert("Failed to toggle lock"); }
  };

  const handleAssignFee = async () => {
    try {
      await api.post('/admin/fees/assign', {
        studentId: id,
        ...assignForm
      });
      setShowAssignModal(false);
      setAssignForm({ title: '', amount: '', dueDate: '', remarks: '' });
      fetchAllData(); 
    } catch (error) { alert("Failed to assign fee"); }
  };

  const handleRecordPayment = async () => {
    if (!selectedFeeId) return alert("Please select a fee");
    try {
      await api.post('/admin/fees/pay', {
        feeId: selectedFeeId,
        ...payForm
      });
      setShowPayModal(false);
      setPayForm({ amount: '', mode: 'Cash', note: '' });
      setSelectedFeeId('');
      fetchAllData(); 
      if (student.isFeeLocked) setStudent(prev => ({ ...prev, isFeeLocked: false }));
    } catch (error) { alert(error.response?.data?.message || "Payment failed"); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Profile...</div>;
  if (!student) return <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Student not found</div>;

  // --- STYLES ---
  const sectionTitleStyle = { fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' };
  const labelStyle = { fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' };
  const valueStyle = { fontSize: '1rem', fontWeight: '500', color: '#334155' };
  const cardStyle = { backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: '100%' };

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 32px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate(-1)} className="btn" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color="#64748b" />
          </button>
          
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
            {student.name.charAt(0)}
          </div>
          
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0, lineHeight: 1.2 }}>{student.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '14px', color: '#64748b' }}>
               <span style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', color: '#475569' }}>Class {student.className}</span>
               <span>Roll No: <b>#{student.rollNo}</b></span>
               <span style={{ height: '14px', width: '1px', backgroundColor: '#cbd5e1' }}></span>
               <span>GR: <b>{student.grNumber}</b></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <button 
             onClick={handleToggleLock}
             style={{
               display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', border: '1px solid', cursor: 'pointer',
               backgroundColor: student.isFeeLocked ? '#fef2f2' : '#f0fdf4',
               borderColor: student.isFeeLocked ? '#fecaca' : '#bbf7d0',
               color: student.isFeeLocked ? '#dc2626' : '#16a34a'
             }}
           >
             {student.isFeeLocked ? <Lock size={16} /> : <Unlock size={16} />}
             {student.isFeeLocked ? "APP LOCKED" : "ACTIVE"}
           </button>

           {!isEditing ? (
             <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsEditing(true)}>
               <Edit2 size={16} /> Edit Profile
             </button>
           ) : (
             <div style={{ display: 'flex', gap: '8px' }}>
               <button className="btn" style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#475569' }} onClick={() => setIsEditing(false)}>Cancel</button>
               <button className="btn btn-primary" onClick={handleProfileUpdate}><Save size={16} /> Save</button>
             </div>
           )}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* PERSONAL DETAILS CARD */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>
            <User size={20} color="#4f46e5" /> Personal Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              {isEditing ? (
                <input className="input-field" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%' }} />
              ) : <div style={valueStyle}>{student.name}</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Class</label>
                {isEditing ? (
                  <select className="input-field" value={editForm.className} onChange={e => setEditForm({...editForm, className: e.target.value})} style={{ width: '100%' }}>
                    {["8-A", "8-B", "9-A", "9-B", "10-A"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : <div style={valueStyle}>{student.className}</div>}
              </div>
              <div>
                 <label style={labelStyle}>Roll No</label>
                 {isEditing ? (
                   <input className="input-field" value={editForm.rollNo} onChange={e => setEditForm({...editForm, rollNo: e.target.value})} style={{ width: '100%' }} />
                 ) : <div style={valueStyle}>#{student.rollNo}</div>}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Parent Mobile</label>
              {isEditing ? (
                <input className="input-field" value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} style={{ width: '100%' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...valueStyle }}>
                  <Phone size={16} color="#94a3b8"/> {student.mobile}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACADEMIC CARD */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>
               <Printer size={20} color="#4f46e5" /> Academic Performance
            </h3>
            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: parseInt(stats.overall) > 75 ? '#dcfce7' : '#fef9c3', color: parseInt(stats.overall) > 75 ? '#15803d' : '#854d0e' }}>
              Avg: {stats.overall}
            </span>
          </div>
          {stats.subjectPerformance.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stats.subjectPerformance.map((subj, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '80px', fontSize: '14px', fontWeight: '600', color: '#64748b' }}>{subj.subject}</div>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', margin: '0 12px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '4px', width: `${subj.score}%`, backgroundColor: subj.score >= 80 ? '#10b981' : subj.score >= 50 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>{subj.score}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '8px', color: '#94a3b8' }}>
              No graded submissions yet.
            </div>
          )}
        </div>

        {/* FEE DASHBOARD (Spans 2 columns) */}
        <div style={{ gridColumn: 'span 2', ...cardStyle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ ...sectionTitleStyle, marginBottom: 0 }}>💰 Fee Dashboard</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                 <button className="btn" style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowAssignModal(true)}>
                    <Plus size={16} /> Assign Fee
                 </button>
                 <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setSelectedFeeId(''); setShowPayModal(true); }}>
                    <CreditCard size={16} /> Record Payment
                 </button>
              </div>
            </div>
            
            {/* SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Assigned</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginTop: '4px' }}>₹{feeSummary.total.toLocaleString()}</div>
              </div>
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Paid</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d', marginTop: '4px' }}>₹{feeSummary.paid.toLocaleString()}</div>
              </div>
              <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Due</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b91c1c', marginTop: '4px' }}>₹{feeSummary.pending.toLocaleString()}</div>
              </div>
            </div>

            {/* FEE LIST TABLE */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>FEE TITLE</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>DUE DATE</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>TOTAL</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>PAID</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>BALANCE</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>STATUS</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.length === 0 ? (
                        <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No fees assigned yet.</td></tr>
                    ) : fees.map(fee => (
                      <tr key={fee._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '600', color: '#334155' }}>{fee.title}</div>
                            {fee.remarks && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{fee.remarks}</div>}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{new Date(fee.dueDate).toLocaleDateString()}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#475569' }}>₹{fee.totalAmount.toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#16a34a', fontWeight: '500' }}>₹{fee.paidAmount.toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#dc2626' }}>₹{fee.remainingAmount.toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                backgroundColor: fee.status === 'Paid' ? '#dcfce7' : fee.status === 'Overdue' ? '#fee2e2' : '#fef9c3',
                                color: fee.status === 'Paid' ? '#15803d' : fee.status === 'Overdue' ? '#991b1b' : '#854d0e'
                            }}>
                                {fee.status}
                            </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                            {fee.status !== 'Paid' && (
                                <button 
                                    onClick={() => { setSelectedFeeId(fee._id); setShowPayModal(true); }}
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #c7d2fe', backgroundColor: '#eef2ff', color: '#4f46e5', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
                                >
                                    Pay
                                </button>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>

            {/* --- NEW: PAYMENT HISTORY SECTION --- */}
            <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={16} /> Transaction History
                </h4>
                
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>DATE</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>PAID FOR</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>MODE</th>
                                <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>AMOUNT</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>NOTES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactionHistory.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No payments recorded yet.</td></tr>
                            ) : transactionHistory.map((tx, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                        {new Date(tx.date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: '500', color: '#334155' }}>
                                        {tx.feeTitle}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                                            {tx.mode}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>
                                        +₹{tx.amount.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px', color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                                        {tx.note || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>

      {/* --- ASSIGN MODAL --- */}
      {showAssignModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginBottom: '16px', fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>Assign New Fee</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input className="input-field" placeholder="Fee Title (e.g. Term 1)" value={assignForm.title} onChange={e => setAssignForm({...assignForm, title: e.target.value})} />
                      <input className="input-field" type="number" placeholder="Amount (₹)" value={assignForm.amount} onChange={e => setAssignForm({...assignForm, amount: e.target.value})} />
                      <div>
                          <label style={labelStyle}>Due Date</label>
                          <input className="input-field" type="date" value={assignForm.dueDate} onChange={e => setAssignForm({...assignForm, dueDate: e.target.value})} style={{ width: '100%' }} />
                      </div>
                      <input className="input-field" placeholder="Remarks (Optional)" value={assignForm.remarks} onChange={e => setAssignForm({...assignForm, remarks: e.target.value})} />
                      
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                          <button className="btn" style={{ flex: 1, backgroundColor: 'white', border: '1px solid #cbd5e1' }} onClick={() => setShowAssignModal(false)}>Cancel</button>
                          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAssignFee}>Assign</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- PAY MODAL --- */}
      {showPayModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginBottom: '16px', fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>Record Payment</h3>
                  
                  {!selectedFeeId && (
                      <div style={{ marginBottom: '12px' }}>
                          <label style={labelStyle}>Select Pending Fee</label>
                          <select className="input-field" onChange={e => setSelectedFeeId(e.target.value)} style={{ width: '100%' }}>
                              <option value="">-- Select Fee --</option>
                              {fees.filter(f => f.remainingAmount > 0).map(f => (
                                  <option key={f._id} value={f._id}>{f.title} (Due: ₹{f.remainingAmount})</option>
                              ))}
                          </select>
                      </div>
                  )}

                  {selectedFeeId && (
                      <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Paying For:</span>
                          <div style={{ fontWeight: 'bold', color: '#334155' }}>{fees.find(f => f._id === selectedFeeId)?.title}</div>
                      </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input className="input-field" type="number" placeholder="Amount Paid (₹)" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} />
                      <select className="input-field" value={payForm.mode} onChange={e => setPayForm({...payForm, mode: e.target.value})} style={{ width: '100%' }}>
                          <option value="Cash">Cash</option>
                          <option value="Online">Online / UPI</option>
                          <option value="Cheque">Cheque</option>
                      </select>
                      <input className="input-field" placeholder="Note (e.g. Paid by Father)" value={payForm.note} onChange={e => setPayForm({...payForm, note: e.target.value})} />
                      
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                          <button className="btn" style={{ flex: 1, backgroundColor: 'white', border: '1px solid #cbd5e1' }} onClick={() => setShowPayModal(false)}>Cancel</button>
                          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleRecordPayment}>Confirm Payment</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default StudentDetail;