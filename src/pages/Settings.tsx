import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!tripId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) {
        console.error('Error fetching trip details:', error);
      } else if (data) {
        setName(data.name);
        setDestination(data.destination);
        setStartDate(data.start_date);
        setEndDate(data.end_date);
        setBudget(data.budget ? String(data.budget) : '');
        
        if (user && data.owner_id === user.id) {
          setIsOwner(true);
        }
      }
      setLoading(false);
    };

    fetchTripDetails();
  }, [tripId, user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setError("Only the trip owner can update settings.");
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from('trips')
      .update({
        name,
        destination,
        start_date: startDate,
        end_date: endDate,
        budget: budget ? parseFloat(budget) : null
      })
      .eq('id', tripId);

    if (updateError) {
      setError("Failed to update trip details.");
      console.error(updateError);
    } else {
      setSuccess("Trip settings updated successfully!");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    
    const confirmDelete = window.confirm("Are you absolutely sure you want to delete this trip? This action cannot be undone and will delete all expenses, notes, and bookings associated with it.");
    
    if (confirmDelete) {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);
        
      if (!error) {
        navigate('/dashboard');
      } else {
        setError("Failed to delete trip.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="text-center bg-white rounded-xl shadow-sm p-12">
          <SettingsIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-500">Only the Trip Owner can change the settings or delete the trip.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trip Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your trip details and preferences.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden mb-8">
        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Trip Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Destination</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Total Budget (₹)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="block w-full rounded-md border-0 py-2 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-red-50 rounded-xl shadow-sm ring-1 ring-red-200 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h3>
          <p className="mt-2 text-sm text-red-700 mb-4">
            Once you delete a trip, there is no going back. Please be certain. All expenses, itinerary events, and notes will be permanently deleted.
          </p>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
          >
            <Trash2 className="h-4 w-4" />
            Delete Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
