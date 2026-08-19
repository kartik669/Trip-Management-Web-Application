import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';

import Trips from './pages/Trips';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Members from './pages/Members';
import Itinerary from './pages/Itinerary';
import Bookings from './pages/Bookings';
import Notes from './pages/Notes';
import Checklist from './pages/Checklist';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />

          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Trips />} />
            
            <Route path="/trip/:tripId" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="members" element={<Members />} />
              <Route path="itinerary" element={<Itinerary />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="notes" element={<Notes />} />
              <Route path="checklist" element={<Checklist />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              {/* Add more trip specific routes here */}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
