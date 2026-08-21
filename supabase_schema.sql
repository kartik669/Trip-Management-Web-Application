-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  username text unique not null,
  avatar_url text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Trips Table
create table if not exists trips (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  description text,
  budget numeric(12, 2),
  cover_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Trip Members Table
create table if not exists trip_members (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member')) default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(trip_id, user_id)
);

-- 4. Trip Invitations Table
create table if not exists trip_invitations (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  invited_email text not null,
  invited_by uuid references profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected', 'expired')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

-- 5. Expenses Table
create table if not exists expenses (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  title text not null,
  amount numeric(12, 2) not null,
  category text not null,
  paid_by uuid references profiles(id) on delete cascade not null,
  description text,
  expense_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Expense Participants Table
create table if not exists expense_participants (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  share_amount numeric(12, 2) not null,
  percentage numeric(5, 2),
  unique(expense_id, user_id)
);

-- 7. Settlements Table
create table if not exists settlements (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  payer_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  amount numeric(12, 2) not null,
  status text check (status in ('pending', 'paid', 'cancelled')) default 'pending' not null,
  receipt_url text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Notes Table
create table if not exists notes (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  content text,
  attachment_url text,
  is_pinned boolean default false,
  is_archived boolean default false,
  visibility text check (visibility in ('private', 'shared')) default 'private' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Checklist Items Table
create table if not exists checklist_items (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  is_shared boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Itinerary Events Table
create table if not exists itinerary_events (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  title text not null,
  location text,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Bookings Table
create table if not exists bookings (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references trips(id) on delete cascade not null,
  created_by uuid references profiles(id) on delete cascade not null,
  title text not null,
  type text not null,
  booking_id text,
  booking_date date,
  booking_time time,
  location text,
  amount numeric(12, 2),
  notes text,
  document_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Notifications Table
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  trip_id uuid references trips(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table trip_invitations enable row level security;
alter table expenses enable row level security;
alter table expense_participants enable row level security;
alter table settlements enable row level security;
alter table notes enable row level security;
alter table checklist_items enable row level security;
alter table itinerary_events enable row level security;
alter table bookings enable row level security;
alter table notifications enable row level security;

-- ==========================================
-- RLS POLICIES (With Drop Statements for Safe Re-runs)
-- ==========================================

-- PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
create policy "Profiles are viewable by everyone" on profiles for select using (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- TRIPS
DROP POLICY IF EXISTS "Users can view their trips" ON trips;
create policy "Users can view their trips" on trips for select using (
  auth.uid() = owner_id or
  exists (
    select 1 from trip_members 
    where trip_members.trip_id = trips.id 
    and trip_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create trips" ON trips;
create policy "Users can create trips" on trips for insert with check (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners and admins can update trips" ON trips;
create policy "Owners and admins can update trips" on trips for update using (
  exists (
    select 1 from trip_members 
    where trip_members.trip_id = trips.id 
    and trip_members.user_id = auth.uid() 
    and trip_members.role in ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Owners can delete trips" ON trips;
create policy "Owners can delete trips" on trips for delete using (auth.uid() = owner_id);

-- TRIP MEMBERS
DROP POLICY IF EXISTS "Anyone can view trip members" ON trip_members;
DROP POLICY IF EXISTS "Members can view trip members" ON trip_members;
create policy "Anyone can view trip members" on trip_members for select using (true);

DROP POLICY IF EXISTS "Users can insert themselves as owner" ON trip_members;
create policy "Users can insert themselves as owner" on trip_members for insert with check (auth.uid() = user_id and role = 'owner');

DROP POLICY IF EXISTS "Owners can add members" ON trip_members;
create policy "Owners can add members" on trip_members for insert with check (
  exists (
    select 1 from trips
    where trips.id = trip_members.trip_id
    and trips.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can update members" ON trip_members;
create policy "Owners can update members" on trip_members for update using (
  exists (
    select 1 from trips
    where trips.id = trip_members.trip_id
    and trips.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can leave or owners can remove" ON trip_members;
DROP POLICY IF EXISTS "Users can leave trip" ON trip_members;
create policy "Users can leave or owners can remove" on trip_members for delete using (
  auth.uid() = user_id or 
  exists (
    select 1 from trips
    where trips.id = trip_members.trip_id
    and trips.owner_id = auth.uid()
  )
);

-- EXPENSES
DROP POLICY IF EXISTS "Members can view expenses" ON expenses;
create policy "Members can view expenses" on expenses for select using (
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = expenses.trip_id 
    and tm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can add expenses" ON expenses;
create policy "Members can add expenses" on expenses for insert with check (
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = expenses.trip_id 
    and tm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can update expenses" ON expenses;
create policy "Members can update expenses" on expenses for update using (
  paid_by = auth.uid() or 
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = expenses.trip_id 
    and tm.user_id = auth.uid() 
    and tm.role in ('owner', 'admin')
  )
);

DROP POLICY IF EXISTS "Members can delete expenses" ON expenses;
create policy "Members can delete expenses" on expenses for delete using (
  paid_by = auth.uid() or 
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = expenses.trip_id 
    and tm.user_id = auth.uid() 
    and tm.role in ('owner', 'admin')
  )
);

-- EXPENSE PARTICIPANTS
DROP POLICY IF EXISTS "Members can view expense participants" ON expense_participants;
create policy "Members can view expense participants" on expense_participants for select using (
  exists (
    select 1 from expenses e
    join trip_members tm on e.trip_id = tm.trip_id
    where e.id = expense_participants.expense_id
    and tm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can manage expense participants" ON expense_participants;
create policy "Members can manage expense participants" on expense_participants for all using (
  exists (
    select 1 from expenses e
    join trip_members tm on e.trip_id = tm.trip_id
    where e.id = expense_participants.expense_id
    and (e.paid_by = auth.uid() or tm.role in ('owner', 'admin'))
  )
);

-- SETTLEMENTS
DROP POLICY IF EXISTS "Members can view settlements" ON settlements;
create policy "Members can view settlements" on settlements for select using (
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = settlements.trip_id 
    and tm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can manage settlements" ON settlements;
create policy "Members can manage settlements" on settlements for all using (
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = settlements.trip_id 
    and tm.user_id = auth.uid()
  )
);

-- NOTES
DROP POLICY IF EXISTS "Users can view notes" ON notes;
create policy "Users can view notes" on notes for select using (
  user_id = auth.uid() or 
  (
    visibility = 'shared' and exists (
      select 1 from trip_members tm 
      where tm.trip_id = notes.trip_id 
      and tm.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Members can insert notes" ON notes;
create policy "Members can insert notes" on notes for insert with check (
  user_id = auth.uid() and exists (
    select 1 from trip_members tm 
    where tm.trip_id = notes.trip_id 
    and tm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
create policy "Users can manage own notes" on notes for update using (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
create policy "Users can delete own notes" on notes for delete using (user_id = auth.uid());

-- CHECKLIST ITEMS
DROP POLICY IF EXISTS "Users can view checklist items" ON checklist_items;
create policy "Users can view checklist items" on checklist_items for select using (
  user_id = auth.uid() or 
  (
    is_shared = true and exists (
      select 1 from trip_members tm 
      where tm.trip_id = checklist_items.trip_id 
      and tm.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Members can insert checklist items" ON checklist_items;
create policy "Members can insert checklist items" on checklist_items for insert with check (
  user_id = auth.uid() and exists (
    select 1 from trip_members tm 
    where tm.trip_id = checklist_items.trip_id 
    and tm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Manage checklist items" ON checklist_items;
create policy "Manage checklist items" on checklist_items for all using (
  user_id = auth.uid() or
  (
    is_shared = true and exists (
      select 1 from trip_members tm 
      where tm.trip_id = checklist_items.trip_id 
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'admin')
    )
  )
);

-- ITINERARY EVENTS
DROP POLICY IF EXISTS "Members can view itinerary" ON itinerary_events;
create policy "Members can view itinerary" on itinerary_events for select using (
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = itinerary_events.trip_id 
    and tm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can manage itinerary" ON itinerary_events;
create policy "Members can manage itinerary" on itinerary_events for all using (
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = itinerary_events.trip_id 
    and tm.user_id = auth.uid()
  )
);

-- BOOKINGS
DROP POLICY IF EXISTS "Members can view bookings" ON bookings;
create policy "Members can view bookings" on bookings for select using (
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = bookings.trip_id 
    and tm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can manage bookings" ON bookings;
create policy "Members can manage bookings" on bookings for all using (
  exists (
    select 1 from trip_members tm 
    where tm.trip_id = bookings.trip_id 
    and tm.user_id = auth.uid()
  )
);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
create policy "Users can view own notifications" on notifications for select using (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
create policy "Users can update own notifications" on notifications for update using (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
create policy "Users can delete own notifications" on notifications for delete using (user_id = auth.uid());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON checklist_items;
CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_itinerary_events_updated_at ON itinerary_events;
CREATE TRIGGER update_itinerary_events_updated_at BEFORE UPDATE ON itinerary_events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- AUTO PROFILE CREATION TRIGGER
-- ==========================================
-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 6))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- STORAGE BUCKETS & POLICIES
-- ==========================================

-- Create note_attachments bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('note_attachments', 'note_attachments', true)
on conflict (id) do nothing;

-- RLS for storage
create policy "Anyone can view note attachments"
  on storage.objects for select
  using ( bucket_id = 'note_attachments' );

create policy "Authenticated users can upload note attachments"
  on storage.objects for insert
  with check ( bucket_id = 'note_attachments' and auth.role() = 'authenticated' );

create policy "Users can update their own note attachments"
  on storage.objects for update
  using ( bucket_id = 'note_attachments' and auth.uid() = owner );

create policy "Users can delete their own note attachments"
  on storage.objects for delete
  using ( bucket_id = 'note_attachments' and auth.uid() = owner );

-- Create receipts bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- RLS for receipts storage
create policy "Anyone can view receipts"
  on storage.objects for select
  using ( bucket_id = 'receipts' );

create policy "Authenticated users can upload receipts"
  on storage.objects for insert
  with check ( bucket_id = 'receipts' and auth.role() = 'authenticated' );

create policy "Users can update their own receipts"
  on storage.objects for update
  using ( bucket_id = 'receipts' and auth.uid() = owner );

create policy "Users can delete their own receipts"
  on storage.objects for delete
  using ( bucket_id = 'receipts' and auth.uid() = owner );
