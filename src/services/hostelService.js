import { requireSupabase, supabase } from "../supabaseClient";
import { MEAL_TYPES, SEAT_RENT, getMonthKey, getMonthLabel, toIsoDate, MEAL_WINDOWS } from "../financialService";

export const formatDateTime = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleString([], { 
    day: "2-digit", 
    month: "short", 
    year: "numeric", 
    hour: "numeric", 
    minute: "2-digit" 
  });
};

export const todayIso = () => toIsoDate(new Date());
export const nowIso = () => new Date().toISOString();

const db = () => {
  try {
    return requireSupabase();
  } catch (error) {
    return null;
  }
};

const getData = async (promise) => { 
  try {
    const { data, error } = await promise; 
    if (error) {
      console.error("Supabase query error:", error);
      return []; 
    }
    return data || []; 
  } catch (error) {
    return [];
  }
};

const getOne = async (promise) => { 
  try {
    const { data, error } = await promise; 
    if (error) {
      console.error("Supabase query error:", error);
      return null; 
    }
    return data || null; 
  } catch (error) {
    return null;
  }
};

const clean = (obj) => {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null)
  );
};

// Default Seed Users with 9-digit numeric IDs
const DEFAULT_SEED_USERS = [
  {
    id: "usr-student-202100001",
    name: "Rasel Sheikh",
    student_id: "202100001",
    studentId: "202100001",
    email: "202100001@green.edu.bd",
    password: "password123",
    role: "STUDENT",
    department: "CSE",
    hostel_block: "Hostel A",
    hostelBlock: "Hostel A",
    room_no: "302",
    roomNumber: "302",
    phone: "01711122233",
    emergency_contact: "01811122233",
    is_approved: true,
    isApproved: true,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-student-202100002",
    name: "Tanvir Ahmed",
    student_id: "202100002",
    studentId: "202100002",
    email: "202100002@green.edu.bd",
    password: "password123",
    role: "STUDENT",
    department: "EEE",
    hostel_block: "Hostel B",
    hostelBlock: "Hostel B",
    room_no: "201",
    roomNumber: "201",
    phone: "01722233344",
    emergency_contact: "01822233344",
    is_approved: true,
    isApproved: true,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-student-202100003",
    name: "Nusrat Jahan",
    student_id: "202100003",
    studentId: "202100003",
    email: "202100003@green.edu.bd",
    password: "password123",
    role: "STUDENT",
    department: "BBA",
    hostel_block: "Hostel A",
    hostelBlock: "Hostel A",
    room_no: "105",
    roomNumber: "105",
    phone: "01733344455",
    emergency_contact: "01833344455",
    is_approved: false,
    isApproved: false,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-student-202100004",
    name: "Kamrul Hasan",
    student_id: "202100004",
    studentId: "202100004",
    email: "202100004@green.edu.bd",
    password: "password123",
    role: "STUDENT",
    department: "CSE",
    hostel_block: "Hostel C",
    hostelBlock: "Hostel C",
    room_no: "101",
    roomNumber: "101",
    phone: "01766677788",
    emergency_contact: "01866677788",
    is_approved: true,
    isApproved: true,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-student-202100005",
    name: "Sultana Razia",
    student_id: "202100005",
    studentId: "202100005",
    email: "202100005@green.edu.bd",
    password: "password123",
    role: "STUDENT",
    department: "EEE",
    hostel_block: "Hostel C",
    hostelBlock: "Hostel C",
    room_no: "102",
    roomNumber: "102",
    phone: "01777788899",
    emergency_contact: "01877788899",
    is_approved: true,
    isApproved: true,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-student-202100006",
    name: "Mahmudul Hasan",
    student_id: "202100006",
    studentId: "202100006",
    email: "202100006@green.edu.bd",
    password: "password123",
    role: "STUDENT",
    department: "Textile",
    hostel_block: "Hostel C",
    hostelBlock: "Hostel C",
    room_no: "201",
    roomNumber: "201",
    phone: "01788899900",
    emergency_contact: "01888899900",
    is_approved: true,
    isApproved: true,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-staff-100000001",
    name: "Shahidul Islam",
    student_id: "100000001",
    studentId: "100000001",
    employee_id: "100000001",
    employeeId: "100000001",
    username: "staff",
    email: "staff@green.edu.bd",
    password: "password123",
    role: "EMPLOYEE",
    hostel_block: "Hostel A",
    hostelBlock: "Hostel A",
    designation: "Housekeeping Supervisor",
    shift: "Morning (08:00 AM - 04:00 PM)",
    phone: "01744455566",
    is_approved: true,
    isApproved: true,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-staff-100000002",
    name: "Monir Hossain",
    student_id: "100000002",
    studentId: "100000002",
    employee_id: "100000002",
    employeeId: "100000002",
    username: "monir",
    email: "100000002@green.edu.bd",
    password: "password123",
    role: "EMPLOYEE",
    hostel_block: "Hostel B",
    hostelBlock: "Hostel B",
    designation: "Warden Assistant",
    shift: "Evening (04:00 PM - 12:00 AM)",
    phone: "01755566677",
    is_approved: true,
    isApproved: true,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-staff-100000003",
    name: "Abdur Rahim",
    student_id: "100000003",
    studentId: "100000003",
    employee_id: "100000003",
    employeeId: "100000003",
    username: "rahim",
    email: "100000003@green.edu.bd",
    password: "password123",
    role: "EMPLOYEE",
    hostel_block: "Hostel C",
    hostelBlock: "Hostel C",
    designation: "Hostel C Supervisor",
    shift: "Morning (08:00 AM - 04:00 PM)",
    phone: "01799900011",
    is_approved: true,
    isApproved: true,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-admin-900000001",
    name: "Hostel Chief Warden",
    student_id: "900000001",
    studentId: "900000001",
    employee_id: "900000001",
    employeeId: "900000001",
    username: "admin",
    email: "admin@green.edu.bd",
    password: "password123",
    role: "ADMIN",
    hostel_block: "All Blocks",
    hostelBlock: "All Blocks",
    designation: "Chief Warden",
    department: "Administration",
    phone: "01700000000",
    is_approved: true,
    isApproved: true,
    is_active: true,
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
  }
];

// Dynamic Local Storage Persistence for pure dynamic frontend operation without forced static data
const getLocal = (key, fallback = []) => {
  try {
    const item = localStorage.getItem(`mealport_${key}`);
    if (!item && key === "users") {
      localStorage.setItem(`mealport_users`, JSON.stringify(DEFAULT_SEED_USERS));
      return DEFAULT_SEED_USERS;
    }
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setLocal = (key, data) => {
  try {
    localStorage.setItem(`mealport_${key}`, JSON.stringify(data));
  } catch (e) {}
};

// MAPPERS
export const mapUser = (row = {}) => ({ 
  id: row.id || row.uid || `user-${Date.now()}`,
  uid: row.uid || row.employee_id || row.employeeId || row.username || row.student_id || row.studentId || row.id || "",
  name: row.name || "User", 
  email: row.email || "", 
  role: row.role || "STUDENT", 
  studentId: row.student_id || row.studentId || row.email || "", 
  employeeId: row.employee_id || row.employeeId || row.uid || row.username || "",
  username: row.username || row.uid || "",
  department: row.department || "", 
  hostelBlock: row.hostel_block || row.hostelBlock || "", 
  roomNumber: row.room_no || row.roomNumber || "", 
  roomId: row.room_id || row.roomId || null, 
  phone: row.phone || "", 
  emergencyContact: row.emergency_contact || row.emergencyContact || "", 
  isApproved: Boolean(row.is_approved ?? row.isApproved ?? true), 
  isActive: row.is_active !== false && row.isActive !== false, 
  avatar: row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || "User")}&background=${row.role === 'EMPLOYEE' ? '059669' : '2563eb'}&color=fff`, 
  designation: row.designation || row.employee_role || (row.role === 'EMPLOYEE' ? "Hostel Staff" : "Student"), 
  shift: row.shift || "General", 
  createdAt: row.created_at || row.createdAt || null, 
  lastLogin: row.last_login || row.lastLogin || null 
});

export const mapLeave = (row = {}) => ({ 
  id: row.id || `leave-${Date.now()}`, 
  studentName: row.student_name || row.studentName || "", 
  studentId: row.student_id || row.studentId || "", 
  startDate: row.start_date || row.startDate || "", 
  endDate: row.end_date || row.endDate || "", 
  reason: row.reason || "", 
  status: row.status || "Pending", 
  reviewedBy: row.reviewed_by || row.reviewedBy || "", 
  reviewedAt: row.reviewed_at || row.reviewedAt || null, 
  createdAt: row.created_at || row.createdAt || null 
});

export const mapComplaint = (row = {}) => ({ 
  id: row.id || `complaint-${Date.now()}`, 
  studentId: row.student_id || row.studentId || "", 
  studentName: row.student_name || row.studentName || "", 
  type: row.type || "General", 
  description: row.description || "", 
  status: row.status || "Open", 
  priority: row.priority || "Medium", 
  targetRecipient: row.target_recipient || row.targetRecipient || "BOTH",
  assignedTo: row.assigned_to || row.assignedTo || "", 
  resolutionNote: row.resolution_note || row.resolutionNote || "", 
  date: row.date || row.created_at?.slice(0, 10) || row.createdAt?.slice(0, 10) || todayIso(), 
  createdAt: row.created_at || row.createdAt || null, 
  resolvedAt: row.resolved_at || row.resolvedAt || null 
});

export const mapPayment = (row = {}) => ({ 
  id: row.id || `payment-${Date.now()}`, 
  studentId: row.student_id || row.studentId || "", 
  invoiceDate: row.invoice_date || row.invoiceDate || todayIso(), 
  billingPeriod: row.billing_period || row.billingPeriod || "", 
  description: row.description || "Hostel Charges", 
  totalBill: Number(row.total_bill || row.totalBill || 0), 
  paidAmount: Number(row.paid_amount || row.paidAmount || 0), 
  balance: Number(row.balance ?? (Number(row.total_bill || row.totalBill || 0) - Number(row.paid_amount || row.paidAmount || 0))), 
  status: row.status || "Unpaid", 
  receiptNo: row.receipt_no || row.receiptNo || "", 
  paidAt: row.paid_at || row.paidAt || null, 
  createdAt: row.created_at || row.createdAt || null 
});

export const mapMeal = (row = {}) => ({ 
  id: row.id || `meal-${Date.now()}`, 
  date: row.date || "", 
  type: row.type || row.meal_type || row.mealType || "Breakfast", 
  status: row.status || "Active", 
  menu: row.menu || "", 
  cost: Number(row.cost || row.price || 0), 
  studentId: row.student_id || row.studentId || "", 
  mealTime: row.meal_time || row.mealTime || null, 
  isAvailable: row.is_available !== false && row.isAvailable !== false, 
  createdAt: row.created_at || row.createdAt || null, 
  updatedAt: row.updated_at || row.updatedAt || null 
});

export const mapMealSchedule = (row = {}) => ({ 
  id: row.id || `schedule-${Date.now()}`, 
  dayOfWeek: row.day_of_week || row.dayOfWeek || "Saturday", 
  mealType: row.meal_type || row.mealType || "Breakfast", 
  menu: row.menu || "", 
  price: Number(row.price || 0), 
  startTime: row.start_time || row.startTime || "08:00", 
  cancellationDeadlineMinutes: Number(row.cancellation_deadline_minutes || row.cancellationDeadlineMinutes || 30), 
  isAvailable: row.is_available !== false && row.isAvailable !== false, 
  updatedAt: row.updated_at || row.updatedAt || null 
});

export const mapNotice = (row = {}) => ({ 
  id: row.id || `notice-${Date.now()}`, 
  title: row.title || "", 
  content: row.content || "", 
  targetAudience: row.target_audience || row.targetAudience || "ALL", 
  attachmentUrl: row.attachment_url || row.attachmentUrl || "", 
  createdBy: row.created_by || row.createdBy || "Admin", 
  isActive: row.is_active !== false && row.isActive !== false, 
  createdAt: row.created_at || row.createdAt || null, 
  updatedAt: row.updated_at || row.updatedAt || null 
});

export const mapNotification = (row = {}) => ({ 
  id: row.id || `notif-${Date.now()}`, 
  title: row.title || "Notification", 
  message: row.message || "", 
  type: row.type || "Info", 
  priority: row.priority || "Normal", 
  targetAudience: row.target_audience || row.targetAudience || "ALL", 
  senderId: row.sender_id || row.senderId || null, 
  senderName: row.sender_name || row.senderName || "System", 
  receiverId: row.receiver_id || row.receiverId || null, 
  receiverRole: row.receiver_role || row.receiverRole || null, 
  receiverStudentId: row.receiver_student_id || row.receiverStudentId || null, 
  relatedRecordId: row.related_record_id || row.relatedRecordId || null,
  isRead: Boolean(row.is_read ?? row.isRead), 
  readAt: row.read_at || row.readAt || null, 
  expiresAt: row.expires_at || row.expiresAt || null, 
  createdAt: row.created_at || row.createdAt || nowIso() 
});

export const mapTask = (row = {}) => ({ 
  id: row.id || `task-${Date.now()}`, 
  title: row.title || "", 
  description: row.description || "", 
  priority: row.priority || "Medium", 
  location: row.location || "", 
  status: row.status || "Pending", 
  staffId: row.staff_id || row.staffId || null, 
  staffName: row.staff_name || row.staffName || "", 
  dueDate: row.due_date || row.dueDate || "", 
  feedback: row.feedback || row.completion_feedback || row.completionFeedback || "",
  isStaffRequest: Boolean(row.is_staff_request || row.isStaffRequest),
  assignedAt: row.assigned_at || row.assignedAt || row.created_at || row.createdAt || null, 
  completedAt: row.completed_at || row.completedAt || null, 
  createdAt: row.created_at || row.createdAt || null 
});

export const mapVisitor = (row = {}) => ({ 
  id: row.id || `visitor-${Date.now()}`, 
  visitorName: row.visitor_name || row.visitorName || "", 
  studentId: row.student_id || row.studentId || "", 
  studentName: row.student_name || row.studentName || "", 
  relation: row.relation || "", 
  fromLocation: row.from_location || row.fromLocation || "", 
  purpose: row.purpose || "Visit", 
  timeIn: row.time_in || row.timeIn || row.created_at || row.createdAt || null, 
  timeOut: row.time_out || row.timeOut || null, 
  createdAt: row.created_at || row.createdAt || null 
});

export const mapMovement = (row = {}) => ({ 
  id: row.id || `movement-${Date.now()}`, 
  studentId: row.student_id || row.studentId || "", 
  studentName: row.student_name || row.studentName || "", 
  destination: row.destination || "", 
  purpose: row.purpose || "", 
  timeOut: row.time_out || row.timeOut || row.created_at || row.createdAt || null, 
  timeBack: row.time_back || row.timeBack || null, 
  status: row.time_back || row.timeBack ? "Returned" : "Out", 
  createdAt: row.created_at || row.createdAt || null 
});

export const mapRoom = (row = {}) => ({ 
  id: row.id || `room-${Date.now()}`, 
  block: row.block || row.hostel_block || "", 
  roomNo: row.room_no || row.roomNo || "", 
  floor: row.floor || "", 
  capacity: Number(row.capacity || 0), 
  occupied: Number(row.occupied || 0), 
  status: row.status || "Available" 
});

// ============================================================
// DYNAMIC USER OPERATIONS
// ============================================================

const isValidUUID = (str) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const sha256 = async (message) => {
  if (!message) return "";
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return message;
  }
};

export const listUsers = async (role) => { 
  const client = db();
  if (client) {
    try {
      let query = client.from("users").select("*").order("created_at", { ascending: false }); 
      if (role) query = query.eq("role", role); 
      const rows = await getData(query);
      if (rows && rows.length > 0) return rows.map(mapUser);
    } catch (e) {}
  }
  const users = getLocal("users", []).map(mapUser);
  return role ? users.filter((u) => u.role === role) : users;
};

export const listStudents = () => listUsers("STUDENT");
export const listEmployees = () => listUsers("EMPLOYEE");

export const updateUser = async (id, values) => {
  const client = db();
  if (client) {
    try {
      let query;
      if (isValidUUID(id)) {
        query = client.from("users").update(clean({ 
          name: values.name, 
          phone: values.phone, 
          emergency_contact: values.emergencyContact, 
          department: values.department, 
          hostel_block: values.hostelBlock, 
          room_no: values.roomNumber, 
          avatar: values.avatar,
          is_approved: values.isApproved, 
          is_active: values.isActive, 
          designation: values.designation, 
          shift: values.shift 
        })).eq("id", id);
      } else {
        query = client.from("users").update(clean({ 
          name: values.name, 
          phone: values.phone, 
          emergency_contact: values.emergencyContact, 
          department: values.department, 
          hostel_block: values.hostelBlock, 
          room_no: values.roomNumber, 
          avatar: values.avatar,
          is_approved: values.isApproved, 
          is_active: values.isActive, 
          designation: values.designation, 
          shift: values.shift 
        })).or(`student_id.eq.${id},email.eq.${id}`);
      }
      const result = await getOne(query.select().single());
      if (result) return mapUser(result);
    } catch (e) {}
  }

  const users = getLocal("users", []);
  const idx = users.findIndex((u) => u.id === id || u.studentId === id || u.uid === id);
  if (idx !== -1) {
    users[idx] = mapUser({ ...users[idx], ...values });
    setLocal("users", users);
    return users[idx];
  }
  return null;
};

export const deleteUser = async (id) => {
  const client = db();
  if (client) {
    try {
      if (isValidUUID(id)) {
        await getData(client.from("users").delete().eq("id", id));
      } else {
        await getData(client.from("users").delete().or(`student_id.eq.${id},email.eq.${id}`));
      }
    } catch (e) {}
  }
  const users = getLocal("users", []).filter((u) => u.id !== id && u.studentId !== id && u.uid !== id);
  setLocal("users", users);
  return users;
};

export const approveStudent = (id) => updateUser(id, { isApproved: true, isActive: true });
export const rejectStudent = (id) => updateUser(id, { isApproved: false, isActive: false });

export const upsertEmployee = async (payload) => {
  const uidVal = (payload.uid || payload.username || payload.employeeId || payload.studentId || payload.id || "").trim() || `staff-${Date.now()}`;
  const isValidIdUUID = isValidUUID(payload.id);

  const cleanEmail = payload.email && payload.email.includes("@") 
    ? payload.email.trim() 
    : (uidVal.includes("@") ? uidVal : `${uidVal}@green.edu.bd`);

  const passwordHash = payload.password ? await sha256(payload.password) : null;

  const empData = {
    uid: uidVal,
    name: payload.name || "Staff Member",
    email: cleanEmail,
    student_id: uidVal,
    studentId: uidVal,
    employee_id: uidVal,
    employeeId: uidVal,
    username: uidVal,
    password: payload.password || "password123",
    password_hash: passwordHash,
    role: "EMPLOYEE",
    hostel_block: payload.hostelBlock || payload.hostel_block || "Hostel A",
    hostelBlock: payload.hostelBlock || payload.hostel_block || "Hostel A",
    designation: payload.designation || "Hostel Staff",
    phone: payload.phone || "",
    is_approved: true,
    isApproved: true,
    is_active: payload.isActive !== false,
    isActive: payload.isActive !== false,
    avatar: payload.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || "Staff")}&background=059669&color=fff`
  };

  const client = db();
  if (client) {
    try {
      let existingUser = null;

      if (isValidIdUUID) {
        const { data } = await client.from("users").select("*").eq("id", payload.id).maybeSingle();
        existingUser = data;
      }

      if (!existingUser) {
        const { data } = await client.from("users").select("*")
          .or(`student_id.eq.${uidVal},email.eq.${cleanEmail}`)
          .maybeSingle();
        existingUser = data;
      }

      const dbPayload = clean({
        name: empData.name,
        email: empData.email,
        student_id: empData.student_id,
        role: "EMPLOYEE",
        hostel_block: empData.hostel_block,
        designation: empData.designation,
        phone: empData.phone,
        password: empData.password,
        password_hash: passwordHash,
        is_approved: true,
        is_active: empData.is_active,
        avatar: empData.avatar
      });

      let savedRecord = null;

      if (existingUser && existingUser.id) {
        const { data, error } = await client.from("users")
          .update(dbPayload)
          .eq("id", existingUser.id)
          .select()
          .single();
        if (!error && data) savedRecord = data;
        else if (error) console.error("Supabase update staff error:", error);
      } else {
        const { data, error } = await client.from("users")
          .insert([dbPayload])
          .select()
          .single();
        if (!error && data) savedRecord = data;
        else if (error) console.error("Supabase insert staff error:", error);
      }

      if (savedRecord) return mapUser(savedRecord);
    } catch (e) {
      console.error("upsertEmployee error:", e);
    }
  }

  const users = getLocal("users", []);
  const localId = isValidIdUUID ? payload.id : `emp-${uidVal}`;
  const fullEmpData = { ...empData, id: localId };

  const idx = users.findIndex((u) => 
    u.id === payload.id || 
    u.uid === uidVal || 
    u.employeeId === uidVal || 
    u.studentId === uidVal || 
    u.student_id === uidVal ||
    (u.email && u.email.toLowerCase() === cleanEmail.toLowerCase())
  );

  if (idx !== -1) {
    users[idx] = mapUser({ ...users[idx], ...fullEmpData });
  } else {
    users.push(mapUser(fullEmpData));
  }
  setLocal("users", users);
  return mapUser(fullEmpData);
};

export const deleteEmployee = async (id) => {
  return deleteUser(id);
};

// ============================================================
// HOSTEL DISCHARGE REQUESTS
// ============================================================

export const createDischargeRequest = async (payload) => {
  const reqObj = {
    id: `discharge-${Date.now()}`,
    studentId: payload.studentId,
    studentName: payload.studentName,
    reason: payload.reason,
    requestedDate: payload.requestedDate || todayIso(),
    remarks: payload.remarks || "",
    status: "Pending",
    createdAt: nowIso()
  };
  const list = getLocal("discharge_requests", []);
  list.unshift(reqObj);
  setLocal("discharge_requests", list);
  await sendNotification(
    { title: "Hostel Discharge Request", message: `${payload.studentName} (${payload.studentId}) submitted a discharge request.`, targetAudience: "ADMINS", type: "Approval", priority: "High" },
    { name: payload.studentName }
  ).catch(() => null);
  return reqObj;
};

export const listDischargeRequests = async () => {
  return getLocal("discharge_requests", []);
};

export const updateDischargeRequestStatus = async (id, status) => {
  const list = getLocal("discharge_requests", []);
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    list[idx].updatedAt = nowIso();
    setLocal("discharge_requests", list);

    if (status === "Approved") {
      const targetStudentId = list[idx].studentId;
      const users = getLocal("users", []);
      const uIdx = users.findIndex(u => (u.student_id || u.studentId || u.email) === targetStudentId);
      if (uIdx !== -1) {
        users[uIdx].is_active = false;
        users[uIdx].isActive = false;
        users[uIdx].is_approved = false;
        users[uIdx].isApproved = false;
        setLocal("users", users);
      }
    }
    return list[idx];
  }
  return null;
};

// ============================================================
// DYNAMIC LEAVE REQUESTS
// ============================================================

export const listLeaves = async (studentId) => { 
  const client = db();
  if (client) {
    try {
      let query = client.from("leave_requests").select("*").order("created_at", { ascending: false }); 
      if (studentId) query = query.eq("student_id", studentId); 
      const rows = await getData(query);
      if (rows && rows.length > 0) return rows.map(mapLeave);
    } catch (e) {}
  }
  const leaves = getLocal("leaves", []).map(mapLeave);
  return studentId ? leaves.filter((l) => l.studentId === studentId) : leaves;
};

export const createLeave = async (payload) => {
  let newLeave = null;
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("leave_requests")
          .insert([{ 
            student_name: payload.studentName, 
            student_id: payload.studentId, 
            start_date: payload.startDate, 
            end_date: payload.endDate, 
            reason: payload.reason, 
            status: "Pending" 
          }])
          .select()
          .single()
      );
      if (result) newLeave = mapLeave(result);
    } catch (e) {}
  }

  if (!newLeave) {
    newLeave = mapLeave({ ...payload, id: `leave-${Date.now()}`, status: "Pending", createdAt: nowIso() });
    const leaves = getLocal("leaves", []);
    leaves.unshift(newLeave);
    setLocal("leaves", leaves);
  }

  // Automatic Notification for ADMIN
  await sendNotification({
    title: `New Leave Application Submitted`,
    message: `${payload.studentName || "Student"} (${payload.studentId || "N/A"}) submitted a leave request (${payload.startDate} to ${payload.endDate}). Reason: ${payload.reason || "N/A"}`,
    type: "Leave",
    priority: "High",
    targetAudience: "ADMIN",
    receiverRole: "ADMIN",
    senderId: payload.studentId,
    senderName: payload.studentName || "Student",
    relatedRecordId: newLeave.id
  }).catch(() => null);

  return newLeave;
};

export const updateLeaveStatus = async (id, status, reviewer) => {
  let updatedLeave = null;
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("leave_requests")
          .update({ 
            status, 
            reviewed_by: reviewer?.name || null, 
            reviewed_at: nowIso() 
          })
          .eq("id", id)
          .select()
          .single()
      );
      if (result) updatedLeave = mapLeave(result);
    } catch (e) {}
  }

  if (!updatedLeave) {
    const leaves = getLocal("leaves", []);
    const idx = leaves.findIndex((l) => l.id === id);
    if (idx !== -1) {
      leaves[idx] = mapLeave({ ...leaves[idx], status, reviewedBy: reviewer?.name || "Admin", reviewedAt: nowIso() });
      setLocal("leaves", leaves);
      updatedLeave = leaves[idx];
    }
  }

  if (updatedLeave && updatedLeave.studentId) {
    await sendNotification({
      title: `Leave Application ${status}`,
      message: `Your leave request (${updatedLeave.startDate} to ${updatedLeave.endDate}) was ${status.toLowerCase()} by ${reviewer?.name || "Admin"}.`,
      targetAudience: "STUDENT",
      receiverStudentId: updatedLeave.studentId,
      receiverRole: "STUDENT",
      type: "Leave",
      priority: "High"
    }, reviewer).catch(() => null);
  }

  return updatedLeave;
};

export const deleteLeave = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("leave_requests").delete().eq("id", id));
    } catch (e) {}
  }
  const leaves = getLocal("leaves", []).filter((l) => l.id !== id);
  setLocal("leaves", leaves);
  return leaves;
};

// ============================================================
// DYNAMIC COMPLAINTS
// ============================================================

export const listComplaints = async (studentId) => { 
  const client = db();
  if (client) {
    try {
      let query = client.from("complaints").select("*").order("created_at", { ascending: false }); 
      if (studentId) query = query.eq("student_id", studentId); 
      const rows = await getData(query);
      if (rows && rows.length > 0) return rows.map(mapComplaint);
    } catch (e) {}
  }
  const complaints = getLocal("complaints", []).map(mapComplaint);
  return studentId ? complaints.filter((c) => c.studentId === studentId) : complaints;
};

export const createComplaint = async (payload) => {
  const targetRecipient = payload.targetRecipient || "BOTH";
  let newComplaint = null;
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("complaints")
          .insert([{ 
            student_id: payload.studentId, 
            student_name: payload.studentName, 
            type: payload.type, 
            description: payload.description, 
            priority: payload.priority || "Medium", 
            target_recipient: targetRecipient,
            status: "Open", 
            date: todayIso() 
          }])
          .select()
          .single()
      );
      if (result) newComplaint = mapComplaint(result);
    } catch (e) {}
  }

  if (!newComplaint) {
    newComplaint = mapComplaint({ ...payload, id: `complaint-${Date.now()}`, targetRecipient, status: "Open", date: todayIso(), createdAt: nowIso() });
    const complaints = getLocal("complaints", []);
    complaints.unshift(newComplaint);
    setLocal("complaints", complaints);
  }

  const recRole = targetRecipient === "EMPLOYEE" ? "EMPLOYEE" : "ADMIN";
  await sendNotification({
    title: `New ${payload.type || "General"} Complaint`,
    message: `${payload.studentName || "Student"} (${payload.studentId || "N/A"}) submitted a ${payload.priority || "Medium"} complaint: "${payload.description || ""}"`,
    type: "Complaint",
    priority: payload.priority || "Medium",
    targetAudience: recRole,
    receiverRole: recRole,
    senderId: payload.studentId,
    senderName: payload.studentName || "Student",
    relatedRecordId: newComplaint.id
  }).catch(() => null);

  return newComplaint;
};

export const updateComplaint = async (id, values) => {
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("complaints")
          .update(clean({ 
            type: values.type, 
            description: values.description, 
            priority: values.priority, 
            assigned_to: values.assignedTo, 
            status: values.status, 
            resolution_note: values.resolutionNote, 
            resolved_at: values.status === "Resolved" ? nowIso() : undefined 
          }))
          .eq("id", id)
          .select()
          .single()
      );
      if (result) return mapComplaint(result);
    } catch (e) {}
  }

  const complaints = getLocal("complaints", []);
  const idx = complaints.findIndex((c) => c.id === id);
  if (idx !== -1) {
    complaints[idx] = mapComplaint({ ...complaints[idx], ...values, resolvedAt: values.status === "Resolved" ? nowIso() : complaints[idx].resolvedAt });
    setLocal("complaints", complaints);
    return complaints[idx];
  }
  return null;
};

export const deleteComplaint = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("complaints").delete().eq("id", id));
    } catch (e) {}
  }
  const complaints = getLocal("complaints", []).filter((c) => c.id !== id);
  setLocal("complaints", complaints);
  return complaints;
};

// ============================================================
// DYNAMIC PAYMENTS
// ============================================================

export const listPayments = async (studentId) => { 
  const client = db();
  if (client) {
    try {
      let query = client.from("payments").select("*").order("invoice_date", { ascending: false }); 
      if (studentId) query = query.eq("student_id", studentId); 
      const rows = await getData(query);
      if (rows && rows.length > 0) return rows.map(mapPayment);
    } catch (e) {}
  }
  const payments = getLocal("payments", []).map(mapPayment);
  return studentId ? payments.filter((p) => p.studentId === studentId) : payments;
};

export const upsertPayment = async (payload) => {
  const totalBill = Number(payload.totalBill || 0);
  const paidAmount = Number(payload.paidAmount || 0);
  const balance = Math.max(0, totalBill - paidAmount);
  const status = balance <= 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid";

  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("payments")
          .upsert([{ 
            id: payload.id || undefined, 
            student_id: payload.studentId, 
            invoice_date: payload.invoiceDate || todayIso(), 
            billing_period: payload.billingPeriod, 
            description: payload.description || "Seat Rent, Meal Charge & Service Charge", 
            total_bill: totalBill, 
            paid_amount: paidAmount, 
            balance: balance, 
            status: status, 
            receipt_no: payload.receiptNo || null, 
            paid_at: paidAmount > 0 ? nowIso() : null 
          }], { onConflict: "id" })
          .select()
          .single()
      );
      if (result) return mapPayment(result);
    } catch (e) {}
  }

  const paymentRecord = mapPayment({
    ...payload,
    id: payload.id || `payment-${Date.now()}`,
    totalBill,
    paidAmount,
    balance,
    status,
    createdAt: nowIso()
  });

  const payments = getLocal("payments", []);
  const idx = payments.findIndex((p) => p.id === paymentRecord.id);
  if (idx !== -1) {
    payments[idx] = paymentRecord;
  } else {
    payments.unshift(paymentRecord);
  }
  setLocal("payments", payments);
  return paymentRecord;
};

export const deletePayment = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("payments").delete().eq("id", id));
    } catch (e) {}
  }
  const payments = getLocal("payments", []).filter((p) => p.id !== id);
  setLocal("payments", payments);
  return payments;
};

// ============================================================
// DYNAMIC MEALS & SCHEDULES
// ============================================================

export const listMealSchedules = async () => { 
  const client = db();
  if (client) {
    try {
      const res = await getData(client.from("meal_schedules").select("*"));
      if (res && res.length > 0) return res.map(mapMealSchedule);
    } catch (e) {}
  }
  return getLocal("meal_schedules", []).map(mapMealSchedule);
};

export const upsertMealSchedule = async (payload) => {
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("meal_schedules")
          .upsert([{ 
            id: payload.id || undefined, 
            day_of_week: payload.dayOfWeek, 
            meal_type: payload.mealType, 
            menu: payload.menu, 
            price: Number(payload.price || 0), 
            start_time: payload.startTime || "08:00", 
            cancellation_deadline_minutes: Number(payload.cancellationDeadlineMinutes || 30), 
            is_available: payload.isAvailable !== false, 
            updated_at: nowIso() 
          }], { onConflict: "id" })
          .select()
          .single()
      );
      if (result) return mapMealSchedule(result);
    } catch (e) {}
  }

  const schedule = mapMealSchedule({ ...payload, id: payload.id || `schedule-${Date.now()}`, updatedAt: nowIso() });
  const schedules = getLocal("meal_schedules", []);
  const idx = schedules.findIndex((s) => s.id === schedule.id);
  if (idx !== -1) schedules[idx] = schedule;
  else schedules.push(schedule);
  setLocal("meal_schedules", schedules);
  return schedule;
};

export const deleteMealSchedule = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("meal_schedules").delete().eq("id", id));
    } catch (e) {}
  }
  const schedules = getLocal("meal_schedules", []).filter((s) => s.id !== id);
  setLocal("meal_schedules", schedules);
  return schedules;
};

export const listMeals = async (studentId, date) => { 
  let dbMeals = [];
  const client = db();
  if (client) {
    try {
      let query = client.from("meals").select("*").order("date", { ascending: false }); 
      if (studentId) query = query.eq("student_id", studentId); 
      if (date) query = query.eq("date", date); 
      dbMeals = (await getData(query)).map(mapMeal);
    } catch (e) {}
  }
  
  const localMeals = getLocal("meals", []).map(mapMeal).filter((m) => {
    if (studentId && m.studentId !== studentId) return false;
    if (date && m.date !== date) return false;
    return true;
  });

  const mealMap = new Map();
  dbMeals.forEach((m) => mealMap.set(`${m.studentId}_${m.date}_${m.type}`, m));
  localMeals.forEach((m) => mealMap.set(`${m.studentId}_${m.date}_${m.type}`, m));

  return Array.from(mealMap.values()).sort((a, b) => b.date.localeCompare(a.date));
};

export const upsertMeal = async (payload) => {
  const mealRecord = mapMeal({
    id: payload.id || `meal-${payload.studentId}-${payload.date}-${payload.type}`,
    date: payload.date,
    type: payload.type,
    status: payload.status || "Active",
    menu: payload.menu || "",
    cost: Number(payload.cost || 0),
    studentId: payload.studentId,
    mealTime: payload.mealTime || null,
    isAvailable: payload.isAvailable !== false,
    createdAt: nowIso(),
    updatedAt: nowIso()
  });

  const meals = getLocal("meals", []);
  const idx = meals.findIndex((m) => m.studentId === payload.studentId && m.date === payload.date && m.type === payload.type);
  if (idx !== -1) meals[idx] = mealRecord;
  else meals.push(mealRecord);
  setLocal("meals", meals);

  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("meals")
          .upsert([{ 
            id: payload.id || undefined, 
            date: payload.date, 
            type: payload.type, 
            status: payload.status || "Active", 
            menu: payload.menu, 
            cost: Number(payload.cost || 0), 
            student_id: payload.studentId, 
            meal_time: payload.mealTime || null, 
            updated_at: nowIso() 
          }], { onConflict: payload.id ? "id" : "student_id,date,type" })
          .select()
          .single()
      );
      if (result) return mapMeal(result);
    } catch (e) {}
  }

  return mealRecord;
};

export const deleteMeal = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("meals").delete().eq("id", id));
    } catch (e) {}
  }
  const meals = getLocal("meals", []).filter((m) => m.id !== id);
  setLocal("meals", meals);
  return meals;
};

export const mealSummaryForDate = async (targetDate) => {
  const date = targetDate || todayIso();
  const meals = await listMeals(null, date);
  const activeMeals = meals.filter((m) => m.status === "Active");
  const cancelledMeals = meals.filter((m) => m.status === "Cancelled");
  return {
    date,
    total: meals.length,
    breakfast: activeMeals.filter((m) => (m.type || "").toLowerCase() === "breakfast").length,
    lunch: activeMeals.filter((m) => (m.type || "").toLowerCase() === "lunch").length,
    dinner: activeMeals.filter((m) => (m.type || "").toLowerCase() === "dinner").length,
    cancelled: cancelledMeals.length,
    active: activeMeals.length
  };
};

// ============================================================
// DYNAMIC NOTICES
// ============================================================

export const listNotices = async (audience, activeOnly = false) => { 
  const client = db();
  if (client) {
    try {
      let query = client.from("notices").select("*").order("created_at", { ascending: false }); 
      if (activeOnly) query = query.eq("is_active", true); 
      const rows = (await getData(query)).map(mapNotice); 
      if (rows && rows.length > 0) {
        if (!audience) return rows; 
        return rows.filter((n) => 
          n.targetAudience === "ALL" || 
          n.targetAudience === audience || 
          n.targetAudience === `${audience}s` || 
          n.targetAudience === `STUDENT:${audience}`
        );
      }
    } catch (e) {}
  }

  let notices = getLocal("notices", []).map(mapNotice);
  if (activeOnly) notices = notices.filter((n) => n.isActive);
  if (!audience) return notices;
  return notices.filter((n) => 
    n.targetAudience === "ALL" || 
    n.targetAudience === audience || 
    n.targetAudience === `${audience}s` || 
    n.targetAudience === `STUDENT:${audience}`
  );
};

export const upsertNotice = async (payload, sender) => {
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("notices")
          .upsert([{ 
            id: payload.id || undefined, 
            title: payload.title, 
            content: payload.content, 
            target_audience: payload.targetAudience || "ALL", 
            attachment_url: payload.attachmentUrl || null, 
            created_by: sender?.name || payload.createdBy || "Admin", 
            is_active: payload.isActive !== false, 
            updated_at: nowIso() 
          }], { onConflict: "id" })
          .select()
          .single()
      );
      if (result) return mapNotice(result);
    } catch (e) {}
  }

  const notice = mapNotice({ ...payload, id: payload.id || `notice-${Date.now()}`, createdBy: sender?.name || "Admin", createdAt: nowIso() });
  const notices = getLocal("notices", []);
  const idx = notices.findIndex((n) => n.id === notice.id);
  if (idx !== -1) notices[idx] = notice;
  else notices.unshift(notice);
  setLocal("notices", notices);
  return notice;
};

export const deleteNotice = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("notices").delete().eq("id", id));
    } catch (e) {}
  }
  const notices = getLocal("notices", []).filter((n) => n.id !== id);
  setLocal("notices", notices);
  return notices;
};

// ============================================================
// DYNAMIC NOTIFICATIONS
// ============================================================

export const sendNotification = async (payload, sender) => { 
  const title = payload.title || "Notification";
  const message = payload.message || "";
  const type = payload.type || "Info";
  const priority = payload.priority || "Normal";
  const targetAudience = payload.targetAudience || "ALL";
  const senderId = payload.senderId || sender?.id || sender?.studentId || null;
  const senderName = sender?.name || payload.senderName || "System";
  const receiverStudentId = payload.receiverStudentId || null;
  const receiverId = payload.receiverId || null;
  const receiverRole = payload.receiverRole || null;
  const relatedRecordId = payload.relatedRecordId || null;

  const newNotif = mapNotification({
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    message,
    type,
    priority,
    targetAudience,
    senderId,
    senderName,
    receiverStudentId,
    receiverId,
    receiverRole,
    relatedRecordId,
    createdAt: nowIso()
  });

  const notifs = getLocal("notifications", []);
  notifs.unshift(newNotif);
  setLocal("notifications", notifs);

  const client = db();
  if (client) {
    try {
      await getData(client.from("notifications").insert([{ 
        title, 
        message, 
        type, 
        priority, 
        target_audience: targetAudience, 
        sender_id: senderId,
        sender_name: senderName, 
        receiver_student_id: receiverStudentId, 
        receiver_id: receiverId,
        receiver_role: receiverRole, 
        related_record_id: relatedRecordId,
        created_at: nowIso() 
      }]));
    } catch (e) {
      console.error("sendNotification DB error:", e);
    }
  }

  return [newNotif];
};

export const createNotification = sendNotification;

export const listNotificationsForUser = async (user) => { 
  if (!user) return [];
  const userKey = user.id || user.studentId || user.role || "user";
  const readNotifIds = getLocal(`read_notifs_${userKey}`, []);

  let notifList = [];
  const client = db();
  if (client) {
    try {
      const rows = await getData(
        client.from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100)
      );
      if (rows && rows.length > 0) {
        notifList = rows.map(mapNotification);
      }
    } catch (e) {}
  }

  if (!notifList.length) {
    notifList = getLocal("notifications", []).map(mapNotification);
  }

  return notifList.filter((n) => {
    // 1. Specific student targeting
    if (n.receiverStudentId) {
      if (user.role === "STUDENT") {
        return String(user.studentId) === String(n.receiverStudentId);
      }
      return user.role === "ADMIN" || user.role === "EMPLOYEE";
    }

    // 2. Specific user ID targeting
    if (n.receiverId) {
      return String(user.id) === String(n.receiverId) || String(user.studentId) === String(n.receiverId);
    }

    // 3. Explicit Role-based targeting
    if (n.receiverRole) {
      if (n.receiverRole === "ADMIN") return user.role === "ADMIN";
      if (n.receiverRole === "EMPLOYEE") return user.role === "EMPLOYEE" || user.role === "ADMIN";
      if (n.receiverRole === "STUDENT") return user.role === "STUDENT";
    }

    // 4. Target audience broadcast & role isolation
    const audience = String(n.targetAudience || "ALL").toUpperCase();

    if (user.role === "ADMIN") {
      return true; // Admin sees administrative logs & system notifications
    }

    if (user.role === "STUDENT") {
      // Students MUST NOT see notifications meant for ADMIN or EMPLOYEE
      if (audience === "ADMIN" || audience === "EMPLOYEE" || audience === "STAFF") return false;

      // Students MUST NOT see private leave, complaint, or payment notifications from other students
      if (n.senderId && String(n.senderId) !== String(user.studentId) && (n.type === "Leave" || n.type === "Complaint" || n.type === "Payment")) {
        return false;
      }
      return audience === "ALL" || audience === "STUDENT" || audience === "STUDENTS";
    }

    if (user.role === "EMPLOYEE") {
      if (audience === "STUDENT" || audience === "STUDENTS") return false;
      return audience === "ALL" || audience === "EMPLOYEE" || audience === "EMPLOYEES" || audience === "ALL_STAFF" || audience === "STAFF";
    }

    return false;
  }).map((n) => ({
    ...n,
    isRead: readNotifIds.includes(n.id) || Boolean(n.isRead)
  }));
};

export const markNotificationRead = async (id, user) => {
  if (user) {
    const userKey = user.id || user.studentId || user.role || "user";
    const readNotifIds = getLocal(`read_notifs_${userKey}`, []);
    if (!readNotifIds.includes(id)) {
      readNotifIds.push(id);
      setLocal(`read_notifs_${userKey}`, readNotifIds);
    }
  }

  // Update in local notifications state as well
  const notifs = getLocal("notifications", []);
  const idx = notifs.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notifs[idx].isRead = true;
    notifs[idx].readAt = nowIso();
    setLocal("notifications", notifs);
  }

  const client = db();
  if (client && user) {
    try {
      await getData(
        client.from("notification_receipts")
          .upsert([{ 
            notification_id: id, 
            receiver_id: user.id || undefined, 
            receiver_student_id: user.studentId || null, 
            receiver_role: user.role || null, 
            is_read: true, 
            read_at: nowIso() 
          }], { onConflict: "notification_id,receiver_id" })
      );
    } catch (e) {}
  }

  return { id, isRead: true };
};

export const markAllNotificationsRead = async (ids = [], user = null) => { 
  if (!ids || !ids.length) return [];

  if (user) {
    const userKey = user.id || user.studentId || user.role || "user";
    const readNotifIds = getLocal(`read_notifs_${userKey}`, []);
    ids.forEach((id) => {
      if (!readNotifIds.includes(id)) readNotifIds.push(id);
    });
    setLocal(`read_notifs_${userKey}`, readNotifIds);
  }

  const notifs = getLocal("notifications", []);
  notifs.forEach((n) => {
    if (ids.includes(n.id)) {
      n.isRead = true;
      n.readAt = nowIso();
    }
  });
  setLocal("notifications", notifs);
  return notifs;
};

export const subscribeToNotifications = (user, onChange) => { 
  if (!supabase || !user) return () => {}; 
  try {
    const channel = supabase
      .channel(`notifications:${user.id || user.studentId || user.role}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, onChange)
      .subscribe(); 
    return () => supabase.removeChannel(channel);
  } catch (error) {
    return () => {};
  }
};

// ============================================================
// DYNAMIC TASKS
// ============================================================

export const listTasks = async (staffId) => { 
  const client = db();
  if (client) {
    try {
      let query = client.from("staff_tasks").select("*").order("created_at", { ascending: false }); 
      if (staffId) query = query.or(`staff_id.eq.${staffId},staff_id.is.null`); 
      const rows = await getData(query);
      if (rows && rows.length > 0) return rows.map(mapTask);
    } catch (e) {}
  }

  const tasks = getLocal("tasks", []).map(mapTask);
  return staffId ? tasks.filter((t) => !t.staffId || t.staffId === staffId) : tasks;
};

export const upsertTask = async (payload) => {
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("staff_tasks")
          .upsert([clean({ 
            id: payload.id || undefined, 
            title: payload.title, 
            description: payload.description, 
            priority: payload.priority || "Medium", 
            location: payload.location || "Hostel", 
            status: payload.status || "Pending", 
            assigned_at: payload.assignedAt || formatDateTime(nowIso()), 
            staff_id: payload.staffId || null, 
            staff_name: payload.staffName || null, 
            due_date: payload.dueDate || null, 
            feedback: payload.feedback || null,
            is_staff_request: payload.isStaffRequest || false,
            completed_at: payload.status === "Completed" ? nowIso() : null 
          })], { onConflict: "id" })
          .select()
          .single()
      );
      if (result) return mapTask(result);
    } catch (e) {}
  }

  const task = mapTask({ ...payload, id: payload.id || `task-${Date.now()}`, createdAt: nowIso() });
  const tasks = getLocal("tasks", []);
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx !== -1) tasks[idx] = task;
  else tasks.unshift(task);
  setLocal("tasks", tasks);
  return task;
};

export const createStaffRequest = async (payload, staffUser) => {
  const taskPayload = {
    id: `staff-req-${Date.now()}`,
    title: payload.title.startsWith("[Staff Request]") ? payload.title : `[Staff Request] ${payload.title}`,
    description: payload.description,
    priority: payload.priority || "Medium",
    location: payload.location || staffUser?.hostelBlock || "Hostel",
    status: "Pending",
    staffId: staffUser?.id || staffUser?.uid || null,
    staffName: staffUser?.name || "Staff Member",
    isStaffRequest: true,
    assignedAt: formatDateTime(nowIso())
  };
  const task = await upsertTask(taskPayload);
  await sendNotification(
    {
      title: "New Staff Request",
      message: `${staffUser?.name || "Staff"} (${staffUser?.hostelBlock || "Staff"}) submitted request: ${payload.title}`,
      targetAudience: "ADMINS",
      type: "Alert",
      priority: payload.priority === "Urgent" || payload.priority === "High" ? "High" : "Normal"
    },
    staffUser
  ).catch(() => null);
  return task;
};

export const completeTaskWithFeedback = async (task, feedback, staffUser) => {
  const updatedTask = await upsertTask({
    ...task,
    status: "Completed",
    feedback: feedback || task.feedback || "Completed",
    completedAt: nowIso()
  });
  await sendNotification(
    {
      title: "Task Completed by Staff",
      message: `${staffUser?.name || "Staff"} completed task "${task.title}". Feedback: ${feedback || "No additional feedback"}`,
      targetAudience: "ADMINS",
      type: "Info",
      priority: "Normal"
    },
    staffUser
  ).catch(() => null);
  return updatedTask;
};

export const deleteTask = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("staff_tasks").delete().eq("id", id));
    } catch (e) {}
  }
  const tasks = getLocal("tasks", []).filter((t) => t.id !== id);
  setLocal("tasks", tasks);
  return tasks;
};

// ============================================================
// DYNAMIC VISITORS & MOVEMENTS
// ============================================================

export const listVisitors = async () => { 
  const client = db();
  if (client) {
    try {
      const rows = await getData(client.from("visitors").select("*").order("created_at", { ascending: false }).limit(100));
      if (rows && rows.length > 0) return rows.map(mapVisitor);
    } catch (e) {}
  }
  return getLocal("visitors", []).map(mapVisitor);
};

export const upsertVisitor = async (payload) => {
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("visitors")
          .upsert([{ 
            id: payload.id || undefined, 
            visitor_name: payload.visitorName, 
            student_id: payload.studentId, 
            student_name: payload.studentName || null, 
            relation: payload.relation, 
            from_location: payload.fromLocation, 
            purpose: payload.purpose || "Visit", 
            time_in: payload.timeIn || nowIso(), 
            time_out: payload.timeOut || null 
          }], { onConflict: "id" })
          .select()
          .single()
      );
      if (result) return mapVisitor(result);
    } catch (e) {}
  }

  const visitor = mapVisitor({ ...payload, id: payload.id || `visitor-${Date.now()}`, timeIn: payload.timeIn || nowIso(), createdAt: nowIso() });
  const visitors = getLocal("visitors", []);
  const idx = visitors.findIndex((v) => v.id === visitor.id);
  if (idx !== -1) visitors[idx] = visitor;
  else visitors.unshift(visitor);
  setLocal("visitors", visitors);
  return visitor;
};

export const deleteVisitor = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("visitors").delete().eq("id", id));
    } catch (e) {}
  }
  const visitors = getLocal("visitors", []).filter((v) => v.id !== id);
  setLocal("visitors", visitors);
  return visitors;
};

export const listMovements = async () => { 
  const client = db();
  if (client) {
    try {
      const rows = await getData(client.from("movements").select("*").order("created_at", { ascending: false }).limit(100));
      if (rows && rows.length > 0) return rows.map(mapMovement);
    } catch (e) {}
  }
  return getLocal("movements", []).map(mapMovement);
};

export const upsertMovement = async (payload) => {
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("movements")
          .upsert([{ 
            id: payload.id || undefined, 
            student_id: payload.studentId, 
            student_name: payload.studentName || null, 
            destination: payload.destination, 
            purpose: payload.purpose || null, 
            time_out: payload.timeOut || nowIso(), 
            time_back: payload.timeBack || null 
          }], { onConflict: "id" })
          .select()
          .single()
      );
      if (result) return mapMovement(result);
    } catch (e) {}
  }

  const movement = mapMovement({ ...payload, id: payload.id || `movement-${Date.now()}`, timeOut: payload.timeOut || nowIso(), createdAt: nowIso() });
  const movements = getLocal("movements", []);
  const idx = movements.findIndex((m) => m.id === movement.id);
  if (idx !== -1) movements[idx] = movement;
  else movements.unshift(movement);
  setLocal("movements", movements);
  return movement;
};

export const deleteMovement = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("movements").delete().eq("id", id));
    } catch (e) {}
  }
  const movements = getLocal("movements", []).filter((m) => m.id !== id);
  setLocal("movements", movements);
  return movements;
};

// ============================================================
// DYNAMIC ROOMS
// ============================================================

export const listRooms = async () => { 
  const client = db();
  if (client) {
    try {
      const rows = await getData(client.from("rooms").select("*").order("block").order("room_no"));
      if (rows && rows.length > 0) return rows.map(mapRoom);
    } catch (e) {}
  }
  return getLocal("rooms", []).map(mapRoom);
};

export const upsertRoom = async (payload) => {
  const client = db();
  if (client) {
    try {
      const result = await getOne(
        client.from("rooms")
          .upsert([{ 
            id: payload.id || undefined, 
            block: payload.block, 
            room_no: payload.roomNo, 
            floor: payload.floor || null, 
            capacity: Number(payload.capacity || 0), 
            occupied: Number(payload.occupied || 0), 
            status: payload.status || "Available" 
          }], { onConflict: "id" })
          .select()
          .single()
      );
      if (result) return mapRoom(result);
    } catch (e) {}
  }

  const room = mapRoom({ ...payload, id: payload.id || `room-${Date.now()}` });
  const rooms = getLocal("rooms", []);
  const idx = rooms.findIndex((r) => r.id === room.id);
  if (idx !== -1) rooms[idx] = room;
  else rooms.push(room);
  setLocal("rooms", rooms);
  return room;
};

export const deleteRoom = async (id) => {
  const client = db();
  if (client) {
    try {
      await getData(client.from("rooms").delete().eq("id", id));
    } catch (e) {}
  }
  const rooms = getLocal("rooms", []).filter((r) => r.id !== id);
  setLocal("rooms", rooms);
  return rooms;
};

// ============================================================
// DASHBOARD STATS
// ============================================================

export const getDashboardStats = async () => {
  try {
    const [
      students, 
      employees, 
      meals, 
      leaves, 
      complaints, 
      payments, 
      tasks, 
      visitors, 
      movements
    ] = await Promise.all([
      listStudents().catch(() => []), 
      listEmployees().catch(() => []), 
      listMeals().catch(() => []), 
      listLeaves().catch(() => []), 
      listComplaints().catch(() => []), 
      listPayments().catch(() => []), 
      listTasks().catch(() => []), 
      listVisitors().catch(() => []), 
      listMovements().catch(() => [])
    ]);
    
    return { 
      totalStudents: students?.length || 0, 
      pendingStudents: students?.filter((s) => !s.isApproved).length || 0, 
      totalEmployees: employees?.length || 0, 
      activeMeals: meals?.filter((m) => m.status === "Active").length || 0, 
      cancelledMeals: meals?.filter((m) => m.status === "Cancelled").length || 0, 
      pendingLeaves: leaves?.filter((l) => l.status === "Pending").length || 0, 
      openComplaints: complaints?.filter((c) => c.status !== "Resolved").length || 0, 
      totalRevenue: payments?.reduce((s, p) => s + (p.paidAmount || 0), 0) || 0, 
      pendingDues: payments?.reduce((s, p) => s + (p.balance || 0), 0) || 0, 
      pendingTasks: tasks?.filter((t) => t.status !== "Completed").length || 0, 
      activeVisitors: visitors?.filter((v) => !v.timeOut).length || 0, 
      studentsOut: movements?.filter((m) => !m.timeBack).length || 0 
    };
  } catch (error) {
    return {
      totalStudents: 0,
      pendingStudents: 0,
      totalEmployees: 0,
      activeMeals: 0,
      cancelledMeals: 0,
      pendingLeaves: 0,
      openComplaints: 0,
      totalRevenue: 0,
      pendingDues: 0,
      pendingTasks: 0,
      activeVisitors: 0,
      studentsOut: 0
    };
  }
};

export const exportCsv = (filename, rows) => { 
  try {
    if (!rows || !rows.length) return;
    const header = Object.keys(rows[0] || { empty: "" }); 
    const csv = [
      header.join(","), 
      ...rows.map((row) => header.map((key) => JSON.stringify(row[key] ?? "")).join(","))
    ].join("\n"); 
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); 
    const url = URL.createObjectURL(blob); 
    const link = document.createElement("a"); 
    link.href = url; 
    link.download = filename; 
    link.click(); 
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("exportCsv error:", error);
  }
};
