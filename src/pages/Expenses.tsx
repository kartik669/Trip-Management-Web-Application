import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Receipt, Utensils, Home, Car, Plane, ShoppingBag, Coffee, Ticket, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import AddExpenseModal from '../components/expenses/AddExpenseModal';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  paid_by: string;
  profiles: {
    full_name: string;
  };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Food: <Utensils className="h-5 w-5" />,
  Transport: <Car className="h-5 w-5" />,
  Accommodation: <Home className="h-5 w-5" />,
  Flight: <Plane className="h-5 w-5" />,
  Shopping: <ShoppingBag className="h-5 w-5" />,
  Coffee: <Coffee className="h-5 w-5" />,
  Activities: <Ticket className="h-5 w-5" />,
  Other: <Receipt className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-orange-100 text-orange-600',
  Transport: 'bg-blue-100 text-blue-600',
  Accommodation: 'bg-indigo-100 text-indigo-600',
  Flight: 'bg-sky-100 text-sky-600',
  Shopping: 'bg-pink-100 text-pink-600',
  Coffee: 'bg-amber-100 text-amber-600',
  Activities: 'bg-purple-100 text-purple-600',
  Other: 'bg-gray-100 text-gray-600',
};

const Expenses: React.FC = () => {
  const { tripId } = useParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchExpenses = async () => {
    if (!tripId) return;
    setLoading(true);
    
    // Fetch expenses with the profile of the person who paid
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        profiles:paid_by (full_name)
      `)
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      setExpenses(data as any || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [tripId]);

  const deleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    
    // Optimistically remove
    setExpenses(expenses.filter(e => e.id !== id));
    
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      console.error("Error deleting expense:", error);
      fetchExpenses(); // Revert on failure
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Track and split costs with your group.</p>
        </div>
        <button
          className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Trip Spent</p>
          <p className="text-3xl font-bold text-gray-900">₹{totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900">No expenses yet</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first expense to start tracking costs.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {expenses.map((expense) => (
              <li key={expense.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-x-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS['Other']}`}>
                    {CATEGORY_ICONS[expense.category] || CATEGORY_ICONS['Other']}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{expense.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Paid by <span className="font-medium text-gray-700">{expense.profiles?.full_name}</span> • {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">₹{Number(expense.amount).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50"
                    title="Delete Expense"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        tripId={tripId || ''} 
        onExpenseAdded={fetchExpenses} 
      />
    </div>
  );
};

export default Expenses;
