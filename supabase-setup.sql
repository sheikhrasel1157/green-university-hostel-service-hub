-- ============================================================
-- GREEN UNIVERSITY HOSTEL SERVICE HUB - DATABASE REBUILD SCRIPT
-- Re-writes table schemas, drops existing tables, creates all indexes,
-- triggers, views, RLS policies, and seeds initial data.
-- Run in your Supabase SQL Editor.
-- ============================================================

-- -----------------------------
-- 0. Cleanup existing views and tables
-- -----------------------------
DROP VIEW IF EXISTS public.v_dashboard_stats CASCADE;
DROP VIEW IF EXISTS public.v_today_kitchen_summary CASCADE;

DROP TABLE IF EXISTS public.notification_receipts CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.fee_activity_logs CASCADE;
DROP TABLE IF EXISTS public.monthly_statements CASCADE;
DROP TABLE IF EXISTS public.meal_count_summaries CASCADE;
DROP TABLE IF EXISTS public.meal_charges CASCADE;
DROP TABLE IF EXISTS public.seat_rent_charges CASCADE;
DROP TABLE IF EXISTS public.monthly_fee_records CASCADE;
DROP TABLE IF EXISTS public.daily_billings CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.meal_schedules CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.movements CASCADE;
DROP TABLE IF EXISTS public.visitors CASCADE;
DROP TABLE IF EXISTS public.staff_tasks CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.login_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Enable pgcrypto for password hashing & UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------
-- 1. Core Users Table
-- -----------------------------
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT','ADMIN','EMPLOYEE')),
  student_id TEXT UNIQUE,
  employee_id TEXT,
  username TEXT,
  department TEXT,
  hostel_block TEXT,
  room_no TEXT,
  room_id UUID,
  avatar TEXT,
  phone TEXT,
  emergency_contact TEXT,
  designation TEXT,
  shift TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_student_id ON public.users(student_id);
CREATE INDEX idx_users_employee_id ON public.users(employee_id);
CREATE INDEX idx_users_hostel_block ON public.users(hostel_block);
CREATE INDEX idx_users_active_role ON public.users(role, is_active, is_approved);

CREATE TRIGGER trg_users_updated_at 
BEFORE UPDATE ON public.users 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 2. Rooms Table
-- -----------------------------
CREATE TABLE public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block TEXT NOT NULL,
  room_no TEXT NOT NULL,
  floor TEXT,
  capacity INTEGER NOT NULL DEFAULT 4 CHECK (capacity >= 0),
  occupied INTEGER NOT NULL DEFAULT 0 CHECK (occupied >= 0),
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Full','Maintenance','Reserved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(block, room_no)
);

CREATE INDEX idx_rooms_block_room ON public.rooms(block, room_no);

CREATE TRIGGER trg_rooms_updated_at 
BEFORE UPDATE ON public.rooms 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 3. Meal Schedules Table
-- -----------------------------
CREATE TABLE public.meal_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday')),
  day_order INTEGER GENERATED ALWAYS AS (
    CASE day_of_week 
      WHEN 'Saturday' THEN 1 
      WHEN 'Sunday' THEN 2 
      WHEN 'Monday' THEN 3 
      WHEN 'Tuesday' THEN 4 
      WHEN 'Wednesday' THEN 5 
      WHEN 'Thursday' THEN 6 
      ELSE 7 
    END
  ) STORED,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast','Lunch','Dinner')),
  meal_order INTEGER GENERATED ALWAYS AS (
    CASE meal_type 
      WHEN 'Breakfast' THEN 1 
      WHEN 'Lunch' THEN 2 
      ELSE 3 
    END
  ) STORED,
  menu TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  start_time TIME NOT NULL DEFAULT '08:00',
  cancellation_deadline_minutes INTEGER NOT NULL DEFAULT 30 CHECK (cancellation_deadline_minutes >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_of_week, meal_type)
);

CREATE INDEX idx_meal_schedules_day_meal ON public.meal_schedules(day_order, meal_order);

CREATE TRIGGER trg_meal_schedules_updated_at 
BEFORE UPDATE ON public.meal_schedules 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 4. Meals Table (Student Specific Meal Overrides)
-- -----------------------------
CREATE TABLE public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Breakfast','Lunch','Dinner')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Cancelled','Served','Missed')),
  menu TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  student_id TEXT,
  meal_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date, type)
);

CREATE INDEX idx_meals_student_date ON public.meals(student_id, date);
CREATE INDEX idx_meals_date_type_status ON public.meals(date, type, status);

CREATE TRIGGER trg_meals_updated_at 
BEFORE UPDATE ON public.meals 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 5. Leave Requests Table
-- -----------------------------
CREATE TABLE public.leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Cancelled')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_student_status ON public.leave_requests(student_id, status);

CREATE TRIGGER trg_leave_requests_updated_at 
BEFORE UPDATE ON public.leave_requests 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 6. Complaints Table
-- -----------------------------
CREATE TABLE public.complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT,
  student_name TEXT,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Urgent')),
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Resolved','Rejected')),
  resolution_note TEXT,
  date TEXT NOT NULL DEFAULT CURRENT_DATE::TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_student_status ON public.complaints(student_id, status);
CREATE INDEX idx_complaints_status_priority ON public.complaints(status, priority);

CREATE TRIGGER trg_complaints_updated_at 
BEFORE UPDATE ON public.complaints 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 7. Payments Table
-- -----------------------------
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT 'Seat Rent, Meal Charge & Service Charge',
  total_bill NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_bill >= 0),
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid','Partial','Paid','Voided')),
  receipt_no TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, billing_period)
);

CREATE INDEX idx_payments_student_status ON public.payments(student_id, status);
CREATE INDEX idx_payments_period ON public.payments(billing_period);

CREATE TRIGGER trg_payments_updated_at 
BEFORE UPDATE ON public.payments 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 8. Staff / Employee Tasks Table
-- -----------------------------
CREATE TABLE public.staff_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Urgent')),
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','In Progress','Completed','Cancelled')),
  assigned_at TEXT NOT NULL DEFAULT NOW()::TEXT,
  staff_id TEXT,
  staff_name TEXT,
  due_date TEXT,
  feedback TEXT,
  is_staff_request BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_tasks_staff_status ON public.staff_tasks(staff_id, status);

CREATE TRIGGER trg_staff_tasks_updated_at 
BEFORE UPDATE ON public.staff_tasks 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 9. Visitors Table
-- -----------------------------
CREATE TABLE public.visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT,
  relation TEXT NOT NULL,
  from_location TEXT NOT NULL,
  purpose TEXT DEFAULT 'Visit',
  time_in TEXT NOT NULL DEFAULT NOW()::TEXT,
  time_out TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visitors_student_created ON public.visitors(student_id, created_at DESC);

CREATE TRIGGER trg_visitors_updated_at 
BEFORE UPDATE ON public.visitors 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 10. Student Movements Table (In / Out Register)
-- -----------------------------
CREATE TABLE public.movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT,
  destination TEXT NOT NULL,
  purpose TEXT,
  time_out TEXT NOT NULL DEFAULT NOW()::TEXT,
  time_back TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movements_student_created ON public.movements(student_id, created_at DESC);
CREATE INDEX idx_movements_open ON public.movements(time_back) WHERE time_back IS NULL;

CREATE TRIGGER trg_movements_updated_at 
BEFORE UPDATE ON public.movements 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 11. Notices Table
-- -----------------------------
CREATE TABLE public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'ALL',
  attachment_url TEXT,
  created_by TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notices_active_target ON public.notices(is_active, target_audience, created_at DESC);

CREATE TRIGGER trg_notices_updated_at 
BEFORE UPDATE ON public.notices 
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------
-- 12. Notifications Table
-- -----------------------------
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  message TEXT NOT NULL,
  time TEXT,
  type TEXT NOT NULL DEFAULT 'Info',
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low','Normal','High','Critical')),
  target_audience TEXT DEFAULT 'ALL',
  sender_id UUID,
  sender_name TEXT,
  receiver_id UUID,
  receiver_role TEXT,
  receiver_student_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_receiver ON public.notifications(receiver_id, receiver_role, receiver_student_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_target ON public.notifications(target_audience, created_at DESC);

-- Notification Receipts Table
CREATE TABLE public.notification_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  receiver_id UUID,
  receiver_role TEXT,
  receiver_student_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id, receiver_id)
);

-- -----------------------------
-- 13. Financial Compatibility & Auxiliary Tables
-- -----------------------------
CREATE TABLE public.monthly_fee_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  student_id TEXT NOT NULL, 
  month_key TEXT NOT NULL, 
  opening_balance NUMERIC DEFAULT 0, 
  seat_rent NUMERIC DEFAULT 4500, 
  meal_charges NUMERIC DEFAULT 0, 
  other_charges NUMERIC DEFAULT 0, 
  paid_amount NUMERIC DEFAULT 0, 
  outstanding_amount NUMERIC DEFAULT 0, 
  status TEXT DEFAULT 'Unpaid', 
  created_at TIMESTAMPTZ DEFAULT NOW(), 
  updated_at TIMESTAMPTZ DEFAULT NOW(), 
  UNIQUE(student_id, month_key)
);

CREATE TABLE public.seat_rent_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  student_id TEXT NOT NULL, 
  month_key TEXT NOT NULL, 
  amount NUMERIC DEFAULT 4500, 
  charged_at TIMESTAMPTZ DEFAULT NOW(), 
  monthly_fee_record_id UUID REFERENCES public.monthly_fee_records(id) ON DELETE CASCADE, 
  UNIQUE(student_id, month_key)
);

CREATE TABLE public.meal_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  student_id TEXT NOT NULL, 
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL, 
  meal_date DATE NOT NULL, 
  meal_type TEXT NOT NULL, 
  amount NUMERIC NOT NULL, 
  cancellation_deadline TIMESTAMPTZ NOT NULL, 
  charged_at TIMESTAMPTZ DEFAULT NOW(), 
  monthly_fee_record_id UUID REFERENCES public.monthly_fee_records(id) ON DELETE CASCADE, 
  UNIQUE(student_id, meal_date, meal_type)
);

CREATE TABLE public.meal_count_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  student_id TEXT NOT NULL, 
  month_key TEXT NOT NULL, 
  breakfast_count INTEGER DEFAULT 0, 
  lunch_count INTEGER DEFAULT 0, 
  dinner_count INTEGER DEFAULT 0, 
  total_meals INTEGER DEFAULT 0, 
  total_meal_cost NUMERIC DEFAULT 0, 
  updated_at TIMESTAMPTZ DEFAULT NOW(), 
  UNIQUE(student_id, month_key)
);

CREATE TABLE public.monthly_statements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  student_id TEXT NOT NULL, 
  month_key TEXT NOT NULL, 
  seat_rent NUMERIC DEFAULT 4500, 
  meal_charges NUMERIC DEFAULT 0, 
  payments_made NUMERIC DEFAULT 0, 
  total_charges NUMERIC DEFAULT 0, 
  opening_balance NUMERIC DEFAULT 0, 
  outstanding_amount NUMERIC DEFAULT 0, 
  status TEXT DEFAULT 'Unpaid', 
  paid_date DATE, 
  statement_json JSONB, 
  created_at TIMESTAMPTZ DEFAULT NOW(), 
  updated_at TIMESTAMPTZ DEFAULT NOW(), 
  UNIQUE(student_id, month_key)
);

CREATE TABLE public.fee_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  student_id TEXT NOT NULL, 
  month_key TEXT, 
  activity_type TEXT NOT NULL, 
  title TEXT NOT NULL, 
  description TEXT, 
  amount NUMERIC DEFAULT 0, 
  source_table TEXT, 
  source_id TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.daily_billings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  student_id TEXT NOT NULL, 
  date DATE NOT NULL, 
  breakfast_taken BOOLEAN DEFAULT FALSE, 
  lunch_taken BOOLEAN DEFAULT FALSE, 
  dinner_taken BOOLEAN DEFAULT FALSE, 
  breakfast_cost NUMERIC DEFAULT 0, 
  lunch_cost NUMERIC DEFAULT 0, 
  dinner_cost NUMERIC DEFAULT 0, 
  total_cost NUMERIC DEFAULT 0, 
  on_leave BOOLEAN DEFAULT FALSE, 
  created_at TIMESTAMPTZ DEFAULT NOW(), 
  UNIQUE(student_id, date)
);

CREATE TABLE public.login_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  user_id UUID REFERENCES public.users(id), 
  email TEXT NOT NULL, 
  role TEXT NOT NULL, 
  login_time TIMESTAMPTZ DEFAULT NOW(), 
  ip_address TEXT, 
  user_agent TEXT, 
  status TEXT DEFAULT 'SUCCESS'
);

CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  user_id UUID, 
  user_name TEXT, 
  action TEXT NOT NULL, 
  table_name TEXT, 
  record_id TEXT, 
  old_values JSONB, 
  new_values JSONB, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign Keys with Update/Delete cascades
ALTER TABLE public.meals ADD CONSTRAINT fk_meals_student_id FOREIGN KEY (student_id) REFERENCES public.users(student_id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT fk_payments_student_id FOREIGN KEY (student_id) REFERENCES public.users(student_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.leave_requests ADD CONSTRAINT fk_leaves_student_id FOREIGN KEY (student_id) REFERENCES public.users(student_id) ON UPDATE CASCADE ON DELETE CASCADE;

-- -----------------------------
-- 14. Views
-- -----------------------------
CREATE OR REPLACE VIEW public.v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.users WHERE role='STUDENT') AS total_students,
  (SELECT COUNT(*) FROM public.users WHERE role='STUDENT' AND is_approved = FALSE) AS pending_students,
  (SELECT COUNT(*) FROM public.users WHERE role='EMPLOYEE') AS total_employees,
  (SELECT COUNT(*) FROM public.meals WHERE status='Active') AS active_meals,
  (SELECT COUNT(*) FROM public.leave_requests WHERE status='Pending') AS pending_leaves,
  (SELECT COUNT(*) FROM public.complaints WHERE status <> 'Resolved') AS open_complaints,
  (SELECT COALESCE(SUM(paid_amount),0) FROM public.payments) AS total_revenue,
  (SELECT COALESCE(SUM(balance),0) FROM public.payments) AS pending_dues;

CREATE OR REPLACE VIEW public.v_today_kitchen_summary AS
SELECT type AS meal_type,
       COUNT(*) FILTER (WHERE status='Cancelled') AS cancelled_count,
       COUNT(*) FILTER (WHERE status='Active') AS active_overrides
FROM public.meals
WHERE date = CURRENT_DATE::TEXT
GROUP BY type;

-- -----------------------------
-- 15. Realtime & RLS Policies
-- -----------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','rooms','meal_schedules','meals','leave_requests','complaints',
    'payments','staff_tasks','visitors','movements','notifications','notices',
    'audit_logs','login_logs','daily_billings','monthly_fee_records',
    'seat_rent_charges','meal_charges','meal_count_summaries','monthly_statements','fee_activity_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS compat_anon_all ON public.%I', t);
    EXECUTE format('CREATE POLICY compat_anon_all ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- -----------------------------
-- 16. Initial Seed Data
-- -----------------------------

-- Admin & Employee Seed Users
INSERT INTO public.users (id, name, email, password, password_hash, role, employee_id, username, designation, shift, hostel_block, is_approved, is_active, avatar) VALUES
('usr-admin-900000001'::UUID, 'Hostel Chief Warden', 'admin@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'ADMIN', '900000001', 'admin', 'Chief Warden', 'Administration', 'All Blocks', TRUE, TRUE, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'),
('usr-admin-900000002'::UUID, 'System Administrator', 'admin', 'admin', encode(digest('admin', 'sha256'), 'hex'), 'ADMIN', '900000002', 'admin_sys', 'System Admin', 'Administration', 'All Blocks', TRUE, TRUE, 'https://ui-avatars.com/api/?name=Admin+User&background=6b21a8&color=fff'),
('usr-staff-100000001'::UUID, 'Shahidul Islam', 'staff@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'EMPLOYEE', '100000001', 'staff', 'Housekeeping Supervisor', 'Morning (08:00 AM - 04:00 PM)', 'Hostel A', TRUE, TRUE, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
('usr-staff-100000002'::UUID, 'Monir Hossain', '100000002@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'EMPLOYEE', '100000002', 'monir', 'Warden Assistant', 'Evening (04:00 PM - 12:00 AM)', 'Hostel B', TRUE, TRUE, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'),
('usr-staff-100000003'::UUID, 'Abdur Rahim', '100000003@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'EMPLOYEE', '100000003', 'rahim', 'Hostel C Supervisor', 'Morning (08:00 AM - 04:00 PM)', 'Hostel C', TRUE, TRUE, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');

-- Student Seed Users (Hostel A, Hostel B, Hostel C)
INSERT INTO public.users (id, name, email, password, password_hash, role, student_id, department, hostel_block, room_no, is_approved, is_active, phone, emergency_contact, avatar) VALUES
('usr-student-202100001'::UUID, 'Rasel Sheikh', '202100001@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'STUDENT', '202100001', 'CSE', 'Hostel A', '302', TRUE, TRUE, '01711122233', '01811122233', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('usr-student-202100002'::UUID, 'Tanvir Ahmed', '202100002@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'STUDENT', '202100002', 'EEE', 'Hostel B', '201', TRUE, TRUE, '01722233344', '01822233344', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('usr-student-202100003'::UUID, 'Nusrat Jahan', '202100003@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'STUDENT', '202100003', 'BBA', 'Hostel A', '105', FALSE, TRUE, '01733344455', '01833344455', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
('usr-student-202100004'::UUID, 'Kamrul Hasan', '202100004@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'STUDENT', '202100004', 'CSE', 'Hostel C', '101', TRUE, TRUE, '01766677788', '01866677788', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
('usr-student-202100005'::UUID, 'Sultana Razia', '202100005@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'STUDENT', '202100005', 'EEE', 'Hostel C', '102', TRUE, TRUE, '01777788899', '01877788899', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('usr-student-202100006'::UUID, 'Mahmudul Hasan', '202100006@green.edu.bd', 'password123', encode(digest('password123', 'sha256'), 'hex'), 'STUDENT', '202100006', 'Textile', 'Hostel C', '201', TRUE, TRUE, '01788899900', '01888899900', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('usr-student-232002117'::UUID, 'Rasel Sheikh (232)', '232002117@green.edu.bd', '1234', encode(digest('1234', 'sha256'), 'hex'), 'STUDENT', '232002117', 'CSE', 'Hostel B', '304', TRUE, TRUE, '01712345678', '01812345678', 'https://ui-avatars.com/api/?name=Rasel+Sheikh&background=006837&color=fff');

-- Hostel Rooms Seed
INSERT INTO public.rooms (block, room_no, floor, capacity, occupied, status) VALUES
('Hostel A', '105', '1', 4, 1, 'Available'),
('Hostel A', '202', '2', 4, 0, 'Available'),
('Hostel A', '302', '3', 4, 1, 'Available'),
('Hostel B', '201', '2', 4, 1, 'Available'),
('Hostel B', '304', '3', 4, 1, 'Available'),
('Hostel C', '101', '1', 3, 1, 'Available'),
('Hostel C', '102', '1', 3, 1, 'Available'),
('Hostel C', '201', '2', 3, 1, 'Available');

-- Weekly Meal Schedules Seed
INSERT INTO public.meal_schedules (day_of_week, meal_type, menu, price, start_time) VALUES
('Saturday','Breakfast','Mashed Potato, Lentils, White Rice',30,'08:00'),
('Saturday','Lunch','Fish Curry, Lentils, White Rice',60,'13:00'),
('Saturday','Dinner','Egg with Potato, Lentils, White Rice',50,'20:00'),
('Sunday','Breakfast','Soft Khichuri, Fried Egg',30,'08:00'),
('Sunday','Lunch','Broiler Chicken Roast, Lentils, White Rice',80,'13:00'),
('Sunday','Dinner','Potato Fry, Mung Dal, White Rice',50,'20:00'),
('Monday','Breakfast','Leafy Greens, Lentils, White Rice',30,'08:00'),
('Monday','Lunch','Fish Curry, Lentils, White Rice',60,'13:00'),
('Monday','Dinner','Chicken Bhuna, Lentils, White Rice',70,'20:00'),
('Tuesday','Breakfast','Khichuri, Egg Bhuna',35,'08:00'),
('Tuesday','Lunch','Chicken Curry, Lentils, White Rice',75,'13:00'),
('Tuesday','Dinner','Vegetable, Mash, Dal, White Rice',45,'20:00'),
('Wednesday','Breakfast','Egg Bhuna, Dal, White Rice',35,'08:00'),
('Wednesday','Lunch','Fish Bhuna, Dal, White Rice',65,'13:00'),
('Wednesday','Dinner','Chicken with Vegetable, Dal, White Rice',70,'20:00'),
('Thursday','Breakfast','Mashed Potato, Dal, White Rice',30,'08:00'),
('Thursday','Lunch','Chicken Roast, Dal, White Rice',80,'13:00'),
('Thursday','Dinner','Egg with Potato, Dal, White Rice',50,'20:00'),
('Friday','Breakfast','Sweet Pumpkin Fry, Dal, White Rice',30,'08:00'),
('Friday','Lunch','Beef Curry, Dal, White Rice',100,'13:00'),
('Friday','Dinner','Leafy Greens, Mashed Lentils, Dal, White Rice',45,'20:00');

-- Payments Seed
INSERT INTO public.payments (student_id, invoice_date, billing_period, description, total_bill, paid_amount, balance, status) VALUES
('202100001', CURRENT_DATE::TEXT, to_char(CURRENT_DATE, 'Mon YYYY'), 'Seat Rent, Meal Charge & Service Charge', 4500, 4500, 0, 'Paid'),
('202100004', CURRENT_DATE::TEXT, to_char(CURRENT_DATE, 'Mon YYYY'), 'Seat Rent, Meal Charge & Service Charge', 4500, 0, 4500, 'Unpaid'),
('202100005', CURRENT_DATE::TEXT, to_char(CURRENT_DATE, 'Mon YYYY'), 'Seat Rent, Meal Charge & Service Charge', 4500, 0, 4500, 'Unpaid'),
('202100006', CURRENT_DATE::TEXT, to_char(CURRENT_DATE, 'Mon YYYY'), 'Seat Rent, Meal Charge & Service Charge', 4500, 0, 4500, 'Unpaid'),
('232002117', CURRENT_DATE::TEXT, to_char(CURRENT_DATE, 'Mon YYYY'), 'Seat Rent, Meal Charge & Service Charge', 4500, 0, 4500, 'Unpaid');

-- Staff Tasks Seed
INSERT INTO public.staff_tasks (title, description, priority, location, status, assigned_at) VALUES
('Daily common area inspection', 'Inspect corridors, kitchen and visitor desk logs.', 'Medium', 'All Blocks', 'Pending', NOW()::TEXT),
('Hostel C Water Filter Maintenance', 'Check and clean the water filter unit on 1st Floor Hostel C.', 'High', 'Hostel C', 'Pending', NOW()::TEXT);

-- Notices Seed
INSERT INTO public.notices (title, content, target_audience, created_by, is_active) VALUES
('Hostel C Maintenance Inspection', 'Routine maintenance and cleanliness check scheduled for Hostel C tomorrow.', 'ALL', 'Admin', TRUE),
('Monthly Fee Reminder', 'Please pay your monthly hostel seat rent and dining fee before the 10th of this month.', 'ALL', 'Chief Warden', TRUE);
