import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, CheckCircle2, Home, Building2, Briefcase, X, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { UserAddress } from '../../types';
import { useToast } from '../../context/ToastContext';

interface AddressManagerProps {
  userId: string;
  addresses: UserAddress[];
  onAddressesUpdated: (updatedAddresses: UserAddress[]) => void;
}

export const AddressManager: React.FC<AddressManagerProps> = ({
  userId,
  addresses,
  onAddressesUpdated
}) => {
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form states
  const [label, setLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setLabel('Home');
    setCustomLabel('');
    setRecipientName('');
    setPhone('');
    setStreet('');
    setLandmark('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('India');
    setIsDefault(addresses.length === 0);
    setShowModal(true);
  };

  const handleOpenEditModal = (addr: UserAddress) => {
    setEditingAddressId(addr._id || null);
    if (['Home', 'Office', 'Studio'].includes(addr.label)) {
      setLabel(addr.label);
      setCustomLabel('');
    } else {
      setLabel('Custom');
      setCustomLabel(addr.label);
    }
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setStreet(addr.street);
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country || 'India');
    setIsDefault(Boolean(addr.isDefault));
    setShowModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !phone || !street || !city || !state || !postalCode) {
      showToast('Please fill in all required address fields.', 'error');
      return;
    }

    const finalLabel = label === 'Custom' ? (customLabel.trim() || 'Other') : label;

    setIsSubmitting(true);
    try {
      const addressData = {
        label: finalLabel,
        recipientName,
        phone,
        street,
        landmark,
        city,
        state,
        postalCode,
        country,
        isDefault
      };

      if (editingAddressId) {
        const res = await api.updateUserAddress(userId, editingAddressId, addressData);
        if (res.addresses) {
          onAddressesUpdated(res.addresses);
        }
        showToast('Address updated successfully!', 'success');
      } else {
        const res = await api.addUserAddress(userId, addressData);
        if (res.addresses) {
          onAddressesUpdated(res.addresses);
        }
        showToast('New delivery address added!', 'success');
      }

      setShowModal(false);
    } catch {
      showToast('Failed to save address. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Are you sure you want to remove this delivery address?')) {
      try {
        const res = await api.deleteUserAddress(userId, addressId);
        if (res.addresses) {
          onAddressesUpdated(res.addresses);
        }
        showToast('Address removed.', 'info');
      } catch {
        showToast('Failed to delete address.', 'error');
      }
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const res = await api.setDefaultUserAddress(userId, addressId);
      if (res.addresses) {
        onAddressesUpdated(res.addresses);
      }
      showToast('Default delivery address updated.', 'success');
    } catch {
      showToast('Failed to set default address.', 'error');
    }
  };

  const getAddressIcon = (lbl: string) => {
    switch (lbl.toLowerCase()) {
      case 'home':
        return <Home className="w-4 h-4 text-[#0066FF]" />;
      case 'office':
      case 'work':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'studio':
        return <Building2 className="w-4 h-4 text-cyan-600" />;
      default:
        return <MapPin className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0066FF] border border-blue-200">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-heading">
              Delivery Addresses ({addresses.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Save multiple home, office, or custom locations for seamless express checkout.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.length > 0 ? (
          addresses.map((addr) => (
            <div
              key={addr._id}
              className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                addr.isDefault
                  ? 'border-[#0066FF] bg-blue-50/30 shadow-xs ring-1 ring-[#0066FF]/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                      {getAddressIcon(addr.label)}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      {addr.label}
                    </span>
                  </div>

                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0066FF] font-bold text-[10px] border border-blue-200">
                      <CheckCircle2 className="w-3 h-3" /> Default Address
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addr._id && handleSetDefault(addr._id)}
                      className="text-[11px] text-slate-500 hover:text-[#0066FF] font-semibold underline"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div className="text-xs space-y-1 text-slate-700 mt-3">
                  <p className="font-bold text-slate-900 text-sm">{addr.recipientName}</p>
                  <p className="text-slate-500">{addr.phone}</p>
                  <p className="pt-1 text-slate-800 leading-relaxed">
                    {addr.street}
                    {addr.landmark ? `, ${addr.landmark}` : ''}
                  </p>
                  <p className="text-slate-600 font-medium">
                    {addr.city}, {addr.state} – {addr.postalCode}, {addr.country}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(addr)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => addr._id && handleDeleteAddress(addr._id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 py-12 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No delivery addresses saved yet.</p>
            <p>Add your home or work address for quicker 1-click checkout.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-900 font-heading mb-4">
              {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              {/* Address Label Preset */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Address Label / Custom Name *</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Home', 'Office', 'Studio', 'Custom'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLabel(item)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                        label === item
                          ? 'bg-[#0066FF] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {item === 'Home' && <Home className="w-3.5 h-3.5" />}
                      {item === 'Office' && <Briefcase className="w-3.5 h-3.5" />}
                      {item === 'Studio' && <Building2 className="w-3.5 h-3.5" />}
                      <span>{item}</span>
                    </button>
                  ))}
                </div>

                {label === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="e.g. Parent's House, Farmhouse, Workshop"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full recipient name"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address, Flat / Building *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Flat 402, Quantum Towers, Sector 45"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near Cyber City Metro Station"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="560001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-[#0066FF] rounded border-slate-300 focus:ring-[#0066FF]"
                />
                <label htmlFor="isDefaultCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Make this my default delivery address
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
