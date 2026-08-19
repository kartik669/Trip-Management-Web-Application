import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CreditCard, Users, Map } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { tripId } = useParams();
  
  const [tripData, setTripData] = useState<any>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [memberCount, setMemberCount] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      
      // Fetch Trip info
      const { data: trip } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();
        
      if (trip) setTripData(trip);

      // Fetch total expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('trip_id', tripId);
        
      if (expenses) {
        const sum = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
        setTotalSpent(sum);
      }

      // Fetch member count
      const { count } = await supabase
        .from('trip_members')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', tripId);
        
      if (count !== null) setMemberCount(count);

      setLoading(false);
    };

    fetchDashboardData();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{tripData?.name || 'Loading...'}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Good morning, {user?.user_metadata?.full_name || user?.email?.split('@')[0]} 👋</p>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">₹{totalSpent.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Balance</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">₹0.00</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Pending Settlements</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Members</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{memberCount}</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{tripData?.budget ? `₹${tripData.budget}` : 'Not set'}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to={`/trip/${tripId}/expenses`} className="flex items-center gap-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-blue-500 dark:hover:ring-blue-500 hover:shadow-md transition-all">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-3 text-blue-600 dark:text-blue-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Manage Expenses</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add or split costs</p>
            </div>
          </Link>
          <Link to={`/trip/${tripId}/members`} className="flex items-center gap-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-blue-500 dark:hover:ring-blue-500 hover:shadow-md transition-all">
            <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 p-3 text-indigo-600 dark:text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Invite Friends</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{memberCount} members currently</p>
            </div>
          </Link>
          <Link to={`/trip/${tripId}/itinerary`} className="flex items-center gap-4 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 hover:ring-blue-500 dark:hover:ring-blue-500 hover:shadow-md transition-all">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 p-3 text-emerald-600 dark:text-emerald-400">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Itinerary</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Plan your trip</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
