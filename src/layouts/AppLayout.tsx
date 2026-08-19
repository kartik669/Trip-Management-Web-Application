import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  Users, 
  Map, 
  Ticket, 
  BookOpen, 
  CheckSquare, 
  BarChart3, 
  Settings,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tripName, setTripName] = useState('Loading Trip...');

  useEffect(() => {
    if (tripId) {
      supabase.from('trips').select('name').eq('id', tripId).single().then(({ data }) => {
        if (data) setTripName(data.name);
      });
    }
  }, [tripId]);

  const navigation = [
    { name: 'Dashboard', href: `/trip/${tripId}`, icon: Home, exact: true },
    { name: 'Expenses', href: `/trip/${tripId}/expenses`, icon: CreditCard },
    { name: 'Members', href: `/trip/${tripId}/members`, icon: Users },
    { name: 'Itinerary', href: `/trip/${tripId}/itinerary`, icon: Map },
    { name: 'Bookings', href: `/trip/${tripId}/bookings`, icon: Ticket },
    { name: 'My Notes', href: `/trip/${tripId}/notes`, icon: BookOpen },
    { name: 'Checklist', href: `/trip/${tripId}/checklist`, icon: CheckSquare },
    { name: 'Reports', href: `/trip/${tripId}/reports`, icon: BarChart3 },
    { name: 'Settings', href: `/trip/${tripId}/settings`, icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex h-16 shrink-0 items-center px-6">
              <span className="text-xl font-bold text-blue-600">Trip Buddy</span>
              <button 
                className="ml-auto text-gray-500" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto px-6 py-4">
              <ul className="flex flex-1 flex-col gap-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                        }`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white lg:pb-4">
        <div className="flex h-16 shrink-0 items-center px-6">
          <span className="text-xl font-bold text-blue-600">Trip Buddy</span>
        </div>
        <div className="px-6 py-2 border-b border-gray-100">
           <button onClick={() => navigate('/dashboard')} className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2">
             <ArrowLeft className="w-4 h-4 mr-1" /> All Trips
           </button>
           <h2 className="font-semibold text-gray-900 truncate" title={tripName}>{tripName}</h2>
        </div>
        <nav className="mt-4 flex flex-1 flex-col px-6">
          <ul className="flex flex-1 flex-col gap-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* User profile section at bottom */}
        <div className="mt-auto px-6 pt-4 border-t border-gray-200">
           <div className="flex items-center gap-x-3 py-2 text-sm font-semibold leading-6 text-gray-900">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{user?.email}</span>
           </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 justify-between items-center font-semibold text-gray-900">
             <span className="truncate max-w-[200px]">{tripName}</span>
             <button onClick={() => navigate('/dashboard')} className="text-sm text-blue-600">
                All Trips
             </button>
          </div>
        </div>

        <main className="flex-1 pb-16 lg:pb-0 overflow-y-auto">
          <Outlet />
        </main>
        
        {/* Mobile bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
           <div className="flex h-16 items-center justify-around px-2">
              {[
                navigation[0], // Home
                navigation[1], // Expenses
                navigation[5], // Notes
                navigation[8]  // Settings
              ].map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center justify-center space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </Link>
                )
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
