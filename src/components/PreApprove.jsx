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

  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200';
  const input = isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-100 border-gray-300 text-gray-800';
  const subtext = isDark ? 'text-slate-400' : 'text-gray-500';

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
    <div className="space-y-6">
      <div className={`border rounded-2xl p-5 ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" /> Pre-Approvals
            </h3>
            <p className={`text-xs mt-1 ${subtext}`}>Gate par bina phone ke entry den</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-semibold"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className={`mb-4 p-5 rounded-[24px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'} space-y-4`}>
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${subtext}`}>Visitor Type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['Guest', 'Cab', 'Delivery', 'Helper'].map((cat) => (
                  <button 
                    key={cat}
                    type="button"
                    onClick={() => setForm({...form, category: cat, name: '', company: ''})}
                    className={`py-2.5 rounded-xl text-[10px] font-black border transition-all ${
                      form.category === cat 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700/50' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${subtext}`}>
                {form.category === 'Delivery' ? 'Delivery Company' : 'Visitor Name'}
              </label>
              {form.category === 'Delivery' ? (
                <div className="space-y-2">
                  <select 
                    value={form.company} 
                    onChange={e => setForm({...form, company: e.target.value})}
                    className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-800'}`}
                  >
                    <option value="">Company Select Karein</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="Zomato">Zomato</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Other">Other</option>
                  </select>
                  {form.company === 'Other' && (
                    <input 
                      type="text" 
                      placeholder="Company ka Naam" 
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-800'}`}
                    />
                  )}
                </div>
              ) : (
                <input 
                  type="text" 
                  placeholder={
                    form.category === 'Cab' ? 'e.g. Ola Driver, Uber Auto' :
                    form.category === 'Helper' ? 'e.g. Ramu Plumber, Kaamwali Bai' : 'e.g. Rahul Mehta, Friend'
                  }
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-800'}`}
                />
              )}
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${subtext}`}>Mobile Number (Optional)</label>
              <input 
                type="tel" 
                placeholder="e.g. +91 99999 88888" 
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-800'}`}
              />
            </div>

            {form.category === 'Guest' && (
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${subtext}`}>Aane ka Maqsad / Purpose (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Family Meet, Dinner" 
                  value={form.purpose}
                  onChange={e => setForm({...form, purpose: e.target.value})}
                  className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-800'}`}
                />
              </div>
            )}

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${subtext}`}>Vehicle Number (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. MH 12 AB 1234" 
                value={form.vehicle_number || ''}
                onChange={e => setForm({...form, vehicle_number: e.target.value.toUpperCase()})}
                className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-800'}`}
              />
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${subtext}`}>📅 Validity (Arrival Time Slot)</label>
              <select 
                value={form.valid_date || 'Immediate'}
                onChange={e => setForm({...form, valid_date: e.target.value})}
                className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-slate-800'}`}
              >
                <option value="Immediate">Immediate (Valid for 2 Hours)</option>
                <option value="2 Hours">Next 2 Hours</option>
                <option value="4 Hours">Next 4 Hours</option>
                <option value="Today">Today (Full Day)</option>
                <option value="Tomorrow">Tomorrow (Full Day)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleAdd} 
                disabled={actionLoading} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3 rounded-2xl text-xs font-extrabold flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Create Pre-approval Pass ✅'}
              </button>
              <button 
                onClick={() => setShowForm(false)} 
                disabled={actionLoading} 
                className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Active Approvals List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : approvals.length === 0 ? (
          <div className={`text-center py-8 ${subtext}`}>
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Koi pre-approval nahi hai abhi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map(a => (
              <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{a.type === 'delivery' ? (deliveryIcons[a.company] || '📦') : '🧑'}</div>
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                      <span>{a.type === 'delivery' ? a.company : a.name}</span>
                      {a.type === 'guest' && (
                        <span className="text-[10px] bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg font-black tracking-wider">
                          PIN: {a.qr_code || '123456'}
                        </span>
                      )}
                    </p>
                    <p className={`text-xs ${subtext}`}>
                      {a.type === 'delivery' ? 'Delivery' : a.purpose || 'Guest'}
                      {a.phone && ` • 📞 ${a.phone}`}
                      {a.valid_date && ` • Valid: ${formatDateTime(a.valid_date)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedPass(a)} className="text-indigo-500 hover:text-indigo-400 p-1 bg-indigo-500/10 rounded-lg">
                    <Share2 size={16} />
                  </button>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full">
                    ✅ Active
                  </span>
                  <button onClick={() => handleRemove(a.id, a.type)} disabled={actionLoading} className="text-red-400 hover:text-red-300 p-1">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Digital Gate Pass Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setSelectedPass(null)}>
          <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            {/* Ticket Top */}
            <div className={`p-6 text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg">
                <CheckCircle size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-1">Gate Pass</h2>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${subtext}`}>GateKeeper Society</p>
              
              <div className="mt-8 text-left space-y-4">
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${subtext}`}>Guest / Delivery</p>
                  <p className="font-bold text-lg">{selectedPass.type === 'delivery' ? selectedPass.company : selectedPass.name}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${subtext}`}>Host (Flat)</p>
                    <p className="font-bold">{user?.name || 'Resident'} ({user?.flat_number || 'A-101'})</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${subtext}`}>Valid Date</p>
                    <p className="font-bold text-xs">{formatDateTime(selectedPass.valid_date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Divider with dashed line and cutouts */}
            <div className={`relative h-8 flex items-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="absolute -left-4 w-8 h-8 rounded-full bg-black/80"></div>
              <div className={`w-full border-t-2 border-dashed ${isDark ? 'border-slate-600' : 'border-gray-300'} mx-4`}></div>
              <div className="absolute -right-4 w-8 h-8 rounded-full bg-black/80"></div>
            </div>

            {/* Ticket Bottom (PIN) */}
            <div className={`p-6 text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              {selectedPass.type === 'guest' ? (
                <>
                  <p className={`text-xs font-bold mb-4 ${subtext}`}>Tell this 6-Digit PIN at the Main Gate</p>
                  <div className="flex justify-center gap-2 mb-6">
                    {(selectedPass.qr_code || '123456').toString().split('').map((digit, idx) => (
                      <div key={idx} className="w-10 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 text-2xl font-black rounded-xl flex items-center justify-center shadow-inner">
                        {digit}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className={`text-xs font-bold mb-4 ${subtext}`}>Pre-Approved Delivery Pass</p>
                  <div className="py-4 px-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xl font-extrabold rounded-2xl inline-block mb-6">
                    ✅ Delivery Pre-Approved
                  </div>
                </>
              )}
              
              <a 
                href={`whatsapp://send?text=${encodeURIComponent(
                  selectedPass.type === 'guest' 
                    ? `*Digital Gate Pass* 🎫\n\nHi ${selectedPass.name},\nYou are invited to Flat *${user?.flat_number || 'A-101'}*!\n\nPlease tell this 6-Digit PIN Code to the security guard for instant entry:\n\n*Your PIN Code: ${selectedPass.qr_code || '123456'}*`
                    : `*Delivery Pre-Approval* 🛵\n\nYour delivery has been pre-approved for Flat *${user?.flat_number || 'A-101'}*. Please inform the security guard upon arrival.`
                )}`}
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                Share on WhatsApp 💬
              </a>
              <button onClick={() => setSelectedPass(null)} className={`mt-3 w-full py-3 rounded-xl text-sm font-bold ${isDark ? 'text-slate-400 hover:text-white bg-slate-700/50' : 'text-gray-500 hover:text-black bg-gray-100'}`}>
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreApprove;
