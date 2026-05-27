import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Package, Plus, CheckCircle, Clock, Truck, X, User, Share2, Loader2 } from 'lucide-react';
import { entryAPI } from '../services/api';

const PreApprove = ({ user }) => {
  const { isDark } = useTheme();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Guest', company: '', name: '', phone: '', purpose: '', valid_date: 'Immediate', vehicle_number: '' });
  const [selectedPass, setSelectedPass] = useState(null);

  const formatDateTime = (dtStr) => {
    if (!dtStr) return 'Today';
    try {
      const d = new Date(dtStr);
      if (isNaN(d.getTime())) return dtStr;
      return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch(e) {
      return dtStr;
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await entryAPI.getPreApprovals();
      setApprovals(res.data);
    } catch (err) {
      console.error('Failed to fetch pre-approvals', err);
    } finally {
      setLoading(false);
    }
  };

  const card = isDark ? 'glass-panel text-white' : 'glass-card-light text-slate-800';
  const input = isDark ? 'bg-slate-950/65 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 shadow-sm';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';

  const handleAdd = async () => {
    if (form.category === 'Delivery' && !form.company) return alert('Please select a delivery company');
    if (form.category !== 'Delivery' && !form.name) return alert('Please enter visitor name');
    
    setActionLoading(true);
    try {
      // 📅 Calculate real expiration timestamp based on dropdown selection
      const now = new Date();
      if (form.valid_date === 'Immediate' || form.valid_date === '2 Hours') {
        now.setHours(now.getHours() + 2);
      } else if (form.valid_date === '4 Hours') {
        now.setHours(now.getHours() + 4);
      } else if (form.valid_date === 'Today') {
        now.setHours(23, 59, 59, 999);
      } else if (form.valid_date === 'Tomorrow') {
        now.setDate(now.getDate() + 1);
        now.setHours(23, 59, 59, 999);
      } else {
        // Fallback: 24 hours
        now.setHours(now.getHours() + 24);
      }
      const validDateStr = now.toISOString().slice(0, 19).replace('T', ' ');

      // 🚗 Append vehicle number if provided
      let finalPurpose = form.category || 'Guest';
      if (form.vehicle_number) {
        finalPurpose = `${finalPurpose} (${form.vehicle_number})`;
      }

      const payload = {
        type: form.category === 'Delivery' ? 'delivery' : 'guest',
        company: form.category === 'Delivery' ? (form.vehicle_number ? `${form.company} (${form.vehicle_number})` : form.company) : undefined,
        name: form.category !== 'Delivery' ? form.name : undefined,
        phone: form.phone || '',
        purpose: finalPurpose,
        valid_date: validDateStr
      };
      await entryAPI.addPreApproval(payload);
      await fetchApprovals();
      setForm({ category: 'Guest', company: '', name: '', phone: '', purpose: '', valid_date: 'Immediate', vehicle_number: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add pre-approval', err);
      alert('Error adding pre-approval');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (id, type) => {
    setActionLoading(true);
    try {
      await entryAPI.removePreApproval(type, id);
      await fetchApprovals();
    } catch (err) {
      console.error('Failed to remove pre-approval', err);
      alert('Error removing pre-approval');
    } finally {
      setActionLoading(false);
    }
  };

  const deliveryIcons = { Amazon: '📦', Swiggy: '🛵', Zomato: '🍕', Flipkart: '🛍️', Other: '📫' };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className={`p-6 transition-all duration-300 hover:shadow-lg ${card}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2 font-heading">
              <CheckCircle size={20} className="text-emerald-400" /> Pre-Approvals
            </h3>
            <p className={`text-[10px] mt-0.5 ${subtext}`}>Bypass gate security calls instantly</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 active:scale-95 text-white px-3.5 py-2.5 rounded-xl font-black uppercase tracking-wider transition-all"
          >
            {showForm ? <X size={13} /> : <Plus size={13} />}
            <span>{showForm ? 'Cancel' : 'Create'}</span>
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className={`mb-5 p-5 rounded-[22px] border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'} space-y-4 animate-scale-up`}>
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${subtext}`}>Visitor Type</label>
              <div className="grid grid-cols-4 gap-2">
                {['Guest', 'Cab', 'Delivery', 'Helper'].map((cat) => (
                  <button 
                    key={cat}
                    type="button"
                    onClick={() => setForm({...form, category: cat, name: '', company: ''})}
                    className={`py-2.5 rounded-xl text-[10px] font-black border transition-all ${
                      form.category === cat 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-800' : 'bg-white border-slate-200 text-gray-650 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>
                {form.category === 'Delivery' ? 'Delivery Partner' : 'Visitor Name'}
              </label>
              {form.category === 'Delivery' ? (
                <div className="space-y-2">
                  <select 
                    value={form.company} 
                    onChange={e => setForm({...form, company: e.target.value})}
                    className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none font-bold ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-850'}`}
                  >
                    <option value="">Select Company</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="Zomato">Zomato</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Other">Other</option>
                  </select>
                  {form.company === 'Other' && (
                    <input 
                      type="text" 
                      placeholder="Company Name" 
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${input}`}
                    />
                  )}
                </div>
              ) : (
                <input 
                  type="text" 
                  placeholder={
                    form.category === 'Cab' ? 'e.g. Ola Driver, Uber Driver' :
                    form.category === 'Helper' ? 'e.g. Electrician, Maid, Ramu Plumber' : 'e.g. Rahul Mehta, Friend'
                  }
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${input}`}
                />
              )}
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Mobile Number (Optional)</label>
              <input 
                type="tel" 
                placeholder="e.g. +91 99999 88888" 
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${input}`}
              />
            </div>

            {form.category === 'Guest' && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Purpose of Visit (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Family Meet, Dinner Party" 
                  value={form.purpose}
                  onChange={e => setForm({...form, purpose: e.target.value})}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${input}`}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>Vehicle Number (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. MH 12 AB 1234" 
                value={form.vehicle_number || ''}
                onChange={e => setForm({...form, vehicle_number: e.target.value.toUpperCase()})}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none ${input}`}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${subtext}`}>📅 Validity Slot</label>
              <select 
                value={form.valid_date || 'Immediate'}
                onChange={e => setForm({...form, valid_date: e.target.value})}
                className={`w-full rounded-xl border px-3 py-2.5 text-xs font-bold outline-none ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-850'}`}
              >
                <option value="Immediate">Immediate (Valid for 2 Hours)</option>
                <option value="2 Hours">Next 2 Hours</option>
                <option value="4 Hours">Next 4 Hours</option>
                <option value="Today">Today (Full Day)</option>
                <option value="Tomorrow">Tomorrow (Full Day)</option>
              </select>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={handleAdd} 
                disabled={actionLoading} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/25 active:scale-95 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 transition-all duration-300"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Create Pre-approval Pass ✅'}
              </button>
              <button 
                onClick={() => setShowForm(false)} 
                disabled={actionLoading} 
                className={`flex-1 py-3.5 rounded-2xl text-xs font-bold border transition-all duration-300 ${isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-900/50' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Active Approvals List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-10">
            <Package size={44} className="mx-auto mb-3 opacity-20 text-slate-400" />
            <p className="font-bold text-sm">No active pre-approvals</p>
            <p className={`text-[10px] mt-0.5 ${subtext}`}>Generate secure passes to allow automatic entries</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map(a => (
              <div key={a.id} className={`flex items-center justify-between p-4 rounded-[24px] border transition-all duration-300 hover:scale-[1.01] ${
                isDark ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50/50 border-slate-200/80 hover:border-slate-300 shadow-sm'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-xl shadow-sm">
                    {a.type === 'delivery' ? (deliveryIcons[a.company] || '📦') : '🧑'}
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-850 dark:text-slate-100 leading-snug flex items-center gap-2 flex-wrap">
                      <span>{a.type === 'delivery' ? a.company : a.name}</span>
                      {a.type === 'guest' && (
                        <span className="text-[9px] bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg font-black tracking-wider">
                          PIN: {a.qr_code || '123456'}
                        </span>
                      )}
                    </p>
                    <p className={`text-[10px] ${subtext} mt-0.5`}>
                      {a.type === 'delivery' ? 'Delivery Partner' : a.purpose || 'Guest'}
                      {a.phone && ` • 📞 ${a.phone}`}
                      {a.valid_date && ` • Valid: ${formatDateTime(a.valid_date)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setSelectedPass(a)} className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-indigo-500/10 rounded-xl transition-colors border border-indigo-500/10 shadow-sm">
                    <Share2 size={14} />
                  </button>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full shadow-sm">
                    Active
                  </span>
                  <button onClick={() => handleRemove(a.id, a.type)} disabled={actionLoading} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-xl transition-colors">
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Digital Gate Pass Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in" onClick={() => setSelectedPass(null)}>
          <div className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(99,102,241,0.25)] border border-slate-200/20 animate-scale-up" onClick={e => e.stopPropagation()}>
            {/* Ticket Top */}
            <div className={`p-6 text-center ${isDark ? 'bg-slate-900 border-b border-slate-800/50' : 'bg-white'}`}>
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 rounded-[20px] mx-auto flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
                <CheckCircle size={26} className="text-white" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 font-heading mb-0.5">Gate Pass</h2>
              <p className={`text-[9px] font-black tracking-widest uppercase ${subtext}`}>Gatekeeper digital permit</p>
              
              <div className="mt-7 text-left space-y-4">
                <div className="border-l-2 border-indigo-500 pl-3">
                  <p className={`text-[9px] uppercase font-bold tracking-widest ${subtext}`}>Visitor Profile</p>
                  <p className="font-extrabold text-base text-slate-850 dark:text-slate-100">{selectedPass.type === 'delivery' ? selectedPass.company : selectedPass.name}</p>
                </div>
                <div className="flex justify-between border-t border-slate-500/10 pt-3">
                  <div>
                    <p className={`text-[9px] uppercase font-bold tracking-widest ${subtext}`}>Host Suite (Flat)</p>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{user?.name || 'Resident'} ({user?.tower ? user.tower + '-' : ''}{user?.flat_number || 'A-101'})</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] uppercase font-bold tracking-widest ${subtext}`}>Validity Window</p>
                    <p className="font-extrabold text-[10px] text-indigo-400">{formatDateTime(selectedPass.valid_date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Divider with dashed line and cutouts */}
            <div className={`relative h-6 flex items-center ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="absolute -left-3.5 w-7 h-7 rounded-full bg-slate-950 border-r border-slate-200/10"></div>
              <div className={`w-full border-t-2 border-dashed ${isDark ? 'border-slate-850' : 'border-slate-200'} mx-4`}></div>
              <div className="absolute -right-3.5 w-7 h-7 rounded-full bg-slate-950 border-l border-slate-200/10"></div>
            </div>

            {/* Ticket Bottom (PIN) */}
            <div className={`p-6 text-center ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              {selectedPass.type === 'guest' ? (
                <>
                  <p className={`text-[10px] font-black uppercase tracking-wider mb-3.5 ${subtext}`}>Tell this 6-Digit PIN to Gate Security Guard</p>
                  <div className="flex justify-center gap-2 mb-6">
                    {(selectedPass.qr_code || '123456').toString().split('').map((digit, idx) => (
                      <div key={idx} className="w-10 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 text-xl font-black rounded-xl flex items-center justify-center shadow-inner font-mono">
                        {digit}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className={`text-[10px] font-black uppercase tracking-wider mb-3.5 ${subtext}`}>Pre-Approved Delivery Permit</p>
                  <div className="py-3 px-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-sm font-black rounded-2xl inline-block mb-6 shadow-sm uppercase tracking-wider flex items-center gap-1.5 mx-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Delivery Pre-Approved</span>
                  </div>
                </>
              )}
              
              <a 
                href={`whatsapp://send?text=${encodeURIComponent(
                  selectedPass.type === 'guest' 
                    ? `*Digital Gate Pass* 🎫\n\nHi ${selectedPass.name},\nYou are invited to Flat *${user?.tower ? user.tower + '-' : ''}${user?.flat_number || 'A-101'}*!\n\nPlease tell this 6-Digit PIN Code to the security guard for instant entry:\n\n*Your PIN Code: ${selectedPass.qr_code || '123456'}*`
                    : `*Delivery Pre-Approval* 🛵\n\nYour delivery has been pre-approved for Flat *${user?.tower ? user.tower + '-' : ''}${user?.flat_number || 'A-101'}*. Please inform the security guard upon arrival.`
                )}`}
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 hover:shadow-emerald-550/15"
              >
                <Share2 size={13} />
                <span>Share on WhatsApp</span>
              </a>
              <button onClick={() => setSelectedPass(null)} className={`mt-3 w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${isDark ? 'text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800' : 'text-gray-500 hover:text-black bg-slate-50 hover:bg-slate-100'}`}>
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreApprove;
