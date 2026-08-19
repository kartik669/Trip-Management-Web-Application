import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CreditCard, Users, Map, Plus } from 'lucide-react';

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tripData?.name || 'Loading...'}</h1>
            <p className="mt-2 text-gray-600">Good morning, {user?.user_metadata?.full_name || user?.email?.split('@')[0]} 👋</p>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">₹{totalSpent.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Your Balance</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">₹0.00</p>
            <p className="text-xs text-gray-500 mt-1">Pending Settlements</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Members</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{memberCount}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Budget</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{tripData?.budget ? `₹${tripData.budget}` : 'Not set'}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to={`/trip/${tripId}/expenses`} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 hover:ring-blue-500 hover:shadow-md transition-all">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Manage Expenses</p>
              <p className="text-sm text-gray-500">Add or split costs</p>
            </div>
          </Link>
          <Link to={`/trip/${tripId}/members`} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 hover:ring-blue-500 hover:shadow-md transition-all">
            <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Invite Friends</p>
              <p className="text-sm text-gray-500">{memberCount} members currently</p>
            </div>
          </Link>
          <Link to={`/trip/${tripId}/itinerary`} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 hover:ring-blue-500 hover:shadow-md transition-all">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Itinerary</p>
              <p className="text-sm text-gray-500">Plan your trip</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
