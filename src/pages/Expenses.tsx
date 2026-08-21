import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Receipt, Utensils, Home, Car, Plane, ShoppingBag, Coffee, Ticket, Trash2, ArrowRightLeft, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import AddSettlementModal from '../components/expenses/AddSettlementModal';

interface Transaction {
  id: string;
  type: 'expense' | 'settlement';
  title: string;
  amount: number;
  date: string;
  category: string;
  paid_by: string;
  paid_to?: string;
  receipt_url?: string;
  raw?: any;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  const fetchTransactions = async () => {
    if (!tripId) return;
    setLoading(true);
    
    // Fetch expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select(`
        *,
        profiles:paid_by (full_name)
      `)
      .eq('trip_id', tripId);

    // Fetch settlements
    const { data: settlementsData } = await supabase
      .from('settlements')
      .select(`
        *,
        payer:payer_id (full_name),
        receiver:receiver_id (full_name)
      `)
      .eq('trip_id', tripId);

    let allTransactions: Transaction[] = [];

    if (expensesData) {
      allTransactions = [...allTransactions, ...expensesData.map((e: any) => ({
        id: e.id,
        type: 'expense' as const,
        title: e.title,
        amount: e.amount,
        date: e.expense_date,
        category: e.category,
        paid_by: e.profiles?.full_name || 'Unknown',
        raw: e
      }))];
    }

    if (settlementsData) {
      allTransactions = [...allTransactions, ...settlementsData.map((s: any) => ({
        id: s.id,
        type: 'settlement' as const,
        title: 'Payment',
        amount: s.amount,
        date: s.paid_at || s.created_at,
        category: 'Settlement',
        paid_by: s.payer?.full_name || 'Unknown',
        paid_to: s.receiver?.full_name || 'Unknown',
        receipt_url: s.receipt_url,
        raw: s
      }))];
    }

    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(allTransactions);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [tripId]);

  const deleteTransaction = async (id: string, type: 'expense' | 'settlement') => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    // Optimistically remove
    setTransactions(transactions.filter(t => t.id !== id));
    
    const table = type === 'expense' ? 'expenses' : 'settlements';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      console.error(`Error deleting ${type}:`, error);
      fetchTransactions(); // Revert on failure
    }
  };

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trip Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and split costs with your group.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            className="flex-1 sm:flex-none inline-flex justify-center items-center gap-x-2 rounded-md bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            onClick={() => setIsSettlementModalOpen(true)}
          >
            <ArrowRightLeft className="-ml-0.5 h-4 w-4" aria-hidden="true" />
            Record Payment
          </button>
          <button
            className="flex-1 sm:flex-none inline-flex justify-center items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 p-6 flex flex-col justify-center transition-colors">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Trip Spent</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">₹{totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">No transactions yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add your first expense or payment to start tracking.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {transactions.map((transaction) => (
              <li key={`${transaction.type}-${transaction.id}`} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-x-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    transaction.type === 'settlement' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : (CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS['Other'])
                  }`}>
                    {transaction.type === 'settlement' 
                      ? <ArrowRightLeft className="h-5 w-5" /> 
                      : (CATEGORY_ICONS[transaction.category] || CATEGORY_ICONS['Other'])}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{transaction.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {transaction.type === 'settlement' ? (
                        <>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{transaction.paid_by}</span> paid <span className="font-medium text-gray-700 dark:text-gray-300">{transaction.paid_to}</span>
                        </>
                      ) : (
                        <>
                          Paid by <span className="font-medium text-gray-700 dark:text-gray-300">{transaction.paid_by}</span>
                        </>
                      )}
                      {' • '}{format(new Date(transaction.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-base font-bold ${transaction.type === 'settlement' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      ₹{Number(transaction.amount).toFixed(2)}
                    </p>
                    {transaction.receipt_url && (
                      <a 
                        href={transaction.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 mt-1"
                      >
                        <Paperclip className="h-3 w-3" />
                        Receipt
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTransaction(transaction.id, transaction.type)}
                    className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    title={`Delete ${transaction.type}`}
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
        onExpenseAdded={fetchTransactions} 
      />
      
      <AddSettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        tripId={tripId || ''}
        onSettlementAdded={fetchTransactions}
      />
    </div>
  );
};

export default Expenses;
