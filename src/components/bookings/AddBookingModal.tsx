import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Ticket, MapPin, Calendar, Clock, Hash, Tag } from 'lucide-react';

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onBookingAdded: () => void;
}

const BOOKING_TYPES = [
  'Flight',
  'Hotel',
  'Train',
  'Bus',
  'Rental Car',
  'Activity',
  'Other'
];

const AddBookingModal: React.FC<AddBookingModalProps> = ({ isOpen, onClose, tripId, onBookingAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Flight');
  const [bookingId, setBookingId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [location, setLocation] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title || !type || !user) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          trip_id: tripId,
          created_by: user.id,
          title,
          type,
          booking_id: bookingId || null,
          booking_date: bookingDate || null,
          booking_time: bookingTime || null,
          location: location || null,
          amount: amount ? parseFloat(amount) : null,
          notes: notes || null,
        });

      if (insertError) throw insertError;

      onBookingAdded();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add booking");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setType('Flight');
    setBookingId('');
    setBookingDate('');
    setBookingTime('');
    setLocation('');
    setAmount('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="relative w-full max-w-lg transform rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-600" />
            Add Reservation
          </h3>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-600"
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
              Provider / Title
            </label>
            <div className="mt-1">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-md border-0 dark:bg-gray-800 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="e.g., Delta Airlines or Hilton Hotel"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                Type
              </label>
              <div className="mt-1">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="block w-full rounded-md border-0 dark:bg-gray-800 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
                >
                  {BOOKING_TYPES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                <Hash className="h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                Confirmation # / PNR (Optional)
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="block w-full rounded-md border-0 dark:bg-gray-800 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 uppercase"
                  placeholder="e.g., AB123C"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                Date (Optional)
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 dark:bg-gray-800 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                Time (Optional)
              </label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-0 dark:bg-gray-800 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
              Location / Terminal (Optional)
            </label>
            <div className="mt-1">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full rounded-md border-0 dark:bg-gray-800 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="e.g., JFK Terminal 4 or 123 Main St"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              Amount Paid (Optional)
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full rounded-md border-0 dark:bg-gray-800 py-2 pl-7 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pr-3"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
              Additional Notes
            </label>
            <div className="mt-1">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full rounded-md border-0 dark:bg-gray-800 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Frequent flyer numbers, seat assignments, etc."
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
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookingModal;
