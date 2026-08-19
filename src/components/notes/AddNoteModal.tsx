import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, BookOpen, Lock, Globe } from 'lucide-react';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onNoteAdded: () => void;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({ isOpen, onClose, tripId, onNoteAdded }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('private');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title || !user) {
      setError("Please provide a title for your note.");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('notes')
        .insert({
          trip_id: tripId,
          user_id: user.id,
          title,
          content,
          visibility
        });

      if (insertError) throw insertError;

      onNoteAdded();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setVisibility('private');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold leading-6 text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Add Note
          </h3>
          <button
            onClick={handleClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
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
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Title
            </label>
            <div className="mt-1">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="e.g., Ideas for Paris"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Content
            </label>
            <div className="mt-1">
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Jot down some ideas, addresses, or travel tips..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setVisibility('private')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${visibility === 'private' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
              >
                <Lock className={`h-5 w-5 ${visibility === 'private' ? 'text-blue-600' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-sm font-semibold ${visibility === 'private' ? 'text-blue-900' : 'text-gray-900'}`}>Private</p>
                  <p className="text-xs text-gray-500 mt-0.5">Only you can see this.</p>
                </div>
              </div>
              <div 
                onClick={() => setVisibility('shared')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${visibility === 'shared' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
              >
                <Globe className={`h-5 w-5 ${visibility === 'shared' ? 'text-blue-600' : 'text-gray-500'}`} />
                <div>
                  <p className={`text-sm font-semibold ${visibility === 'shared' ? 'text-blue-900' : 'text-gray-900'}`}>Shared</p>
                  <p className="text-xs text-gray-500 mt-0.5">Everyone in the trip can read this.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
