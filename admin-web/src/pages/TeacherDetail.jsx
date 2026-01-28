import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, X, ArrowLeft, Plus, Trash2, Star, BookOpen } from 'lucide-react';
import api from '../services/api';

const CLASS_OPTIONS = ["9-A", "9-B", "10-A", "10-B", "11-Science", "11-Commerce"];

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [teacher, setTeacher] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [form, setForm] = useState({ 
    name: '', mobile: '', classTeachership: '', assignments: [] 
  });

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await api.get(`/admin/teacher/${id}`);
        setTeacher(res.data);
        setForm({
          name: res.data.name,
          mobile: res.data.mobile,
          classTeachership: res.data.classTeachership || '',
          assignments: res.data.assignments || []
        });
      } catch (error) {
        alert("Failed to load teacher data");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [id]);

  // --- HANDLERS ---
  const handleUpdate = async () => {
    try {
      await api.put(`/admin/teacher/${id}`, form);
      setTeacher({ ...teacher, ...form });
      setIsEditing(false);
      alert("Teacher updated successfully!");
    } catch (error) {
      alert("Update failed");
    }
  };

  const addAssignment = () => {
    setForm({ ...form, assignments: [...form.assignments, { class: '10-A', subject: 'New Subject' }] });
  };

  const removeAssignment = (index) => {
    const newAssign = [...form.assignments];
    newAssign.splice(index, 1);
    setForm({ ...form, assignments: newAssign });
  };

  const updateAssignment = (index, field, value) => {
    const newAssign = [...form.assignments];
    newAssign[index][field] = value;
    setForm({ ...form, assignments: newAssign });
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;
  if (!teacher) return <div className="p-10 text-center text-red-500">Teacher not found</div>;

  return (
    <div style={{ padding: '40px' }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn hover:bg-slate-100" style={{ padding: 8 }}>
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>
            {teacher.name.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: 24, margin: 0 }}>{teacher.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge" style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', color: '#64748b' }}>
                Code: {teacher.teacherCode}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
           {!isEditing ? (
             <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
               <Edit2 size={16} /> Edit Details
             </button>
           ) : (
             <>
               <button className="btn" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={() => setIsEditing(false)}>
                 <X size={16} /> Cancel
               </button>
               <button className="btn btn-primary" onClick={handleUpdate}>
                 <Save size={16} /> Save Changes
               </button>
             </>
           )}
        </div>
      </div>

      <div className="grid-2 max-w-4xl mx-auto">
        
        {/* === LEFT COLUMN: PROFILE === */}
        <div className="flex flex-col gap-6">
           <div className="card">
             <h3 className="mb-4">Profile Info</h3>
             <div className="mb-4">
               <label>Full Name</label>
               {isEditing ? (
                 <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
               ) : (
                 <div className="font-bold text-slate-700">{teacher.name}</div>
               )}
             </div>
             <div className="mb-4">
               <label>Mobile</label>
               {isEditing ? (
                 <input className="input-field" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
               ) : (
                 <div className="font-bold text-slate-700">{teacher.mobile}</div>
               )}
             </div>
           </div>

           <div className="card">
             <h3 className="mb-4 flex items-center gap-2"><Star size={18} className="text-indigo-600"/> Class Responsibility</h3>
             <div className="info-box">
               <label className="text-indigo-900 mb-2">Class Teachership</label>
               {isEditing ? (
                 <select className="input-field" value={form.classTeachership} onChange={e => setForm({...form, classTeachership: e.target.value})}>
                   <option value="">-- No Class Assigned --</option>
                   {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </select>
               ) : (
                 <div className="font-bold text-indigo-800">
                   {teacher.classTeachership ? `Class Teacher of ${teacher.classTeachership}` : "No Class Assigned"}
                 </div>
               )}
             </div>
           </div>
        </div>

        {/* === RIGHT COLUMN: ASSIGNMENTS === */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2 m-0"><BookOpen size={18} className="text-indigo-600"/> Assignments</h3>
            {isEditing && (
              <button className="btn btn-dashed" style={{ width: 'auto', padding: '6px 12px' }} onClick={addAssignment}>
                <Plus size={14}/> Add
              </button>
            )}
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Subject</th>
                  {isEditing && <th style={{ width: 40 }}></th>}
                </tr>
              </thead>
              <tbody>
                {form.assignments.map((assign, i) => (
                  <tr key={i}>
                    <td>
                      {isEditing ? (
                        <select 
                          className="input-field" style={{ padding: 6 }}
                          value={assign.class} 
                          onChange={e => updateAssignment(i, 'class', e.target.value)}
                        >
                           {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <span className="font-bold text-slate-700">{assign.class}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          className="input-field" style={{ padding: 6 }}
                          value={assign.subject} 
                          onChange={e => updateAssignment(i, 'subject', e.target.value)}
                        />
                      ) : (
                        <span>{assign.subject}</span>
                      )}
                    </td>
                    {isEditing && (
                      <td className="text-center">
                        <button className="text-red-400 hover:text-red-600 border-none bg-transparent cursor-pointer" onClick={() => removeAssignment(i)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherDetail;