import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Calendar, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CreateTripModal from '../components/trips/CreateTripModal';
import { format } from 'date-fns';
import ThemeToggle from '../components/ThemeToggle';

interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
}

const Trips: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTrips = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('trips')
      .select('id, name, destination, start_date, end_date')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching trips:', error);
    } else {
      setTrips(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Your Trips</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Select a trip to view its dashboard.</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="inline-flex items-center gap-x-2 rounded-md bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              <LogOut className="-ml-0.5 h-4 w-4" aria-hidden="true" />
              Logout
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              New Trip
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center rounded-xl bg-white dark:bg-gray-900 p-12 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 transition-colors">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">No trips yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first trip.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Create Trip
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white dark:bg-gray-900 p-6 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 transition-all hover:shadow-md hover:ring-blue-500 dark:hover:ring-blue-500"
              >
                <div>
                  <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {trip.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    <span className="truncate">{trip.destination}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    <span>
                      {format(new Date(trip.start_date), 'MMM d, yyyy')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateTripModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTripCreated={fetchTrips}
      />
    </div>
  );
};

export default Trips;
