import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Shield, User } from 'lucide-react';
import InviteMemberModal from '../components/members/InviteMemberModal';
import { format } from 'date-fns';

interface TripMember {
  id: string;
  role: string;
  joined_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    username: string;
  };
}

const Members: React.FC = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  const fetchMembers = async () => {
    if (!tripId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('trip_members')
      .select(`
        id,
        role,
        joined_at,
        user_id,
        profiles (
          full_name,
          username
        )
      `)
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      setMembers(data as any || []);
      const myRole = data?.find(m => m.user_id === user?.id)?.role;
      if (myRole) setCurrentUserRole(myRole);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [tripId, user]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Members</h1>
          <p className="text-sm text-gray-500 mt-1">Manage who has access to this trip.</p>
        </div>
        {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            <UserPlus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Add Member
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members.map((member) => (
              <li key={member.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-lg font-bold">
                    {member.profiles?.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {member.profiles?.full_name}
                      {member.user_id === user?.id && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">@{member.profiles?.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm font-medium text-gray-900">{format(new Date(member.joined_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                    member.role === 'admin' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {member.role === 'owner' ? <Shield className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    <span className="capitalize">{member.role}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <InviteMemberModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        tripId={tripId || ''}
        onMemberAdded={fetchMembers}
      />
    </div>
  );
};

export default Members;
