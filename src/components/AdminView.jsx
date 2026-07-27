import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, BellRing, Check, ClipboardList, DollarSign, Download, Edit, Eye, FileText, Home, Plus, RefreshCcw, Search, Trash2, Users, Utensils, ArrowLeft, Calendar, CreditCard, MessageSquare, Wallet, Coffee } from "lucide-react";
import { buildFinancialSnapshot } from "../financialService";
import { Button, Card, EmptyState, Field, LoadingState, Modal, PageHeader, SelectInput, StatCard, StatusBadge, TextArea, TextInput, Toast, confirmAction } from "./ui";
import { ReceiptModal } from "./ReceiptModal";
import * as api from "../services/hostelService";

const blankNotice = { title: "", content: "", targetAudience: "ALL", attachmentUrl: "", isActive: true };
const blankTask = { title: "", description: "", priority: "Medium", location: "", status: "Pending", staffId: "", dueDate: "" };
const blankSchedule = { dayOfWeek: "Saturday", mealType: "Breakfast", menu: "", price: 30, startTime: "08:00", cancellationDeadlineMinutes: 30, isAvailable: true };
const blankRoom = { block: "Hostel A", roomNo: "", floor: "", capacity: 4, occupied: 0, status: "Available" };
const blankPayment = { studentId: "", billingPeriod: "", invoiceDate: api.todayIso(), totalBill: 0, paidAmount: 0, description: "Seat Rent, Meal Charge & Service Charge" };
const blankNotification = { title: "", message: "", targetAudience: "ALL_STUDENTS", receiverStudentId: "", type: "Info", priority: "Normal", expiresAt: "" };
const blankEmployee = { uid: "", name: "", designation: "Hostel Warden", hostelBlock: "Hostel A", phone: "01700000000", password: "password123", isActive: true };

// Student Details Component
const StudentDetailsView = ({ student, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);
  const [movements, setMovements] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [paymentModal, setPaymentModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [mealData, leaveData, complaintData, paymentData, movementData, visitorData] = await Promise.all([
        api.listMeals(student.studentId),
        api.listLeaves(student.studentId),
        api.listComplaints(student.studentId),
        api.listPayments(student.studentId),
        api.listMovements(),
        api.listVisitors()
      ]);
      setMeals(mealData);
      setLeaves(leaveData);
      setComplaints(complaintData);
      setPayments(paymentData);
      setMovements(movementData.filter((m) => m.studentId === student.studentId));
      setVisitors(visitorData.filter((v) => v.studentId === student.studentId));
    } catch (error) {
      console.error("Error loading student data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStudentData();
  }, [student.studentId]);

  const financial = useMemo(() => {
    try {
      return buildFinancialSnapshot({
        studentId: student.studentId,
        student,
        meals: meals || [],
        leaveRequests: leaves || [],
        payments: payments || []
      });
    } catch (error) {
      console.error("Financial snapshot error:", error);
      return {
        totalBill: 0,
        totalPaid: 0,
        balanceDue: 0,
        currentMonthFee: 0,
        totalOutstanding: 0,
        statements: [],
        payments: []
      };
    }
  }, [meals, leaves, payments, student]);

  const handleSavePayment = async (formData) => {
    try {
      await api.upsertPayment(formData);
      await loadStudentData();
      setPaymentModal(null);
    } catch (err) {
      console.error("Payment save failed:", err);
    }
  };

  if (loading) return <LoadingState />;

  const currentMonthStr = api.todayIso().slice(0, 7);
  const currentMonthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const studentMonthMeals = (meals || []).filter((m) => m.date && m.date.startsWith(currentMonthStr) && m.status !== "Cancelled");
  
  const studentBf = studentMonthMeals.filter((m) => m.type === "Breakfast").length;
  const studentLunch = studentMonthMeals.filter((m) => m.type === "Lunch").length;
  const studentDinner = studentMonthMeals.filter((m) => m.type === "Dinner").length;
  const studentTotalMeals = studentMonthMeals.length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white rounded-lg border border-slate-200 hover:text-blue-600 transition-colors shadow-xs cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">Student Profile & Management</h2>
        </div>
        <Button onClick={() => setPaymentModal({ studentId: student.studentId, billingPeriod: financial.currentStatement?.month || "Current Month", totalBill: financial.currentMonthFee, paidAmount: financial.currentMonthFee, invoiceDate: api.todayIso() })}>
          <CreditCard className="w-4 h-4" /> Record / Confirm Payment
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 bg-slate-900 p-8 flex flex-col items-center text-white">
            <img src={student.avatar} alt={student.name} className="w-28 h-28 rounded-full border-4 border-white/50 shadow-xl object-cover" />
            <h3 className="text-xl font-bold mt-4 text-center">{student.name}</h3>
            <p className="text-xs opacity-80 mt-0.5">{student.studentId}</p>
            <StatusBadge tone={student.isApproved ? "green" : "orange"} className="mt-3">
              {student.isApproved ? "Approved" : "Pending Approval"}
            </StatusBadge>
          </div>
          <div className="md:w-2/3 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Department</p>
                <p className="font-semibold text-slate-800">{student.department || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hostel Block</p>
                <p className="font-semibold text-slate-800">{student.hostelBlock || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Room Number</p>
                <p className="font-semibold text-slate-800">{student.roomNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone</p>
                <p className="font-semibold text-slate-800">{student.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Contact</p>
                <p className="font-semibold text-slate-800">{student.emergencyContact || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Status</p>
                <StatusBadge tone={student.isActive ? "green" : "red"}>
                  {student.isActive ? "Active Resident" : "Inactive / Discharged"}
                </StatusBadge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Current Month Student Meal Count Box */}
      <Card className="p-5 border-emerald-200 bg-emerald-50/30">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60 mb-4">
          <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
            <Utensils className="w-5 h-5 text-emerald-600" />
            <span>Current Month Meal Count ({currentMonthName})</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
            Refreshes Monthly
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Meals Taken</p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">{studentTotalMeals}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-amber-600">Breakfast</p>
            <p className="text-xl font-bold text-amber-700 mt-0.5">{studentBf}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-orange-600">Lunch</p>
            <p className="text-xl font-bold text-orange-700 mt-0.5">{studentLunch}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-indigo-600">Dinner</p>
            <p className="text-xl font-bold text-indigo-700 mt-0.5">{studentDinner}</p>
          </div>
        </div>
      </Card>

      {/* Sensitive Actions / Secure Discharge Zone */}
      <Card className="p-5 border-red-200 bg-red-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-red-900 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" /> Administrative Discharge & Account Rejection Zone
            </h3>
            <p className="text-xs text-red-700 mt-1">
              Discharging or rejecting a student is a sensitive action that deactivates their hostel account, releases their assigned room seat, and clears active meal schedules.
            </p>
          </div>
          <Button 
            variant="danger" 
            onClick={() => setShowRejectConfirm(true)}
            className="flex-shrink-0 text-xs py-2.5 px-4 font-bold cursor-pointer"
          >
            Reject / Discharge Student
          </Button>
        </div>
      </Card>

      {/* FOUR Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bill" value={`৳${(financial.totalBill || 0).toLocaleString()}`} icon={<FileText />} tone="blue" />
        <StatCard title="Total Paid" value={`৳${(financial.totalPaid || 0).toLocaleString()}`} icon={<Check />} tone="green" />
        <StatCard title="Balance Due" value={`৳${(financial.balanceDue || 0).toLocaleString()}`} icon={<Wallet />} tone="red" />
        <StatCard title="Current Month Fee" value={`৳${(financial.currentMonthFee || 0).toLocaleString()}`} icon={<Coffee />} tone="orange" />
      </div>

      {/* Monthly Financial History */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b font-bold flex items-center justify-between text-slate-800 bg-gray-50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            <span>Monthly Financial History & Dues</span>
          </div>
          <span className="text-xs font-semibold text-gray-500">Seat Rent (৳4,500) + Meal Charges</span>
        </div>
        <DataTable 
          headers={["Month", "Seat Rent", "Meal Charges", "Total Bill", "Paid Amount", "Balance Due", "Status", "Actions"]} 
          rows={financial.statements.map((s) => [
            <div key="m">
              <p className="font-extrabold text-gray-800">{s.month}</p>
              <p className="text-[11px] text-gray-500">{s.completedMealsCount || 0} Meals Served</p>
            </div>, 
            `৳${(s.seatRent || 4500).toLocaleString()}`, 
            `৳${(s.mealCharges || 0).toLocaleString()}`, 
            <span key="tb" className="font-extrabold text-gray-900">৳${(s.totalBill || 0).toLocaleString()}</span>, 
            <span key="pa" className="font-bold text-emerald-700">৳${(s.paidAmount || 0).toLocaleString()}</span>, 
            <span key="bd" className={`font-extrabold ${s.remainingDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
              ৳${(s.remainingDue || 0).toLocaleString()}
            </span>, 
            <StatusBadge key="sb" tone={s.status === "Paid" ? "green" : s.status === "Partial" ? "orange" : "red"}>{s.status}</StatusBadge>, 
            <div key="act" className="flex items-center gap-2">
              <Button variant="secondary" className="text-xs" onClick={() => setPaymentModal({ studentId: student.studentId, billingPeriod: s.month, totalBill: s.totalBill, paidAmount: s.remainingDue > 0 ? s.remainingDue : s.totalBill, invoiceDate: api.todayIso() })}>
                Mark Paid
              </Button>
              {(s.status === "Paid" || (s.paidAmount || 0) > 0) && (
                <Button variant="secondary" className="text-xs" onClick={() => setReceiptModal({ ...s, studentName: student.name, studentId: student.studentId, department: student.department, hostelBlock: student.hostelBlock, roomNo: student.roomNumber })}>
                  <Download className="w-3.5 h-3.5" /> Receipt
                </Button>
              )}
            </div>
          ])} 
        />
      </Card>

      {/* Meal History */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b font-bold flex items-center gap-2 text-slate-800">
          <Utensils className="w-5 h-5 text-blue-600" />
          Meal History Log
        </div>
        <DataTable 
          headers={["Date", "Meal", "Menu", "Cost", "Status"]} 
          rows={meals.map((m) => [
            m.date, 
            m.type, 
            <span key="1" className="text-xs">{m.menu}</span>, 
            `৳${m.cost}`, 
            <StatusBadge key="2" tone={m.status === "Active" ? "green" : "red"}>{m.status}</StatusBadge>
          ])} 
        />
      </Card>

      {/* Leave History */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b font-bold flex items-center gap-2 text-slate-800">
          <Calendar className="w-5 h-5 text-blue-600" />
          Leave Request History
        </div>
        <DataTable 
          headers={["Start Date", "End Date", "Reason", "Status"]} 
          rows={leaves.map((l) => [
            l.startDate, 
            l.endDate, 
            l.reason, 
            <StatusBadge key="sb" tone={l.status === "Approved" ? "green" : l.status === "Rejected" ? "red" : "orange"}>
              {l.status}
            </StatusBadge>
          ])} 
        />
      </Card>

      {/* Modals */}
      {paymentModal && (
        <PaymentForm 
          initial={paymentModal} 
          onClose={() => setPaymentModal(null)} 
          onSave={handleSavePayment} 
        />
      )}

      {receiptModal && (
        <ReceiptModal 
          receipt={receiptModal} 
          student={student} 
          onClose={() => setReceiptModal(null)} 
        />
      )}

      {/* Explicit Discharge Confirmation Modal */}
      {showRejectConfirm && (
        <Modal 
          title="Confirm Student Discharge / Rejection" 
          onClose={() => setShowRejectConfirm(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowRejectConfirm(false)}>Cancel</Button>
              <Button 
                variant="danger" 
                onClick={async () => {
                  await api.rejectStudent(student.id);
                  setShowRejectConfirm(false);
                  if (onBack) onBack();
                }}
              >
                Confirm & Discharge Student
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <p className="font-bold text-red-600">
              Warning: You are about to discharge / reject <span className="underline">{student.name}</span> (ID: {student.studentId}).
            </p>
            <p>
              This will set their account status to <b>Discharged / Inactive</b>, release seat <b>Room {student.roomNumber || "N/A"}</b>, and prevent future meal bookings.
            </p>
            <p className="text-slate-500 italic">
              Please ensure all outstanding financial dues are settled prior to confirming discharge.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Resolve Complaint Modal
const ResolveComplaintModal = ({ complaint, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: complaint.id,
    type: complaint.type || "Maintenance",
    description: complaint.description || "",
    priority: complaint.priority || "Medium",
    targetRecipient: complaint.targetRecipient || "BOTH",
    assignedTo: complaint.assignedTo || "",
    status: complaint.status || "In Progress",
    resolutionNote: complaint.resolutionNote || ""
  });

  return (
    <Modal 
      title="Resolve Complaint & Provide Student Feedback" 
      onClose={onClose} 
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save Resolution</Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="font-bold text-slate-800">{complaint.studentName || "Student"} <span className="text-slate-500 font-normal">({complaint.studentId})</span></p>
          <p className="text-slate-600 mt-1 italic">"{complaint.description}"</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Complaint Status">
            <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </SelectInput>
          </Field>
          <Field label="Assign Staff Member / Department">
            <TextInput 
              value={form.assignedTo} 
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} 
              placeholder="e.g. Shahidul Islam / Housekeeping" 
            />
          </Field>
        </div>

        <Field label="Resolution Details / Reply Note for Student">
          <TextArea 
            rows={4} 
            value={form.resolutionNote} 
            onChange={(e) => setForm({ ...form, resolutionNote: e.target.value })} 
            placeholder="Explain action taken or response to student..." 
          />
        </Field>
      </div>
    </Modal>
  );
};

export const AdminView = ({ activePage, onNavigate, user }) => {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notices, setNotices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [movements, setMovements] = useState([]);
  const [notificationRecords, setNotificationRecords] = useState([]);
  const [meals, setMeals] = useState([]);
  const [dischargeRequests, setDischargeRequests] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffBlockFilter, setStaffBlockFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("ALL");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("ALL");
  const [complaintPriorityFilter, setComplaintPriorityFilter] = useState("ALL");
  const [modal, setModal] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const pendingLeaves = useMemo(() => {
    return (leaves || []).filter((l) => l.status === "Pending");
  }, [leaves]);

  const openComplaints = useMemo(() => {
    return (complaints || []).filter((c) => c.status === "Open" || c.status === "In Progress");
  }, [complaints]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      (s.name || "").toLowerCase().includes(q) ||
      (s.studentId || "").toLowerCase().includes(q) ||
      (s.roomNumber || "").toLowerCase().includes(q) ||
      (s.hostelBlock || "").toLowerCase().includes(q)
    );
  }, [students, search]);

  const notify = (message, type = "success") => { 
    setToast({ message, type }); 
    setTimeout(() => setToast(null), 3500); 
  };

  const load = async () => {
    setLoading(true);
    try {
      const [
        statsData, 
        studentsData, 
        employeesData, 
        leavesData, 
        complaintsData, 
        paymentsData, 
        schedulesData, 
        tasksData, 
        noticesData, 
        roomsData, 
        visitorsData, 
        movementsData, 
        notificationData,
        mealsData,
        dischargeData
      ] = await Promise.all([
        api.getDashboardStats(), 
        api.listStudents(), 
        api.listEmployees(), 
        api.listLeaves(), 
        api.listComplaints(), 
        api.listPayments(), 
        api.listMealSchedules(), 
        api.listTasks(), 
        api.listNotices(), 
        api.listRooms(), 
        api.listVisitors(), 
        api.listMovements(), 
        api.listNotificationsForUser(user),
        api.listMeals(),
        api.listDischargeRequests()
      ]);
      
      setStats(statsData); 
      setStudents(studentsData); 
      setEmployees(employeesData); 
      setLeaves(leavesData); 
      setComplaints(complaintsData); 
      setPayments(paymentsData); 
      setSchedules(schedulesData); 
      setTasks(tasksData); 
      setNotices(noticesData); 
      setRooms(roomsData); 
      setVisitors(visitorsData); 
      setMovements(movementsData);
      setNotificationRecords(notificationData);
      setMeals(mealsData);
      setDischargeRequests(dischargeData);
    } catch (error) { 
      notify(error.message || "Error loading admin data", "error"); 
    }
    setLoading(false);
  };

  const run = async (action, successMessage) => {
    try {
      await action();
      if (successMessage) notify(successMessage);
      await load();
    } catch (error) {
      notify(error.message || "Operation failed", "error");
    }
  };

  const approve = (student) => run(() => api.approveStudent(student.id), `${student.name} approved`);
  const reject = (student) => run(() => api.rejectStudent(student.id), `${student.name} rejected`);
  const changeLeave = (leave, status) => run(() => api.updateLeaveStatus(leave.id, status, user), `Leave request ${status.toLowerCase()}`);
  const resolveComplaint = (complaint) => run(() => api.updateComplaint(complaint.id, { ...complaint, status: "Resolved" }), "Complaint resolved");

  const saveNotice = (form) => run(() => api.upsertNotice(form, user), form.id ? "Notice updated" : "Notice created").then(() => setModal(null));
  const saveTask = (form) => run(() => api.upsertTask(form), form.id ? "Task updated" : "Task assigned").then(() => setModal(null));
  const saveSchedule = (form) => run(() => api.upsertMealSchedule(form), form.id ? "Meal schedule updated" : "Meal schedule created").then(() => setModal(null));
  const saveRoom = (form) => run(() => api.upsertRoom(form), form.id ? "Room updated" : "Room created").then(() => setModal(null));
  const savePayment = (form) => run(() => api.upsertPayment(form), "Payment record saved").then(() => setModal(null));
  const saveEmployee = (form) => run(() => api.upsertEmployee(form), form.id ? "Staff profile updated" : "Staff account created").then(() => setModal(null));
  const sendAdminNotification = (form) => run(() => api.sendNotification(form, user), "Notification dispatched").then(() => setModal(null));

  const exportReports = () => {
    if (!payments.length) return notify("No payment data to export", "error");
    api.exportCsv(`payment-report-${api.todayIso()}.csv`, payments);
    notify("Financial report exported");
  };

  useEffect(() => { load(); }, []);

  if (selectedStudent) {
    return (
      <>
        <StudentDetailsView student={selectedStudent} onBack={() => setSelectedStudent(null)} />
        <Toast toast={toast} />
      </>
    );
  }

  if (loading) return <LoadingState />;

  if (activePage === "students") {
    const pendingDischarges = dischargeRequests.filter(r => r.status === "Pending");

    return (
      <div className="space-y-6">
        <PageHeader 
          title="Student Directory & Admissions" 
          subtitle="Review applications, profiles, room assignments and outstanding dues" 
          actions={<Button variant="secondary" onClick={load}><RefreshCcw className="w-4 h-4" /> Refresh</Button>} 
        />

        {/* Discharge Requests Banner / Section */}
        {pendingDischarges.length > 0 && (
          <Card className="p-5 border-amber-300 bg-amber-50/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> Pending Hostel Discharge Requests ({pendingDischarges.length})
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">Students requesting clearance & room release from Green University Hostel</p>
              </div>
            </div>

            <div className="space-y-3">
              {pendingDischarges.map((req) => (
                <div key={req.id} className="p-4 bg-white rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs">
                  <div>
                    <p className="font-bold text-slate-800">{req.studentName} <span className="text-slate-400 font-normal">({req.studentId})</span></p>
                    <p className="text-slate-500 mt-0.5">Hostel {req.hostelBlock} • Room {req.roomNumber} • Effective Date: <span className="font-bold text-slate-700">{req.dischargeDate}</span></p>
                    <p className="text-slate-600 mt-1 italic">"{req.reason}"</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => confirmAction("Approve student discharge? This will deactivate the account and free up the room seat.") && run(() => api.updateDischargeRequestStatus(req.id, "Approved", "Discharge approved by Admin"), "Discharge approved")}
                    >
                      Approve Discharge
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => confirmAction("Reject discharge request?") && run(() => api.updateDischargeRequestStatus(req.id, "Rejected", "Discharge rejected by Admin"), "Discharge request rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <TextInput className="pl-10" placeholder="Search by student name, ID, block or room number..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </Card>
        <Card className="overflow-hidden">
          <DataTable 
            headers={["Student", "Block & Room", "Status", "Total Dues", "Actions"]} 
            rows={filteredStudents.map((s) => { 
              const due = payments.filter((p) => p.studentId === s.studentId).reduce((sum, p) => sum + (p.balance || 0), 0); 
              return [
                <div key="st" className="flex items-center gap-3">
                  <img src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.studentId}`} alt={s.name} className="w-9 h-9 rounded-full object-cover border" />
                  <div>
                    <p className="font-bold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.studentId}</p>
                  </div>
                </div>, 
                `${s.hostelBlock || "Hostel A"} - ${s.roomNumber || "N/A"}`, 
                <StatusBadge key="sb" tone={s.isApproved && s.isActive ? "green" : "orange"}>{s.isApproved && s.isActive ? "Approved & Active" : !s.isActive ? "Discharged / Inactive" : "Pending Admission"}</StatusBadge>, 
                `৳${due.toLocaleString()}`, 
                <div key="act" className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setSelectedStudent(s)}><Eye className="w-3.5 h-3.5" /> Details</Button>
                  {!s.isApproved && <Button onClick={() => approve(s)}>Approve</Button>}
                </div>
              ]; 
            })} 
          />
        </Card>
        <Toast toast={toast} />
      </div>
    );
  }

  if (activePage === "rooms") {
    return (
      <div className="space-y-6">
        <PageHeader title="Room Management" subtitle="Blocks, rooms, capacity and occupancy" actions={<Button onClick={() => setModal({ type: "room", data: blankRoom })}><Plus className="w-4 h-4" /> Add Room</Button>} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rooms && rooms.length ? rooms.map((room) => (
            <Card key={room.id} className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-gray-800">{room.block} - Room {room.roomNo}</h3>
                  <p className="text-xs text-gray-500 mt-1">Floor {room.floor || "1"} • {room.occupied}/{room.capacity} beds occupied</p>
                </div>
                <StatusBadge tone={room.status === "Available" ? "green" : "orange"}>{room.status}</StatusBadge>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setModal({ type: "room", data: room })}><Edit className="w-3.5 h-3.5" /> Edit</Button>
                <Button variant="danger" onClick={() => confirmAction("Delete room?") && run(() => api.deleteRoom(room.id), "Room deleted")}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </Card>
          )) : (
            <Card><EmptyState icon={<Home />} title="No rooms configured" /></Card>
          )}
        </div>
        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  if (activePage === "meals") {
    const currentMonthStr = api.todayIso().slice(0, 7);
    const currentMonthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
      <div className="space-y-6">
        <PageHeader title="Meal Schedules & Pricing" subtitle="Configure weekly menus, timing and prices" actions={<Button onClick={() => setModal({ type: "schedule", data: blankSchedule })}><Plus className="w-4 h-4" /> Add Schedule</Button>} />
        
        {/* Student Monthly Meal Count Overview Card for Admin */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-sm">
                <Utensils className="w-4 h-4 text-emerald-600" />
                Student Monthly Meal Count ({currentMonthName})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time active meal count per student for the current month. Resets automatically every calendar month.
              </p>
            </div>
            <StatusBadge tone="green">Monthly Auto-Reset</StatusBadge>
          </div>
          <DataTable 
            headers={["Student Name", "Student ID", "Hostel Block & Room", "Breakfasts", "Lunches", "Dinners", "Total Monthly Meals"]} 
            rows={(students || []).map((s) => {
              const sMeals = (meals || []).filter((m) => m.studentId === s.studentId && m.date && m.date.startsWith(currentMonthStr) && m.status !== "Cancelled");
              const bf = sMeals.filter((m) => m.type === "Breakfast").length;
              const lunch = sMeals.filter((m) => m.type === "Lunch").length;
              const dinner = sMeals.filter((m) => m.type === "Dinner").length;
              const total = sMeals.length;

              return [
                <div key="name" className="flex items-center gap-2">
                  <img src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.studentId}`} alt={s.name} className="w-7 h-7 rounded-full object-cover border" />
                  <span className="font-bold text-slate-800">{s.name}</span>
                </div>,
                <span key="id" className="font-mono text-xs text-slate-600">{s.studentId}</span>,
                <span key="room" className="text-xs text-slate-600">{s.hostelBlock || "Hostel A"} - Room {s.roomNumber || "N/A"}</span>,
                <span key="bf" className="font-semibold text-amber-700">{bf}</span>,
                <span key="lunch" className="font-semibold text-orange-700">{lunch}</span>,
                <span key="dinner" className="font-semibold text-indigo-700">{dinner}</span>,
                <span key="tot" className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {total} Meals
                </span>
              ];
            })}
          />
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-extrabold text-slate-800 text-sm">Weekly Master Schedule & Menus</h3>
          </div>
          <DataTable 
            headers={["Day", "Meal", "Menu", "Price", "Start Time", "Status", "Actions"]} 
            rows={schedules.map((m) => [
              m.dayOfWeek, 
              m.mealType, 
              <span key="menu" className="text-xs font-medium text-gray-700">{m.menu}</span>, 
              `৳${m.price}`, 
              m.startTime, 
              <StatusBadge key="sb" tone={m.isAvailable ? "green" : "red"}>{m.isAvailable ? "Available" : "Disabled"}</StatusBadge>, 
              <div key="act" className="flex gap-2">
                <Button variant="secondary" onClick={() => setModal({ type: "schedule", data: m })}><Edit className="w-3.5 h-3.5" /> Update</Button>
                <Button variant="danger" onClick={() => confirmAction("Delete meal schedule?") && run(() => api.deleteMealSchedule(m.id), "Schedule deleted")}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ])} 
          />
        </Card>
        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  if (activePage === "staff") {
    const filteredEmployees = employees.filter((e) => {
      const matchSearch = !staffSearch || 
        e.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
        (e.uid && e.uid.toLowerCase().includes(staffSearch.toLowerCase())) ||
        (e.username && e.username.toLowerCase().includes(staffSearch.toLowerCase())) ||
        (e.employeeId && e.employeeId.toLowerCase().includes(staffSearch.toLowerCase()));
      const matchBlock = staffBlockFilter === "ALL" || e.hostelBlock === staffBlockFilter || e.hostel_block === staffBlockFilter;
      return matchSearch && matchBlock;
    });

    return (
      <div className="space-y-6">
        <PageHeader 
          title="Staff Management & Task Assignments" 
          subtitle="Configure employee profiles, unique UIDs, assigned hostel blocks, & task boards" 
          actions={
            <div className="flex gap-2">
              <Button onClick={() => setModal({ type: "employee", data: blankEmployee })}>
                <Plus className="w-4 h-4" /> Add Staff Account
              </Button>
              <Button variant="secondary" onClick={() => setModal({ type: "task", data: blankTask })}>
                <ClipboardList className="w-4 h-4" /> Assign Task
              </Button>
            </div>
          } 
        />

        {/* Staff Filter */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <TextInput className="pl-9" placeholder="Search staff name or UID..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} />
            </div>
            <SelectInput value={staffBlockFilter} onChange={(e) => setStaffBlockFilter(e.target.value)}>
              <option value="ALL">All Hostel Blocks</option>
              <option value="Hostel A">Hostel A</option>
              <option value="Hostel A-nx">Hostel A-nx</option>
              <option value="Hostel B">Hostel B</option>
              <option value="Hostel C">Hostel C</option>
              <option value="Central Operations">Central Operations</option>
            </SelectInput>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <div className="p-5 border-b font-bold text-gray-800 flex items-center justify-between">
              <span>Staff Directory ({filteredEmployees.length})</span>
            </div>
            <DataTable 
              headers={["Staff Member", "Assigned Block", "Status", "Actions"]} 
              rows={filteredEmployees.map((e) => [
                <div key="1">
                  <p className="font-bold text-gray-800 text-xs">{e.name}</p>
                  <p className="text-[11px] text-gray-500">UID: {e.uid || e.username || e.employeeId || e.studentId || e.id} • {e.designation}</p>
                </div>, 
                <span key="2" className="font-semibold text-gray-700 text-xs">{e.hostelBlock || e.hostel_block || "Hostel A"}</span>, 
                <StatusBadge key="sb" tone={e.isActive ? "green" : "red"}>{e.isActive ? "Active" : "Inactive"}</StatusBadge>, 
                <div key="act" className="flex gap-1.5 flex-wrap">
                  <Button size="sm" variant="secondary" onClick={() => setModal({ type: "employeeDetails", data: e })}>
                    <Eye className="w-3.5 h-3.5" /> Details
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setModal({ type: "employee", data: e })}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={e.isActive ? "warning" : "success"}
                    onClick={() => run(() => api.upsertEmployee({ ...e, isActive: !e.isActive }), `Staff account ${e.isActive ? "deactivated" : "activated"}`)}
                  >
                    {e.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              ])} 
            />
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5 border-b font-bold text-gray-800 flex items-center justify-between">
              <span>Assigned Duty Tasks</span>
              <Button size="sm" variant="secondary" onClick={() => setModal({ type: "task", data: blankTask })}><Plus className="w-3.5 h-3.5" /> Assign</Button>
            </div>
            <DataTable 
              headers={["Task Title", "Priority", "Status", "Actions"]} 
              rows={tasks.map((t) => [
                <div key="t font">
                  <p className="font-bold text-gray-800 text-xs">{t.title}</p>
                  <p className="text-[11px] text-gray-500">{t.location || "Hostel Area"}</p>
                </div>, 
                t.priority, 
                <StatusBadge key="sb" tone={t.status === "Completed" ? "green" : t.status === "In Progress" ? "blue" : "orange"}>{t.status}</StatusBadge>, 
                <div key="act" className="flex gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setModal({ type: "task", data: t })}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="danger" onClick={() => confirmAction("Delete task?") && run(() => api.deleteTask(t.id), "Task deleted")}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ])} 
            />
          </Card>
        </div>
        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  if (activePage === "reports") {
    // Generate financial statements for all approved students
    const allStatements = (students || []).filter(s => s.isApproved).flatMap((student) => {
      const snap = buildFinancialSnapshot({
        studentId: student.studentId,
        student,
        meals: (meals || []).filter(m => m.studentId === student.studentId),
        leaveRequests: (leaves || []).filter(l => l.studentId === student.studentId),
        payments: (payments || []).filter(p => p.studentId === student.studentId)
      });
      return snap.statements.map(stmt => ({
        ...stmt,
        studentName: student.name,
        studentId: student.studentId,
        department: student.department,
        hostelBlock: student.hostelBlock,
        roomNo: student.roomNumber,
        student
      }));
    });

    const filteredStatements = allStatements.filter((s) => {
      const matchSearch = !search || s.studentName.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase());
      const matchStatus = historyFilter === "ALL" || s.status === historyFilter;
      return matchSearch && matchStatus;
    });

    const totalBillSum = allStatements.reduce((acc, s) => acc + (s.totalBill || 0), 0);
    const totalPaidSum = allStatements.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
    const totalDueSum = allStatements.reduce((acc, s) => acc + (s.remainingDue || 0), 0);

    return (
      <div className="space-y-6">
        <PageHeader 
          title="Finance & Monthly ERP Billing" 
          subtitle="Real-time monthly billing engine, payment confirmations, receipts and reports" 
          actions={
            <div className="flex gap-2">
              <Button onClick={() => setModal({ type: "payment", data: blankPayment })}>
                <Plus className="w-4 h-4" /> Record Payment
              </Button>
              <Button variant="dark" onClick={exportReports}>
                <Download className="w-4 h-4" /> Export CSV Report
              </Button>
            </div>
          } 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Billing Generated" value={`৳${totalBillSum.toLocaleString()}`} icon={<FileText />} tone="blue" />
          <StatCard title="Total Revenue Collected" value={`৳${totalPaidSum.toLocaleString()}`} icon={<DollarSign />} tone="green" />
          <StatCard title="Total Balance Due" value={`৳${totalDueSum.toLocaleString()}`} icon={<AlertCircle />} tone="red" />
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <TextInput className="pl-9" placeholder="Search student name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <SelectInput value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}>
              <option value="ALL">All Payment Statuses</option>
              <option value="Pending">Pending Dues Only</option>
              <option value="Partial">Partial Payments</option>
              <option value="Paid">Fully Paid</option>
            </SelectInput>
            <Button variant="secondary" onClick={() => { setSearch(""); setHistoryFilter("ALL"); }}>
              <RefreshCcw className="w-3.5 h-3.5" /> Reset Filters
            </Button>
          </div>
        </Card>

        {/* Statements Table */}
        <Card className="overflow-hidden">
          <DataTable 
            headers={["Student", "Billing Month", "Seat Rent", "Meal Charges", "Total Bill", "Paid", "Balance Due", "Status", "Actions"]} 
            rows={filteredStatements.map((s) => [
              <div key="st font">
                <p className="font-extrabold text-gray-800">{s.studentName}</p>
                <p className="text-[11px] text-gray-500">{s.studentId} • Room {s.roomNo || "N/A"}</p>
              </div>, 
              <span key="m" className="font-semibold text-gray-700">{s.month}</span>, 
              `৳${(s.seatRent || 4500).toLocaleString()}`, 
              `৳${(s.mealCharges || 0).toLocaleString()}`, 
              <span key="tb" className="font-extrabold text-gray-900">৳${(s.totalBill || 0).toLocaleString()}</span>, 
              <span key="pa" className="font-bold text-emerald-700">৳${(s.paidAmount || 0).toLocaleString()}</span>, 
              <span key="bd" className={`font-extrabold ${s.remainingDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                ৳${(s.remainingDue || 0).toLocaleString()}
              </span>, 
              <StatusBadge key="sb" tone={s.status === "Paid" ? "green" : s.status === "Partial" ? "orange" : "red"}>{s.status}</StatusBadge>, 
              <div key="act" className="flex items-center gap-2">
                <Button variant="secondary" className="text-xs" onClick={() => setModal({ type: "payment", data: { studentId: s.studentId, billingPeriod: s.month, totalBill: s.totalBill, paidAmount: s.remainingDue > 0 ? s.remainingDue : s.totalBill, invoiceDate: api.todayIso() } })}>
                  Mark Paid
                </Button>
                {(s.status === "Paid" || (s.paidAmount || 0) > 0) && (
                  <Button variant="secondary" className="text-xs" onClick={() => setModal({ type: "receipt", data: s })}>
                    <Download className="w-3.5 h-3.5" /> Receipt
                  </Button>
                )}
              </div>
            ])} 
          />
        </Card>

        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  if (activePage === "notices") {
    return (
      <div className="space-y-6">
        <PageHeader title="Notices & Announcements" subtitle="Manage hostel notices" actions={<Button onClick={() => setModal({ type: "notice", data: blankNotice })}><Plus className="w-4 h-4" /> Create Notice</Button>} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((n) => (
            <Card key={n.id} className="p-5">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-extrabold text-gray-800">{n.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{n.targetAudience} • {api.formatDateTime(n.createdAt)}</p>
                </div>
                <StatusBadge tone={n.isActive ? "green" : "gray"}>{n.isActive ? "Active" : "Hidden"}</StatusBadge>
              </div>
              <p className="text-sm text-gray-600 mt-3 line-clamp-3 leading-relaxed">{n.content}</p>
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setModal({ type: "notice", data: n })}><Edit className="w-3.5 h-3.5" /> Edit</Button>
                <Button variant="secondary" onClick={() => run(() => api.upsertNotice({ ...n, isActive: !n.isActive }, user), n.isActive ? "Notice hidden" : "Notice published")}>{n.isActive ? "Hide" : "Publish"}</Button>
                <Button variant="danger" onClick={() => run(() => api.deleteNotice(n.id), "Notice deleted")}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </Card>
          ))}
        </div>
        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  if (activePage === "leaves") {
    const filteredLeaves = leaves.filter((l) => {
      const matchSearch = !search || 
        (l.studentName && l.studentName.toLowerCase().includes(search.toLowerCase())) || 
        (l.studentId && l.studentId.toLowerCase().includes(search.toLowerCase())) ||
        (l.reason && l.reason.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = leaveStatusFilter === "ALL" || l.status === leaveStatusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="space-y-6">
        <PageHeader 
          title="Student Leave Applications" 
          subtitle="Review, approve or reject hostel exit leave requests from students" 
          actions={
            <Button variant="secondary" onClick={load}>
              <RefreshCcw className="w-4 h-4" /> Refresh
            </Button>
          } 
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <TextInput className="pl-9" placeholder="Search student name, ID or leave reason..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <SelectInput value={leaveStatusFilter} onChange={(e) => setLeaveStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending Only</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </SelectInput>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <DataTable 
            headers={["Student", "Dates", "Reason", "Status", "Reviewed By", "Actions"]} 
            rows={filteredLeaves.map((l) => [
              <div key="st font">
                <p className="font-extrabold text-gray-800">{l.studentName || "Student"}</p>
                <p className="text-[11px] text-gray-500">{l.studentId || "N/A"}</p>
              </div>, 
              <span key="dt" className="font-semibold text-gray-700">{l.startDate} to {l.endDate}</span>, 
              <span key="re" className="text-xs text-gray-600 max-w-xs block" title={l.reason}>{l.reason}</span>, 
              <StatusBadge key="sb" tone={l.status === "Approved" ? "green" : l.status === "Pending" ? "orange" : "red"}>{l.status}</StatusBadge>, 
              <span key="rb" className="text-xs text-gray-500">{l.reviewedBy ? `${l.reviewedBy} (${api.formatDateTime(l.reviewedAt)})` : "N/A"}</span>, 
              <div key="act" className="flex items-center gap-1.5">
                {l.status === "Pending" ? (
                  <>
                    <Button size="sm" onClick={() => run(() => api.updateLeaveStatus(l.id, "Approved", user), `Leave request approved for ${l.studentName || "Student"}`)}>
                      <Check className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => run(() => api.updateLeaveStatus(l.id, "Rejected", user), "Leave request rejected")}>
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => run(() => api.updateLeaveStatus(l.id, "Pending", user), "Status reset")}>
                    Reset
                  </Button>
                )}
              </div>
            ])} 
          />
        </Card>

        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  if (activePage === "complaints") {
    const filteredComplaints = complaints.filter((c) => {
      const matchSearch = !search || 
        (c.studentName && c.studentName.toLowerCase().includes(search.toLowerCase())) || 
        (c.studentId && c.studentId.toLowerCase().includes(search.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
        (c.type && c.type.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = complaintStatusFilter === "ALL" || c.status === complaintStatusFilter;
      const matchPriority = complaintPriorityFilter === "ALL" || c.priority === complaintPriorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });

    return (
      <div className="space-y-6">
        <PageHeader 
          title="Student Complaints & Support Tickets" 
          subtitle="Track, assign staff, and resolve student service complaints" 
          actions={
            <Button variant="secondary" onClick={load}>
              <RefreshCcw className="w-4 h-4" /> Refresh
            </Button>
          } 
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <TextInput className="pl-9" placeholder="Search complaint description or student..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <SelectInput value={complaintStatusFilter} onChange={(e) => setComplaintStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </SelectInput>
            <SelectInput value={complaintPriorityFilter} onChange={(e) => setComplaintPriorityFilter(e.target.value)}>
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </SelectInput>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <DataTable 
            headers={["Student", "Type", "Priority", "Target", "Description", "Status", "Assigned / Note", "Actions"]} 
            rows={filteredComplaints.map((c) => [
              <div key="st font">
                <p className="font-extrabold text-gray-800">{c.studentName || "Student"}</p>
                <p className="text-[11px] text-gray-500">{c.studentId || "N/A"}</p>
              </div>, 
              <span key="tp" className="font-semibold text-gray-700 text-xs">{c.type}</span>, 
              <StatusBadge key="pb" tone={c.priority === "Urgent" ? "red" : c.priority === "High" ? "orange" : "blue"}>{c.priority}</StatusBadge>, 
              <span key="tr" className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{c.targetRecipient || "BOTH"}</span>, 
              <span key="desc" className="text-xs text-gray-600 max-w-xs block" title={c.description}>{c.description}</span>, 
              <StatusBadge key="sb" tone={c.status === "Resolved" ? "green" : c.status === "In Progress" ? "blue" : c.status === "Rejected" ? "red" : "orange"}>{c.status}</StatusBadge>, 
              <div key="an" className="text-xs text-gray-500 space-y-0.5">
                {c.assignedTo && <p className="font-semibold text-slate-700">Assigned: {c.assignedTo}</p>}
                {c.resolutionNote ? <p className="italic">{c.resolutionNote}</p> : <p className="text-slate-400">No response note</p>}
              </div>, 
              <div key="act" className="flex items-center gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => setModal({ type: "resolveComplaint", data: c })}>
                  <Edit className="w-3.5 h-3.5" /> Resolve / Respond
                </Button>
              </div>
            ])} 
          />
        </Card>

        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="space-y-8 animate-fade-in font-sans max-w-5xl mx-auto py-2">
      {/* Main Clean & Smart Admin Welcome Hero */}
      <div className="relative bg-gradient-to-br from-[#130722] via-[#24113f] to-[#0c0317] text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-900/40 overflow-hidden">
        {/* Subtle Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shadow-xs shadow-purple-400" />
              <span className="text-xs font-semibold tracking-wider text-purple-300 uppercase">
                Green University Hostel ERP • Executive Portal
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md text-purple-200 text-xs px-4 py-1.5 rounded-full border border-white/15 font-medium">
              Administrator Panel
            </div>
          </div>

          {/* Main Welcome Headline */}
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back, <br className="hidden md:block" />
              <span className="text-purple-300">{user?.name || "Administrator"}</span> 🎓
            </h1>
            <p className="text-slate-200 text-sm md:text-base mt-4 max-w-2xl font-normal leading-relaxed">
              Hostel administrative system operations are active and running smoothly. Manage student admissions, room allocations, leave authorizations, complaints, meal routines, staff task assignments, and financial reports directly from the sidebar navigation.
            </p>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-10 pt-8 border-t border-white/10">
            <button
              type="button"
              onClick={() => onNavigate("students")}
              className="group p-3 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-left flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">Students</h3>
                <p className="text-[10px] text-slate-300">Admissions</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("leaves")}
              className="group p-3 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-left flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">Leaves</h3>
                <p className="text-[10px] text-slate-300">{pendingLeaves.length} Pending</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("complaints")}
              className="group p-3 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-left flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform flex-shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">Complaints</h3>
                <p className="text-[10px] text-slate-300">{openComplaints.length} Open</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("rooms")}
              className="group p-3 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-left flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform flex-shrink-0">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">Rooms</h3>
                <p className="text-[10px] text-slate-300">Blocks & beds</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("meals")}
              className="group p-3 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-left flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform flex-shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">Meals</h3>
                <p className="text-[10px] text-slate-300">Schedules</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("reports")}
              className="group p-3 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-left flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform flex-shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">Finance</h3>
                <p className="text-[10px] text-slate-300">Billing</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Student Leave Requests Banner */}
      {pendingLeaves.length > 0 && (
        <Card className="p-5 border-blue-300 bg-blue-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-blue-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Pending Student Leave Requests ({pendingLeaves.length})
              </h3>
              <p className="text-xs text-blue-700 mt-0.5">Students requesting hostel exit leave authorization</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onNavigate("leaves")}>
              View All Leaves
            </Button>
          </div>

          <div className="space-y-3">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="p-4 bg-white rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs">
                <div>
                  <p className="font-bold text-slate-800">{leave.studentName || "Student"} <span className="text-slate-400 font-normal">({leave.studentId})</span></p>
                  <p className="text-slate-500 mt-0.5">Dates: <span className="font-bold text-slate-700">{leave.startDate} to {leave.endDate}</span></p>
                  <p className="text-slate-600 mt-1 italic">"{leave.reason}"</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => run(() => api.updateLeaveStatus(leave.id, "Approved", user), `Leave request approved for ${leave.studentName || "Student"}`)}
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => run(() => api.updateLeaveStatus(leave.id, "Rejected", user), "Leave request rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Open Student Complaints Banner */}
      {openComplaints.length > 0 && (
        <Card className="p-5 border-rose-300 bg-rose-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-rose-900 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Open Student Complaints ({openComplaints.length})
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">Service issues and maintenance tickets requiring administrative resolution</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onNavigate("complaints")}>
              View All Complaints
            </Button>
          </div>

          <div className="space-y-3">
            {openComplaints.slice(0, 5).map((comp) => (
              <div key={comp.id} className="p-4 bg-white rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800">{comp.studentName || "Student"} <span className="text-slate-400 font-normal">({comp.studentId})</span></p>
                    <StatusBadge tone={comp.priority === "Urgent" ? "red" : comp.priority === "High" ? "orange" : "blue"}>{comp.priority}</StatusBadge>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">{comp.type}</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-semibold">To: {comp.targetRecipient || "BOTH"}</span>
                  </div>
                  <p className="text-slate-600 italic">"{comp.description}"</p>
                  <p className="text-[10px] text-slate-400">Logged on {comp.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => setModal({ type: "resolveComplaint", data: comp })}
                  >
                    Resolve / Respond
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {renderModal()}
      <Toast toast={toast} />
    </div>
  );

  function renderModal() {
    if (!modal) return null;
    const data = modal.data;
    if (modal.type === "notice") return <NoticeForm initial={data} onClose={() => setModal(null)} onSave={saveNotice} />;
    if (modal.type === "task") return <TaskForm initial={data} employees={employees} onClose={() => setModal(null)} onSave={saveTask} />;
    if (modal.type === "schedule") return <MealForm initial={data} onClose={() => setModal(null)} onSave={saveSchedule} />;
    if (modal.type === "room") return <RoomForm initial={data} onClose={() => setModal(null)} onSave={saveRoom} />;
    if (modal.type === "payment") return <PaymentForm initial={data} onClose={() => setModal(null)} onSave={savePayment} />;
    if (modal.type === "employee") return <EmployeeForm initial={data} onClose={() => setModal(null)} onSave={saveEmployee} />;
    if (modal.type === "employeeDetails") return (
      <EmployeeDetailsModal 
        employee={data} 
        tasks={tasks} 
        onClose={() => setModal(null)} 
        onEdit={(emp) => setModal({ type: "employee", data: emp })} 
        onToggleActive={(emp) => {
          run(() => api.upsertEmployee({ ...emp, isActive: !emp.isActive }), `Staff account ${emp.isActive ? "deactivated" : "activated"}`);
          setModal(null);
        }}
        onDelete={(empId) => {
          if (confirmAction("Are you sure you want to delete this staff account?")) {
            run(() => api.deleteEmployee(empId), "Staff account deleted");
            setModal(null);
          }
        }}
        onAssignTask={(emp) => setModal({ type: "task", data: { ...blankTask, staffId: emp.id, location: emp.hostelBlock } })}
      />
    );
    if (modal.type === "receipt") return <ReceiptModal receipt={data} student={data.student || { name: data.studentName, studentId: data.studentId, department: data.department, hostelBlock: data.hostelBlock, roomNumber: data.roomNo }} onClose={() => setModal(null)} />;
    if (modal.type === "notification") return <NotificationForm initial={data} onClose={() => setModal(null)} onSave={sendAdminNotification} />;
    if (modal.type === "resolveComplaint") return (
      <ResolveComplaintModal 
        complaint={data} 
        onClose={() => setModal(null)} 
        onSave={(updated) => {
          run(() => api.updateComplaint(updated.id, updated, user), "Complaint status updated and student notified");
          setModal(null);
        }} 
      />
    );
    return null;
  }
};

const DataTable = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-[10px] uppercase tracking-widest text-gray-500 bg-gray-50">
        <tr>{headers.map((h) => <th key={h} className="px-5 py-3 font-extrabold">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows && rows.length ? rows.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {row.map((cell, j) => <td key={j} className="px-5 py-3 align-middle">{cell}</td>)}
          </tr>
        )) : (
          <tr><td colSpan={headers.length}><EmptyState icon={<FileText />} /></td></tr>
        )}
      </tbody>
    </table>
  </div>
);

const NoticeForm = ({ initial, onClose, onSave }) => { 
  const [form, setForm] = useState(initial); 
  return (
    <Modal title={form.id ? "Edit Notice" : "Create Notice"} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Save Notice</Button></>}>
      <FormGrid>
        <Field label="Title"><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        <Field label="Target Audience">
          <SelectInput value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
            <option value="ALL">Everyone</option>
            <option value="STUDENT">Students</option>
            <option value="EMPLOYEE">Employees</option>
            <option value="ADMIN">Admins</option>
          </SelectInput>
        </Field>
        <Field label="Content"><TextArea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></Field>
      </FormGrid>
    </Modal>
  ); 
};

const TaskForm = ({ initial, employees, onClose, onSave }) => { 
  const [form, setForm] = useState(initial); 
  return (
    <Modal title={form.id ? "Update Task" : "Assign Staff Task"} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Save Task</Button></>}>
      <FormGrid>
        <Field label="Task Title"><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        <Field label="Assign To Employee">
          <SelectInput value={form.staffId || ""} onChange={(e) => setForm({ ...form, staffId: e.target.value })}>
            <option value="">Unassigned / All Staff</option>
            {employees && employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>)}
          </SelectInput>
        </Field>
        <Field label="Priority">
          <SelectInput value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </SelectInput>
        </Field>
        <Field label="Status">
          <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </SelectInput>
        </Field>
        <Field label="Location"><TextInput value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Block A 2nd Floor" /></Field>
        <Field label="Description"><TextArea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </FormGrid>
    </Modal>
  ); 
};

const MealForm = ({ initial, onClose, onSave }) => { 
  const [form, setForm] = useState(initial); 
  return (
    <Modal title={form.id ? "Update Meal Schedule" : "Add Meal Schedule"} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Save Meal</Button></>}>
      <FormGrid>
        <Field label="Day of Week">
          <SelectInput value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
            {["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"].map((d) => <option key={d} value={d}>{d}</option>)}
          </SelectInput>
        </Field>
        <Field label="Meal Type">
          <SelectInput value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })}>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
          </SelectInput>
        </Field>
        <Field label="Price (৳)"><TextInput type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></Field>
        <Field label="Start Time"><TextInput type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></Field>
        <Field label="Menu Description"><TextArea rows={3} value={form.menu} onChange={(e) => setForm({ ...form, menu: e.target.value })} required /></Field>
        <Field label="Availability">
          <SelectInput value={form.isAvailable ? "true" : "false"} onChange={(e) => setForm({ ...form, isAvailable: e.target.value === "true" })}>
            <option value="true">Available</option>
            <option value="false">Disabled / Off</option>
          </SelectInput>
        </Field>
      </FormGrid>
    </Modal>
  ); 
};

const RoomForm = ({ initial, onClose, onSave }) => { 
  const [form, setForm] = useState(initial); 
  return (
    <Modal title={form.id ? "Edit Room Details" : "Add New Room"} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Save Room</Button></>}>
      <FormGrid>
        <Field label="Hostel Block"><TextInput value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} placeholder="Hostel A" required /></Field>
        <Field label="Room Number"><TextInput value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} placeholder="302" required /></Field>
        <Field label="Floor"><TextInput value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="3rd Floor" /></Field>
        <Field label="Total Capacity"><TextInput type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required /></Field>
        <Field label="Occupied Beds"><TextInput type="number" value={form.occupied} onChange={(e) => setForm({ ...form, occupied: e.target.value })} required /></Field>
        <Field label="Status">
          <SelectInput value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Available">Available</option>
            <option value="Full">Full</option>
            <option value="Maintenance">Maintenance</option>
          </SelectInput>
        </Field>
      </FormGrid>
    </Modal>
  ); 
};

const PaymentForm = ({ initial, onClose, onSave }) => { 
  const [form, setForm] = useState({
    studentId: initial?.studentId || "",
    billingPeriod: initial?.billingPeriod || "July 2026",
    invoiceDate: initial?.invoiceDate || api.todayIso(),
    totalBill: Number(initial?.totalBill || 0),
    paidAmount: Number(initial?.paidAmount !== undefined ? initial.paidAmount : initial?.totalBill || 0),
    paymentMethod: initial?.paymentMethod || "bKash / Mobile Banking",
    receiptNo: initial?.receiptNo || `RCP-${Date.now().toString().slice(-6)}`,
    confirmedBy: initial?.confirmedBy || "Accounts Admin",
    description: initial?.description || "Seat Rent (৳4,500) & Served Meal Charges"
  }); 

  return (
    <Modal title="Confirm Payment & Issue Official Receipt" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Confirm Payment & Save</Button></>}>
      <FormGrid>
        <Field label="Student ID"><TextInput value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required /></Field>
        <Field label="Billing Period"><TextInput value={form.billingPeriod} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })} placeholder="July 2026" required /></Field>
        <Field label="Payment Date"><TextInput type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} required /></Field>
        <Field label="Total Bill (৳)"><TextInput type="number" value={form.totalBill} onChange={(e) => setForm({ ...form, totalBill: Number(e.target.value) })} required /></Field>
        <Field label="Paid Amount (৳)"><TextInput type="number" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })} required /></Field>
        <Field label="Payment Method">
          <SelectInput value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            <option value="bKash / Mobile Banking">bKash / Mobile Banking</option>
            <option value="Bank Deposit / Portal">Bank Deposit / Portal</option>
            <option value="Cash at Accounts Office">Cash at Accounts Office</option>
          </SelectInput>
        </Field>
        <Field label="Receipt No."><TextInput value={form.receiptNo} onChange={(e) => setForm({ ...form, receiptNo: e.target.value })} required /></Field>
        <Field label="Confirmed By"><TextInput value={form.confirmedBy} onChange={(e) => setForm({ ...form, confirmedBy: e.target.value })} required /></Field>
        <Field label="Remarks / Description"><TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Payment confirmed by accounts" /></Field>
      </FormGrid>
    </Modal>
  ); 
};

const NotificationForm = ({ initial, onClose, onSave }) => { 
  const [form, setForm] = useState(initial); 
  return (
    <Modal title="Broadcast Notification" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Dispatch Alert</Button></>}>
      <FormGrid>
        <Field label="Title"><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
        <Field label="Target Audience">
          <SelectInput value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
            <option value="ALL_STUDENTS">All Students</option>
            <option value="INDIVIDUAL_STUDENT">Specific Student ID</option>
            <option value="EMPLOYEES">Employees & Staff</option>
            <option value="ADMINS">Admins Only</option>
            <option value="ALL">Everyone</option>
          </SelectInput>
        </Field>
        {form.targetAudience === "INDIVIDUAL_STUDENT" && (
          <Field label="Student ID"><TextInput value={form.receiverStudentId} onChange={(e) => setForm({ ...form, receiverStudentId: e.target.value })} placeholder="20210001" required /></Field>
        )}
        <Field label="Type">
          <SelectInput value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="Info">Info</option>
            <option value="Urgent">Urgent</option>
            <option value="Task">Task</option>
            <option value="Finance">Finance</option>
            <option value="Notice">Notice</option>
          </SelectInput>
        </Field>
        <Field label="Priority">
          <SelectInput value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </SelectInput>
        </Field>
        <Field label="Message"><TextArea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></Field>
      </FormGrid>
    </Modal>
  ); 
};

const EmployeeForm = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState(initial);
  return (
    <Modal 
      title={form.id ? "Edit Staff Profile & Permissions" : "Add New Staff Account"} 
      onClose={onClose} 
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            const uidVal = (form.uid || form.username || form.employeeId || "").trim();
            if (!uidVal) {
              alert("Please enter a UID for the staff account.");
              return;
            }
            onSave({
              ...form,
              uid: uidVal,
              employeeId: uidVal,
              username: uidVal,
              studentId: uidVal
            });
          }}>Save Staff Account</Button>
        </>
      }
    >
      <FormGrid>
        <Field label="UID (Unique Identifier / Username)">
          <TextInput 
            value={form.uid || form.username || form.employeeId || ""} 
            onChange={(e) => setForm({ 
              ...form, 
              uid: e.target.value, 
              username: e.target.value, 
              employeeId: e.target.value, 
              studentId: e.target.value 
            })} 
            placeholder="e.g. warden01, staff_a, monir" 
            required 
          />
        </Field>
        <Field label="Full Name">
          <TextInput 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            placeholder="Mohammad Rahman" 
            required 
          />
        </Field>
        <Field label="Designation / Role">
          <TextInput 
            value={form.designation} 
            onChange={(e) => setForm({ ...form, designation: e.target.value })} 
            placeholder="Hostel Warden / Block Supervisor" 
            required 
          />
        </Field>
        <Field label="Assigned Hostel Block">
          <SelectInput 
            value={form.hostelBlock || form.hostel_block || "Hostel A"} 
            onChange={(e) => setForm({ ...form, hostelBlock: e.target.value, hostel_block: e.target.value })}
          >
            <option value="Hostel A">Hostel A</option>
            <option value="Hostel A-nx">Hostel A-nx</option>
            <option value="Hostel B">Hostel B</option>
            <option value="Hostel C">Hostel C</option>
            <option value="Central Operations">Central Operations</option>
          </SelectInput>
        </Field>
        <Field label="Contact Phone">
          <TextInput 
            value={form.phone} 
            onChange={(e) => setForm({ ...form, phone: e.target.value })} 
            placeholder="01700000000" 
            required 
          />
        </Field>
        <Field label="Account Password (Min 6 chars)">
          <TextInput 
            type="password"
            value={form.password || ""} 
            onChange={(e) => setForm({ ...form, password: e.target.value })} 
            placeholder="Set secure password..." 
          />
        </Field>
        <Field label="Account Status">
          <SelectInput 
            value={form.isActive ? "true" : "false"} 
            onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })}
          >
            <option value="true">Active Account</option>
            <option value="false">Inactive / Suspended</option>
          </SelectInput>
        </Field>
      </FormGrid>
    </Modal>
  );
};

const FormGrid = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;

const EmployeeDetailsModal = ({ employee, tasks = [], onClose, onEdit, onToggleActive, onDelete, onAssignTask }) => {
  if (!employee) return null;
  const staffTasks = tasks.filter(
    (t) => t.staffId === employee.id || t.assignedTo === employee.name || (employee.hostelBlock && t.location === employee.hostelBlock)
  );

  return (
    <Modal
      title="Staff Member Profile & Full Details"
      onClose={onClose}
      footer={
        <div className="flex justify-between w-full items-center gap-2 flex-wrap">
          <Button variant="danger" size="sm" onClick={() => onDelete(employee.id)}>
            <Trash2 className="w-3.5 h-3.5" /> Delete Account
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="secondary" onClick={() => { onClose(); onEdit(employee); }}>
              <Edit className="w-3.5 h-3.5" /> Edit Profile
            </Button>
            <Button 
              variant={employee.isActive ? "warning" : "success"}
              onClick={() => { onToggleActive(employee); }}
            >
              {employee.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Profile Header */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <img 
            src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=059669&color=fff`} 
            alt={employee.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500/20"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg text-slate-800 truncate">{employee.name}</h3>
              <StatusBadge tone={employee.isActive ? "green" : "red"}>
                {employee.isActive ? "Active" : "Inactive"}
              </StatusBadge>
            </div>
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 inline-block px-2.5 py-0.5 rounded-md mt-1">
              {employee.designation || "Hostel Staff"}
            </p>
          </div>
        </div>

        {/* Detailed Grid Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200/80 text-xs">
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <p className="text-slate-400 font-medium text-[11px]">UID / Username</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{employee.uid || employee.username || employee.employeeId || employee.studentId || employee.id}</p>
          </div>
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <p className="text-slate-400 font-medium text-[11px]">Assigned Hostel Block</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{employee.hostelBlock || employee.hostel_block || "Hostel A"}</p>
          </div>
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <p className="text-slate-400 font-medium text-[11px]">Contact Phone</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{employee.phone || "N/A"}</p>
          </div>
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <p className="text-slate-400 font-medium text-[11px]">Email Address</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5 truncate">{employee.email || "N/A"}</p>
          </div>
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <p className="text-slate-400 font-medium text-[11px]">User Role</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{employee.role || "EMPLOYEE"}</p>
          </div>
          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <p className="text-slate-400 font-medium text-[11px]">Account Status</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{employee.isActive ? "Active (Can log in)" : "Deactivated"}</p>
          </div>
        </div>

        {/* Assigned Duty Tasks */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Assigned Duty Tasks ({staffTasks.length})</h4>
            <Button size="sm" variant="secondary" onClick={() => { onClose(); onAssignTask(employee); }}>
              <Plus className="w-3.5 h-3.5" /> Assign Task
            </Button>
          </div>
          {staffTasks.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {staffTasks.map((t, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{t.title}</p>
                    <p className="text-[11px] text-slate-500">{t.location || "Hostel Area"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-semibold">{t.priority}</span>
                    <StatusBadge tone={t.status === "Completed" ? "green" : t.status === "In Progress" ? "blue" : "amber"}>{t.status}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">No active duty tasks assigned to this staff member.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
