import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Calendar as CalendarIcon, MapPin, Clock, Plane, Home, Utensils, Tag, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import AddEventModal from '../components/itinerary/AddEventModal';

interface ItineraryEvent {
  id: string;
  title: string;
  location: string;
  description: string;
  start_time: string;
  end_time: string;
  category: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Flight: <Plane className="h-5 w-5" />,
  Accommodation: <Home className="h-5 w-5" />,
  Dining: <Utensils className="h-5 w-5" />,
  Activity: <Tag className="h-5 w-5" />,
  Transit: <Clock className="h-5 w-5" />,
  Other: <CalendarIcon className="h-5 w-5" />
};

const CATEGORY_COLORS: Record<string, string> = {
  Flight: 'bg-sky-100 text-sky-600 border-sky-200',
  Accommodation: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  Dining: 'bg-orange-100 text-orange-600 border-orange-200',
  Activity: 'bg-pink-100 text-pink-600 border-pink-200',
  Transit: 'bg-gray-100 text-gray-600 border-gray-200',
  Other: 'bg-slate-100 text-slate-600 border-slate-200'
};

const Itinerary: React.FC = () => {
  const { tripId } = useParams();
  const [events, setEvents] = useState<ItineraryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchEvents = async () => {
    if (!tripId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('itinerary_events')
      .select('*')
      .eq('trip_id', tripId)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching itinerary events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [tripId]);

  // Group events by day
  const groupedEvents = events.reduce((acc, event) => {
    const day = format(parseISO(event.start_time), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {} as Record<string, ItineraryEvent[]>);

  const deleteEvent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    
    setEvents(events.filter(e => e.id !== id));
    
    const { error } = await supabase.from('itinerary_events').delete().eq('id', id);
    if (error) {
      console.error("Error deleting event:", error);
      fetchEvents();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trip Itinerary</h1>
          <p className="text-sm text-gray-500 mt-1">Plan your perfect schedule.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Add Event
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-200">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">No events scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first flight, hotel, or activity.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add Event
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([day, dayEvents], index) => (
            <div key={day} className="relative">
              <div className="sticky top-0 z-10 bg-gray-50 py-3 mb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">Day {index + 1}</span>
                  {format(parseISO(day), 'EEEE, MMMM d')}
                </h3>
              </div>
              
              <div className="space-y-4 pl-4 border-l-2 border-gray-200 ml-4">
                {dayEvents.map((event) => (
                  <div key={event.id} className="relative group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[25px] top-4 h-3 w-3 rounded-full bg-blue-500 border-2 border-white ring-2 ring-gray-100"></div>
                    
                    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden hover:shadow-md transition-shadow relative">
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50 z-10"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="p-5 flex flex-col sm:flex-row gap-4">
                        
                        {/* Time block */}
                        <div className="flex-shrink-0 sm:w-32 flex flex-col items-start sm:items-end sm:border-r border-gray-100 sm:pr-4">
                          <p className="font-bold text-gray-900">{format(parseISO(event.start_time), 'h:mm a')}</p>
                          <p className="text-sm text-gray-500">{format(parseISO(event.end_time), 'h:mm a')}</p>
                        </div>
                        
                        {/* Content block */}
                        <div className="flex-1 pr-8">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-lg font-bold text-gray-900">{event.title}</h4>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS['Other']}`}>
                              {CATEGORY_ICONS[event.category] || CATEGORY_ICONS['Other']}
                              <span className="hidden sm:inline">{event.category}</span>
                            </span>
                          </div>
                          
                          {event.location && (
                            <p className="mt-2 text-sm text-gray-600 flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {event.location}
                            </p>
                          )}
                          
                          {event.description && (
                            <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEventModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        tripId={tripId || ''}
        onEventAdded={fetchEvents}
      />
    </div>
  );
};

export default Itinerary;
