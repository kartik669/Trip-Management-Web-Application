import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X } from 'lucide-react';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: () => void;
}

const CreateTripModal: React.FC<CreateTripModalProps> = ({ isOpen, onClose, onTripCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    budget: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Create Trip
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert({
          owner_id: user.id,
          name: formData.name,
          destination: formData.destination,
          start_date: formData.startDate,
          end_date: formData.endDate,
          description: formData.description,
          budget: formData.budget ? parseFloat(formData.budget) : null,
        })
        .select()
        .single();

      if (tripError) throw tripError;

      // 2. Add owner as member
      const { error: memberError } = await supabase
        .from('trip_members')
        .insert({
          trip_id: tripData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      onTripCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred creating the trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50" onClick={onClose}></div>
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Trip</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Trip Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-0 dark:bg-gray-800 py-1.5 px-3 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" 
              placeholder="e.g. Hyderabad Trip 2026" />
          </div>
          
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Destination</label>
            <input type="text" name="destination" required value={formData.destination} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-0 dark:bg-gray-800 py-1.5 px-3 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Start Date</label>
              <input type="date" name="startDate" required value={formData.startDate} onChange={handleChange}
                className="mt-1 block w-full rounded-md border-0 dark:bg-gray-800 py-1.5 px-3 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">End Date</label>
              <input type="date" name="endDate" required value={formData.endDate} onChange={handleChange}
                className="mt-1 block w-full rounded-md border-0 dark:bg-gray-800 py-1.5 px-3 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Budget (Optional)</label>
            <input type="number" name="budget" value={formData.budget} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-0 dark:bg-gray-800 py-1.5 px-3 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" 
              placeholder="e.g. 50000" />
          </div>
          
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Description</label>
            <textarea name="description" rows={3} value={formData.description} onChange={handleChange}
              className="mt-1 block w-full rounded-md border-0 dark:bg-gray-800 py-1.5 px-3 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-70">
              {loading ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTripModal;
