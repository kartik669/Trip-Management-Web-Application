import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Receipt, Tag, Users } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onExpenseAdded: () => void;
}

const CATEGORIES = [
  'Food',
  'Transport',
  'Accommodation',
  'Flight',
  'Shopping',
  'Coffee',
  'Activities',
  'Other'
];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, tripId, onExpenseAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [members, setMembers] = useState<{ id: string; user_id: string; profiles: { full_name: string } }[]>([]);

  useEffect(() => {
    if (isOpen && tripId) {
      // Fetch trip members for the "Paid By" dropdown
      const fetchMembers = async () => {
        const { data } = await supabase
          .from('trip_members')
          .select('id, user_id, profiles(full_name)')
          .eq('trip_id', tripId);
        
        if (data) {
          setMembers(data as any);
          if (data.length > 0 && !paidBy) {
            setPaidBy(data[0].user_id);
          }
        }
      };
      fetchMembers();
    }
  }, [isOpen, tripId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title || !amount || !category || !paidBy) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      // 1. Insert the main expense
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          trip_id: tripId,
          title,
          amount: parseFloat(amount),
          category,
          paid_by: paidBy,
          expense_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // 2. Automatically split equally among all members
      const splitAmount = parseFloat(amount) / members.length;
      
      const participants = members.map(m => ({
        expense_id: expenseData.id,
        user_id: m.user_id,
        share_amount: splitAmount
      }));

      const { error: splitError } = await supabase
        .from('expense_participants')
        .insert(participants);

      if (splitError) throw splitError;

      onExpenseAdded();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setAmount('');
    setCategory('Food');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Add Expense
          </h3>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              What was it for?
            </label>
            <div className="mt-1">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-md border-0 py-2 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                placeholder="e.g., Dinner at Mario's"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 pl-7 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pr-3"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                Category
              </label>
              <div className="mt-1">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              Who paid?
            </label>
            <div className="mt-1">
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
              >
                {members.map(member => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.profiles?.full_name}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Note: This expense will be split equally among all {members.length} trip members.
            </p>
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
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
