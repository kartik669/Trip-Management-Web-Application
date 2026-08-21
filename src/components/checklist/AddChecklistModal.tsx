import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, CheckSquare, Globe, Lock } from 'lucide-react';

interface AddChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onItemAdded: () => void;
}

const AddChecklistModal: React.FC<AddChecklistModalProps> = ({ isOpen, onClose, tripId, onItemAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [isShared, setIsShared] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title || !user) {
      setError("Please provide a title for your checklist item.");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('checklist_items')
        .insert({
          trip_id: tripId,
          user_id: user.id,
          title,
          is_shared: isShared,
          completed: false
        });

      if (insertError) throw insertError;

      onItemAdded();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setIsShared(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            Add Checklist Item
          </h3>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-600"
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
              What do you need to do or pack?
            </label>
            <div className="mt-1">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="e.g., Don't forget passports!"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setIsShared(false)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${!isShared ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Lock className={`h-5 w-5 ${!isShared ? 'text-blue-600' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-sm font-semibold ${!isShared ? 'text-blue-900' : 'text-gray-900 dark:text-gray-100'}`}>Personal</p>
                  <p className="text-xs text-gray-500 mt-0.5">My to-do list</p>
                </div>
              </div>
              <div 
                onClick={() => setIsShared(true)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${isShared ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Globe className={`h-5 w-5 ${isShared ? 'text-blue-600' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-sm font-semibold ${isShared ? 'text-blue-900' : 'text-gray-900 dark:text-gray-100'}`}>Group</p>
                  <p className="text-xs text-gray-500 mt-0.5">Group task</p>
                </div>
              </div>
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
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChecklistModal;
