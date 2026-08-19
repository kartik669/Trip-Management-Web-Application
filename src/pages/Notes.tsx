import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, BookOpen, Lock, Globe, Pin, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import AddNoteModal from '../components/notes/AddNoteModal';

interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  visibility: string;
  attachment_url?: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

const Notes: React.FC = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchNotes = async () => {
    if (!tripId || !user) return;
    setLoading(true);
    
    // Fetch user's private notes AND all shared notes
    const { data, error } = await supabase
      .from('notes')
      .select('*, profiles(full_name)')
      .eq('trip_id', tripId)
      .or(`user_id.eq.${user.id},visibility.eq.shared`)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      setNotes(data as any || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [tripId, user]);

  const deleteNote = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    setNotes(notes.filter(n => n.id !== id));
    
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) {
      console.error("Error deleting note:", error);
      fetchNotes();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Jot down ideas, places to visit, or travel tips.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Add Note
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-200">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No notes yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create private notes for yourself or share ideas with the group.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add Note
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div key={note.id} className="bg-yellow-50 rounded-xl shadow-sm ring-1 ring-yellow-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative group">
              <button 
                onClick={() => deleteNote(note.id)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50 z-10"
                title="Delete Note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {note.is_pinned && (
                <div className="absolute top-4 right-4 text-red-500 group-hover:opacity-0 transition-opacity">
                  <Pin className="h-5 w-5 fill-current" />
                </div>
              )}
              <div className="p-5 flex-1 pr-12">
                <div className="flex items-center gap-2 mb-3">
                  {note.visibility === 'private' ? (
                    <span className="inline-flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
                      <Lock className="h-3 w-3" /> Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
                      <Globe className="h-3 w-3" /> Shared
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 pr-6">{note.title}</h3>
                {note.content && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                )}
                {note.attachment_url && (
                  <div className="mt-4 pt-4 border-t border-yellow-200/50">
                    {note.attachment_url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) != null ? (
                      <a href={note.attachment_url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">
                        <img 
                          src={note.attachment_url} 
                          alt="Attachment" 
                          className="rounded-lg max-h-48 object-cover w-full bg-white shadow-sm ring-1 ring-gray-900/5" 
                        />
                      </a>
                    ) : (
                      <a 
                        href={note.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50/80 rounded-lg hover:bg-blue-100 transition-colors w-full ring-1 ring-blue-700/10"
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="truncate flex-1 text-left">View Attached File</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="px-5 py-3 bg-yellow-100/50 border-t border-yellow-200/50 flex items-center justify-between">
                <span className="text-xs text-gray-500">By {note.user_id === user?.id ? 'You' : note.profiles?.full_name}</span>
                <span className="text-xs text-gray-500">{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddNoteModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={tripId || ''}
        onNoteAdded={fetchNotes}
      />
    </div>
  );
};

export default Notes;
