import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Ticket, Plane, Home, Train, Bus, Car, Tag, CalendarIcon, Hash, MapPin, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import AddBookingModal from '../components/bookings/AddBookingModal';

interface Booking {
  id: string;
  title: string;
  type: string;
  booking_id: string;
  booking_date: string;
  booking_time: string;
  location: string;
  amount: number;
  notes: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Flight: <Plane className="h-6 w-6" />,
  Hotel: <Home className="h-6 w-6" />,
  Train: <Train className="h-6 w-6" />,
  Bus: <Bus className="h-6 w-6" />,
  'Rental Car': <Car className="h-6 w-6" />,
  Activity: <Tag className="h-6 w-6" />,
  Other: <Ticket className="h-6 w-6" />
};

const TYPE_COLORS: Record<string, string> = {
  Flight: 'bg-sky-100 text-sky-600',
  Hotel: 'bg-indigo-100 text-indigo-600',
  Train: 'bg-emerald-100 text-emerald-600',
  Bus: 'bg-orange-100 text-orange-600',
  'Rental Car': 'bg-rose-100 text-rose-600',
  Activity: 'bg-pink-100 text-pink-600',
  Other: 'bg-gray-100 text-gray-600'
};

const Bookings: React.FC = () => {
  const { tripId } = useParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchBookings = async () => {
    if (!tripId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('trip_id', tripId)
      .order('booking_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [tripId]);

  const deleteBooking = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this reservation?")) return;
    
    setBookings(bookings.filter(b => b.id !== id));
    
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      console.error("Error deleting booking:", error);
      fetchBookings();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations & Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Keep all your confirmation numbers in one place.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Add Reservation
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-200">
          <Ticket className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No reservations yet</h3>
          <p className="mt-1 text-sm text-gray-500">Save your flight PNRs, hotel bookings, and rental car confirmations here.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add Reservation
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow group relative">
              <button 
                onClick={() => deleteBooking(booking.id)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50 z-10"
                title="Delete Reservation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="p-5 border-b border-gray-100 flex items-start gap-4 pr-12">
                <div className={`p-3 rounded-xl ${TYPE_COLORS[booking.type] || TYPE_COLORS['Other']}`}>
                  {TYPE_ICONS[booking.type] || TYPE_ICONS['Other']}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate" title={booking.title}>{booking.title}</h3>
                  <p className="text-sm font-medium text-gray-500">{booking.type}</p>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-4 bg-gray-50/50">
                {booking.booking_id && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center ring-1 ring-gray-200 shadow-sm shrink-0">
                      <Hash className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Confirmation / PNR</p>
                      <p className="text-sm font-mono font-bold text-gray-900 uppercase tracking-wider">{booking.booking_id}</p>
                    </div>
                  </div>
                )}
                
                {(booking.booking_date || booking.booking_time) && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center ring-1 ring-gray-200 shadow-sm shrink-0">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date & Time</p>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.booking_date ? format(parseISO(booking.booking_date), 'MMM d, yyyy') : ''}
                        {booking.booking_date && booking.booking_time ? ' at ' : ''}
                        {booking.booking_time ? format(parseISO(`2000-01-01T${booking.booking_time}`), 'h:mm a') : ''}
                      </p>
                    </div>
                  </div>
                )}

                {booking.location && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center ring-1 ring-gray-200 shadow-sm shrink-0">
                      <MapPin className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900 truncate" title={booking.location}>{booking.location}</p>
                    </div>
                  </div>
                )}

                {booking.notes && (
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 line-clamp-2" title={booking.notes}>{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddBookingModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={tripId || ''}
        onBookingAdded={fetchBookings}
      />
    </div>
  );
};

export default Bookings;
