import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, ArrowRightLeft, User, Users } from 'lucide-react';

interface AddSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onSettlementAdded: () => void;
}

const AddSettlementModal: React.FC<AddSettlementModalProps> = ({ isOpen, onClose, tripId, onSettlementAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(user?.id || '');
  const [receiverId, setReceiverId] = useState('');
  const [members, setMembers] = useState<{ id: string; user_id: string; profiles: { full_name: string } }[]>([]);

  useEffect(() => {
    if (isOpen && tripId) {
      const fetchMembers = async () => {
        const { data } = await supabase
          .from('trip_members')
          .select('id, user_id, profiles(full_name)')
          .eq('trip_id', tripId);
        
        if (data) {
          setMembers(data as any);
          if (!payerId) {
            setPayerId(user?.id || data[0]?.user_id);
          }
          const otherMembers = data.filter(m => m.user_id !== (user?.id || data[0]?.user_id));
          if (otherMembers.length > 0) {
            setReceiverId(otherMembers[0].user_id);
          }
        }
      };
      fetchMembers();
    }
  }, [isOpen, tripId, user?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!amount || !payerId || !receiverId) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (payerId === receiverId) {
      setError("Payer and receiver cannot be the same person.");
      setLoading(false);
      return;
    }

    try {
      const { error: settlementError } = await supabase
        .from('settlements')
        .insert({
          trip_id: tripId,
          payer_id: payerId,
          receiver_id: receiverId,
          amount: parseFloat(amount),
          status: 'paid',
          paid_at: new Date().toISOString()
        });

      if (settlementError) throw settlementError;

      onSettlementAdded();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add settlement");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
            Record Payment
          </h3>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-1 text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                <User className="h-4 w-4 text-gray-400" />
                Who paid?
              </label>
              <div className="mt-1">
                <select
                  value={payerId}
                  onChange={(e) => {
                    setPayerId(e.target.value);
                    if (e.target.value === receiverId) setReceiverId('');
                  }}
                  className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                >
                  {members.map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.profiles?.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 text-gray-400">
              <ArrowRightLeft className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <label className="flex items-center gap-1 text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                <Users className="h-4 w-4 text-gray-400" />
                Paid to?
              </label>
              <div className="mt-1">
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                >
                  <option value="" disabled>Select member</option>
                  {members.filter(m => m.user_id !== payerId).map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.profiles?.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              Amount
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full rounded-md border-0 py-2 pl-7 text-gray-900 dark:text-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pr-3"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSettlementModal;
