import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, CheckSquare, Check, Trash2, Globe, Lock } from 'lucide-react';
import AddChecklistModal from '../components/checklist/AddChecklistModal';

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  is_shared: boolean;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

const Checklist: React.FC = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchItems = async () => {
    if (!tripId || !user) return;
    setLoading(true);
    
    // Fetch user's private items AND all shared items
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*, profiles(full_name)')
      .eq('trip_id', tripId)
      .or(`user_id.eq.${user.id},is_shared.eq.true`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching checklist items:', error);
    } else {
      setItems(data as any || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [tripId, user]);

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setItems(items.map(item => item.id === id ? { ...item, completed: !currentStatus } : item));
    
    const { error } = await supabase
      .from('checklist_items')
      .update({ completed: !currentStatus })
      .eq('id', id);
      
    if (error) {
      console.error("Failed to toggle status:", error);
      // Revert on error
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    setItems(items.filter(item => item.id !== id));
    
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Failed to delete item:", error);
      fetchItems();
    }
  };

  const pendingItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  const renderItem = (item: ChecklistItem) => (
    <li key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 group transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => toggleComplete(item.id, item.completed)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${item.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-transparent hover:border-blue-500'}`}
        >
          <Check className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${item.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {item.is_shared ? (
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                <Globe className="h-3 w-3" /> Group
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                <Lock className="h-3 w-3" /> Personal
              </span>
            )}
            <span className="text-xs text-gray-500">Added by {item.user_id === user?.id ? 'You' : item.profiles?.full_name}</span>
          </div>
        </div>
      </div>
      <button 
        onClick={() => deleteItem(item.id)}
        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
        title="Delete item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Packing & To-Do List</h1>
          <p className="text-sm text-gray-500 mt-1">Keep track of what you need for the trip.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Add Item
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-200">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">Your checklist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Add tasks or packing items for yourself or the group.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add Item
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">To Do</h3>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                {pendingItems.length}
              </span>
            </div>
            {pendingItems.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {pendingItems.map(renderItem)}
              </ul>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                All caught up! Nothing to do here.
              </div>
            )}
          </div>

          {completedItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden opacity-75">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">Completed</h3>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
                  {completedItems.length}
                </span>
              </div>
              <ul className="divide-y divide-gray-100">
                {completedItems.map(renderItem)}
              </ul>
            </div>
          )}
        </div>
      )}

      <AddChecklistModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={tripId || ''}
        onItemAdded={fetchItems}
      />
    </div>
  );
};

export default Checklist;
