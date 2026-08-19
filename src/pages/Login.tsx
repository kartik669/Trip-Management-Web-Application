import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setError(null);
    
    // Create deterministic email and password from name
    const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '');
    const email = `${normalizedName}@dummy.example.com`;
    const password = `tripapp_${normalizedName}_123!`;
    
    try {
      // 1. Try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (signInError) {
        // If it's an invalid credentials error, the user might not exist yet. Let's sign them up.
        if (signInError.message.toLowerCase().includes('invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              data: {
                full_name: name.trim()
              }
            }
          });
          
          if (signUpError) throw signUpError;
          
          // Add to profiles table
          if (signUpData.user) {
             const { error: profileError } = await supabase.from('profiles').insert([
               {
                 id: signUpData.user.id,
                 full_name: name.trim(),
                 username: normalizedName + Math.floor(Math.random() * 1000)
               }
             ]);
             if (profileError) throw profileError;
          }
        } else {
          throw signInError;
        }
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to enter the app. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Plane className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Trip Buddy</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your name to continue</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="sr-only">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70"
            >
              {loading ? 'Entering...' : 'Enter App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
