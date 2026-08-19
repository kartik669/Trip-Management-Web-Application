import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, PieChart, Wallet } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-orange-500',
  Transport: 'bg-blue-500',
  Accommodation: 'bg-indigo-500',
  Flight: 'bg-sky-500',
  Shopping: 'bg-pink-500',
  Coffee: 'bg-amber-500',
  Activities: 'bg-purple-500',
  Other: 'bg-gray-500',
};

const Reports: React.FC = () => {
  const { tripId } = useParams();
  const [loading, setLoading] = useState(true);
  
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [expensesByCategory, setExpensesByCategory] = useState<{category: string, amount: number, percentage: number}[]>([]);
  const [expensesByPerson, setExpensesByPerson] = useState<{name: string, amount: number}[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!tripId) return;
      setLoading(true);

      try {
        // 1. Fetch Trip Budget
        const { data: trip } = await supabase.from('trips').select('budget').eq('id', tripId).single();
        const budget = trip?.budget ? parseFloat(trip.budget) : 0;
        setTotalBudget(budget);

        // 2. Fetch all expenses with profiles
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount, category, profiles:paid_by(full_name)')
          .eq('trip_id', tripId);

        if (expenses) {
          const sum = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
          setTotalSpent(sum);

          // Group by Category
          const catMap: Record<string, number> = {};
          expenses.forEach(exp => {
            catMap[exp.category] = (catMap[exp.category] || 0) + Number(exp.amount);
          });
          
          const catArray = Object.entries(catMap)
            .map(([category, amount]) => ({
              category,
              amount,
              percentage: sum > 0 ? Math.round((amount / sum) * 100) : 0
            }))
            .sort((a, b) => b.amount - a.amount);
            
          setExpensesByCategory(catArray);

          // Group by Person (Who paid)
          const personMap: Record<string, number> = {};
          expenses.forEach(exp => {
            const name = (exp.profiles as any)?.full_name || 'Unknown';
            personMap[name] = (personMap[name] || 0) + Number(exp.amount);
          });

          const personArray = Object.entries(personMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);
            
          setExpensesByPerson(personArray);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [tripId]);

  const budgetPercentage = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;
  const isOverBudget = totalBudget > 0 && totalSpent > totalBudget;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Track your spending and budget.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-4 text-blue-600">
                <Wallet className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">₹{totalSpent.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Budget Progress</p>
                  <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    {totalBudget > 0 ? `₹${totalBudget.toFixed(2)}` : 'No budget set'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    {budgetPercentage}%
                  </span>
                </div>
              </div>
              {totalBudget > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${budgetPercentage}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Breakdown */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-bold text-gray-900">Spending by Category</h3>
              </div>
              <div className="p-6">
                {expensesByCategory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No expenses yet.</p>
                ) : (
                  <div className="space-y-5">
                    {expensesByCategory.map((cat) => (
                      <div key={cat.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{cat.category}</span>
                          <span className="font-bold text-gray-900">₹{cat.amount.toFixed(2)} ({cat.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${CATEGORY_COLORS[cat.category] || CATEGORY_COLORS['Other']}`} 
                            style={{ width: `${cat.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Person Breakdown */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-bold text-gray-900">Who Paid What</h3>
              </div>
              <div className="p-6">
                {expensesByPerson.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No expenses yet.</p>
                ) : (
                  <div className="space-y-4">
                    {expensesByPerson.map((person) => (
                      <div key={person.name} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-semibold text-gray-900">{person.name}</p>
                        </div>
                        <p className="font-bold text-gray-900 text-lg">₹{person.amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
