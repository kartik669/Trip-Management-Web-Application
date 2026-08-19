import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, UserPlus, Search } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onMemberAdded: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, tripId, onMemberAdded }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearchAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError("Please enter an email address.");
      setLoading(false);
      return;
    }

    try {
      // 1. Search for user in auth.users? We can't query auth.users directly from client.
      // But we CAN query public.profiles if we assume email is stored or we can just try to search by username
      // Wait, profiles doesn't have email in our schema!
      // Since we don't have email in profiles, let's just ask them to type the EXACT full_name or username.
      // But they usually know the email. Let's try searching by username for now to be safe.
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .or(`username.eq.${email},full_name.ilike.%${email}%`)
        .limit(1)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        setError("User not found! Tell them to register on the app first, and search by their exact Username or Name.");
        setLoading(false);
        return;
      }

      // 2. Insert into trip_members
      const { error: insertError } = await supabase
        .from('trip_members')
        .insert({
          trip_id: tripId,
          user_id: profileData.id,
          role: 'member'
        });

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          setError(`${profileData.full_name} is already a member of this trip!`);
        } else {
          throw insertError;
        }
      } else {
        setSuccessMessage(`Successfully added ${profileData.full_name}!`);
        onMemberAdded();
        setTimeout(() => {
          handleClose();
        }, 1500);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold leading-6 text-gray-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Add Member
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
        
        {successMessage && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSearchAndAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Search by Username or Name
            </label>
            <p className="text-xs text-gray-500 mb-2">They must have an account on Trip Buddy first.</p>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="e.g., kartik or John Doe"
              />
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
              disabled={loading || !!successMessage}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Add to Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
