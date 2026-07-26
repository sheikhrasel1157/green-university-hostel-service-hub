import React, { useEffect, useState } from "react";
import { 
  AlertCircle, 
  Bell, 
  BellRing, 
  Check, 
  CheckCircle2, 
  ClipboardList, 
  Clock, 
  Edit, 
  Eye, 
  FileText, 
  Home, 
  LogIn, 
  LogOut, 
  MessageSquare, 
  Navigation, 
  Phone, 
  Plus, 
  RefreshCcw, 
  Search, 
  Send, 
  ShieldAlert, 
  Trash2, 
  UserCheck, 
  UserPlus, 
  Users, 
  Utensils 
} from "lucide-react";
import { 
  Button, 
  Card, 
  EmptyState, 
  Field, 
  LoadingState, 
  Modal, 
  PageHeader, 
  SelectInput, 
  StatCard, 
  StatusBadge, 
  TextArea, 
  TextInput, 
  Toast, 
  confirmAction 
} from "./ui";
import * as api from "../services/hostelService";

const blankVisitor = { visitorName: "", studentId: "", studentName: "", relation: "", fromLocation: "", purpose: "Visit" };
const blankMovement = { studentId: "", studentName: "", destination: "", purpose: "Home Visit" };
const blankStaffRequest = { title: "", description: "", priority: "Medium", location: "" };

export const EmployeeView = ({ activePage, onNavigate, user }) => {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [movements, setMovements] = useState([]);
  const [notices, setNotices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [blockStudents, setBlockStudents] = useState([]);
  const [mealSummary, setMealSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("all"); // 'all' | 'inside' | 'outside'
  const [opsFilter, setOpsFilter] = useState("all"); // 'all' | 'assigned' | 'requests'
  const [attendanceTab, setAttendanceTab] = useState("movement"); // 'movement' | 'visitors'
  const [modal, setModal] = useState(null); // { type: string, data?: any }

  const staffBlock = user?.hostelBlock || user?.hostel_block || "Hostel A";

  const notify = (message, type = "success") => { 
    setToast({ message, type }); 
    setTimeout(() => setToast(null), 3500); 
  };

  const load = async () => {
    setLoading(true);
    try {
      const [taskData, visitorData, movementData, noticeData, notificationData, summaryData, allStudents] = await Promise.all([
        api.listTasks(user?.id), 
        api.listVisitors(), 
        api.listMovements(), 
        api.listNotices("EMPLOYEE", true), 
        api.listNotificationsForUser(user), 
        api.mealSummaryForDate(),
        api.listStudents()
      ]);

      // Helper function for flexible hostel block matching
      const matchHostelBlock = (sBlockRaw, staffBlockRaw) => {
        if (!staffBlockRaw || staffBlockRaw === "All Blocks" || staffBlockRaw === "ALL") return true;
        if (!sBlockRaw) return false;

        const sBlock = String(sBlockRaw).trim().toLowerCase();
        const targetBlock = String(staffBlockRaw).trim().toLowerCase();

        if (sBlock === targetBlock) return true;

        const cleanS = sBlock.replace(/hostel|block|hall|\s|-|_/gi, "").trim();
        const cleanTarget = targetBlock.replace(/hostel|block|hall|\s|-|_/gi, "").trim();

        if (cleanS && cleanTarget && cleanS === cleanTarget) return true;
        return sBlock.includes(targetBlock) || targetBlock.includes(sBlock);
      };

      // Filter students by staff's assigned hostel block
      const filteredStudents = (allStudents || []).filter(s => {
        const sBlock = s.hostelBlock || s.hostel_block || "";
        return matchHostelBlock(sBlock, staffBlock);
      });

      const studentIdsInBlock = new Set();
      filteredStudents.forEach(s => {
        if (s.studentId) studentIdsInBlock.add(s.studentId);
        if (s.student_id) studentIdsInBlock.add(s.student_id);
      });

      const filteredMovements = (movementData || []).filter(m => 
        studentIdsInBlock.has(m.studentId) || !m.studentId
      );

      const filteredVisitors = (visitorData || []).filter(v => 
        studentIdsInBlock.has(v.studentId) || !v.studentId
      );

      setTasks(taskData); 
      setVisitors(filteredVisitors); 
      setMovements(filteredMovements); 
      setNotices(noticeData); 
      setNotifications(notificationData); 
      setMealSummary(summaryData);
      setBlockStudents(filteredStudents);
    } catch (error) { 
      notify(error.message || "Failed to load data", "error"); 
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id, staffBlock]);

  const run = async (fn, success) => { 
    try { 
      await fn(); 
      await load(); 
      if (success) notify(success); 
    } catch (error) { 
      notify(error.message || "Operation failed", "error"); 
    } 
  };

  const markBack = (movement) => run(() => api.upsertMovement({ ...movement, timeBack: api.nowIso() }), "Student return recorded");
  const checkOutVisitor = (visitor) => run(() => api.upsertVisitor({ ...visitor, timeOut: api.nowIso() }), "Visitor checked out");

  const handleStartTask = (task) => run(() => api.upsertTask({ ...task, status: "In Progress" }), "Task marked In Progress");

  const handleCompleteTaskSubmit = (task, feedbackText) => run(
    () => api.completeTaskWithFeedback(task, feedbackText, user),
    "Task completed and feedback sent to Admin"
  );

  const handleStaffRequestSubmit = (requestForm) => run(
    () => api.createStaffRequest(requestForm, user),
    "Staff request submitted to Admin"
  );

  if (loading) return <LoadingState label="Syncing staff operations desk..." />;

  // Computed metric stats for this hostel block
  const currentlyOutMovements = movements.filter(m => !m.timeBack);
  const currentlyOutStudentsCount = currentlyOutMovements.length;
  const visitorsInsideCount = visitors.filter(v => !v.timeOut).length;
  const pendingAssignedTasks = tasks.filter(t => !t.isStaffRequest && t.status !== "Completed");

  // Out Reasons Summary map
  const outReasonsMap = currentlyOutMovements.reduce((acc, m) => {
    const reason = (m.purpose || m.destination || "General").trim();
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  // Meal counts for staff's block residents
  const activeBlockStudents = blockStudents.filter(s => s.isActive !== false);
  const blockMealExpectedToday = {
    breakfast: activeBlockStudents.length,
    lunch: activeBlockStudents.length,
    dinner: activeBlockStudents.length,
    total: activeBlockStudents.length * 3
  };

  // =========================================================================
  // 1. OPERATIONS PAGE
  // =========================================================================
  if (activePage === "operations") {
    const assignedTasksList = tasks.filter(t => !t.isStaffRequest);
    const staffRequestsList = tasks.filter(t => t.isStaffRequest);

    const displayedTasks = opsFilter === "assigned" 
      ? assignedTasksList 
      : opsFilter === "requests" 
      ? staffRequestsList 
      : tasks;

    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto py-2">
        <PageHeader 
          title="Staff Operations & Task Desk" 
          subtitle={`Assigned Hostel: ${staffBlock} • Manage duty assignments & submit requests to admin`} 
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setModal({ type: "staffRequest", data: { ...blankStaffRequest, location: staffBlock } })}>
                <Plus className="w-4 h-4" /> Submit Request to Admin
              </Button>
              <Button variant="secondary" onClick={load}>
                <RefreshCcw className="w-4 h-4" /> Sync
              </Button>
            </div>
          } 
        />

        {/* Filter Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setOpsFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              opsFilter === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Operations ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setOpsFilter("assigned")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              opsFilter === "assigned" ? "bg-blue-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Admin Assigned Tasks ({assignedTasksList.length})
          </button>
          <button
            type="button"
            onClick={() => setOpsFilter("requests")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              opsFilter === "requests" ? "bg-purple-600 text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            My Admin Requests ({staffRequestsList.length})
          </button>
        </div>

        {/* Task Cards Grid */}
        <div className="space-y-4">
          {displayedTasks.length ? (
            displayedTasks.map((t) => {
              const isCompleted = t.status === "Completed";
              const isInProgress = t.status === "In Progress";

              return (
                <Card key={t.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={t.isStaffRequest ? "purple" : "blue"}>
                          {t.isStaffRequest ? "Staff Request" : "Admin Task"}
                        </StatusBadge>
                        <StatusBadge tone={t.priority === "Urgent" || t.priority === "High" ? "red" : "gray"}>
                          {t.priority} Priority
                        </StatusBadge>
                        <StatusBadge tone={isCompleted ? "green" : isInProgress ? "orange" : "blue"}>
                          {t.status}
                        </StatusBadge>
                      </div>

                      <h3 className="font-extrabold text-slate-800 text-base">{t.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                        <span>Location: <strong className="text-slate-600">{t.location || staffBlock}</strong></span>
                        {t.dueDate && <span>Due: <strong className="text-slate-600">{t.dueDate}</strong></span>}
                        {t.assignedAt && <span>Logged: <strong className="text-slate-600">{t.assignedAt}</strong></span>}
                      </div>

                      {/* Feedback Note if completed */}
                      {t.feedback && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200/70 rounded-xl text-xs text-emerald-900">
                          <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Staff Completion Feedback:
                          </p>
                          <p className="mt-1 font-normal italic">"{t.feedback}"</p>
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    {!t.isStaffRequest && (
                      <div className="flex flex-wrap items-center gap-2 md:self-center">
                        {!isCompleted && !isInProgress && (
                          <Button size="sm" variant="secondary" onClick={() => handleStartTask(t)}>
                            Start Task
                          </Button>
                        )}
                        {!isCompleted && (
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => setModal({ type: "completeTask", data: t })}
                          >
                            <Check className="w-4 h-4" /> Yes, Complete Task
                          </Button>
                        )}
                        {isCompleted && (
                          <StatusBadge tone="green">
                            ✓ Done
                          </StatusBadge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <Card>
              <EmptyState 
                icon={<CheckCircle2 className="w-10 h-10" />} 
                title="No operations or tasks found" 
                subtitle="Tasks assigned by admin or submitted staff requests will appear here."
              />
            </Card>
          )}
        </div>

        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  // =========================================================================
  // 2. VISITOR & EXIT DESK PAGE (`attendance`)
  // =========================================================================
  if (activePage === "attendance") {
    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto py-2">
        <PageHeader 
          title="Visitor & Student Movement Desk" 
          subtitle={`Managing ${staffBlock} • Resident exit logs & visitor gate entries`} 
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setModal({ type: "visitor", data: blankVisitor })}>
                <UserPlus className="w-4 h-4" /> Log Visitor
              </Button>
              <Button variant="warning" onClick={() => setModal({ type: "movement", data: blankMovement })}>
                <Navigation className="w-4 h-4" /> Log Exit
              </Button>
              <Button variant="secondary" onClick={load}>
                <RefreshCcw className="w-4 h-4" /> Sync
              </Button>
            </div>
          } 
        />

        {/* Sub-Tabs */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap border border-slate-200">
          <button 
            type="button" 
            onClick={() => setAttendanceTab("movement")} 
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${attendanceTab === "movement" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Navigation className="w-4 h-4" /> Student Exit & Return Logs ({currentlyOutStudentsCount} Outside)
          </button>
          <button 
            type="button" 
            onClick={() => setAttendanceTab("visitors")} 
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${attendanceTab === "visitors" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Users className="w-4 h-4" /> Visitor Log Register ({visitorsInsideCount} Inside)
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input 
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600"
            placeholder="Search records by Student ID or Visitor Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {attendanceTab === "movement" && (
          <Card className="overflow-hidden">
            <DataTable 
              headers={["Student Details", "Destination & Purpose", "Time Exit", "Return Status", "Actions"]} 
              rows={movements
                .filter(m => !searchQuery || m.studentId.includes(searchQuery) || (m.studentName && m.studentName.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((m) => [
                <div key="1">
                  <p className="font-bold text-slate-800 text-xs">{m.studentId}</p>
                  <p className="text-[11px] text-slate-500">{m.studentName || "Resident Student"}</p>
                </div>, 
                <div key="2">
                  <p className="font-semibold text-slate-700 text-xs">{m.destination}</p>
                  <p className="text-[11px] text-slate-400">{m.purpose || "General"}</p>
                </div>, 
                api.formatDateTime(m.timeOut), 
                m.timeBack ? (
                  <StatusBadge key="sb" tone="green">Returned ({api.formatDateTime(m.timeBack)})</StatusBadge>
                ) : (
                  <StatusBadge key="sb" tone="orange">Currently Outside</StatusBadge>
                ), 
                <div key="act" className="flex gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setModal({ type: "movement", data: m })}><Edit className="w-3.5 h-3.5" /></Button>
                  {!m.timeBack && <Button size="sm" onClick={() => markBack(m)}>Mark Returned</Button>}
                  <Button size="sm" variant="danger" onClick={() => confirmAction("Delete movement record?") && run(() => api.deleteMovement(m.id), "Movement deleted")}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ])} 
            />
          </Card>
        )}

        {attendanceTab === "visitors" && (
          <Card className="overflow-hidden">
            <DataTable 
              headers={["Visitor Info", "Host Student ID", "Time In", "Time Out", "Actions"]} 
              rows={visitors
                .filter(v => !searchQuery || v.studentId.includes(searchQuery) || v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((v) => [
                <div key="1">
                  <p className="font-bold text-slate-800 text-xs">{v.visitorName}</p>
                  <p className="text-[11px] text-slate-500">{v.relation} • From: {v.fromLocation}</p>
                </div>, 
                <span key="2" className="font-semibold text-slate-700 text-xs">{v.studentId}</span>, 
                api.formatDateTime(v.timeIn), 
                v.timeOut ? api.formatDateTime(v.timeOut) : <StatusBadge key="sb" tone="emerald">Inside Hostel</StatusBadge>, 
                <div key="2" className="flex gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setModal({ type: "visitor", data: v })}><Edit className="w-3.5 h-3.5" /></Button>
                  {!v.timeOut && <Button size="sm" onClick={() => checkOutVisitor(v)}>Check Out</Button>}
                  <Button size="sm" variant="danger" onClick={() => confirmAction("Delete visitor log?") && run(() => api.deleteVisitor(v.id), "Visitor deleted")}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ])} 
            />
          </Card>
        )}

        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  // =========================================================================
  // 3. STUDENT MANAGEMENT PAGE (`students`)
  // =========================================================================
  if (activePage === "students") {
    const filteredBlockStudents = blockStudents.filter(s => {
      const isOut = currentlyOutMovements.some(m => m.studentId === s.studentId);
      if (studentStatusFilter === "inside" && isOut) return false;
      if (studentStatusFilter === "outside" && !isOut) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.studentId.includes(q) ||
        (s.roomNumber && s.roomNumber.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q))
      );
    });

    return (
      <div className="space-y-6 font-sans max-w-6xl mx-auto py-2">
        <PageHeader 
          title={`Hostel Student Management (${staffBlock})`} 
          subtitle={`Roster & live movement tracking for students residing in ${staffBlock}`} 
          actions={
            <Button variant="secondary" onClick={load}>
              <RefreshCcw className="w-4 h-4" /> Refresh Roster
            </Button>
          } 
        />

        {/* 4 REQUISITE METRIC BOXES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* BOX 1: Total Hostel Students */}
          <StatCard 
            title="Total Hostel Students" 
            value={blockStudents.length} 
            icon={<Users className="w-5 h-5" />} 
            tone="blue" 
            note={`Registered residents in ${staffBlock}`} 
          />

          {/* BOX 2: Students Currently Out */}
          <StatCard 
            title="Students Currently Out" 
            value={currentlyOutStudentsCount} 
            icon={<LogOut className="w-5 h-5" />} 
            tone="orange" 
            note="Active exit movements" 
          />

          {/* BOX 3: Reasons for Going Out */}
          <div className="bg-slate-100 rounded-3xl p-5 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Out Reasons</p>
              <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                <Navigation className="w-4 h-4" />
              </div>
            </div>
            {Object.keys(outReasonsMap).length ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(outReasonsMap).map(([reason, count]) => (
                  <span key={reason} className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 shadow-2xs">
                    {reason}: <strong className="text-purple-700 font-extrabold">{count}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No students currently out</p>
            )}
          </div>

          {/* BOX 4: Today's Meal Count */}
          <StatCard 
            title="Today's Block Meals" 
            value={blockMealExpectedToday.total} 
            icon={<Utensils className="w-5 h-5" />} 
            tone="green" 
            note={`B: ${blockMealExpectedToday.breakfast} | L: ${blockMealExpectedToday.lunch} | D: ${blockMealExpectedToday.dinner}`} 
          />
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-blue-600"
              placeholder="Search student by Name, Student ID, or Room Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {["all", "inside", "outside"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStudentStatusFilter(st)}
                className={`flex-1 md:flex-none px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  studentStatusFilter === st 
                    ? "bg-slate-800 text-white shadow-2xs" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "all" ? "All Residents" : st === "inside" ? "In Hostel" : "Outside"}
              </button>
            ))}
          </div>
        </Card>

        {/* Students Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              Resident Student Roster ({filteredBlockStudents.length})
            </h3>
            <span className="text-xs text-slate-500">Block {staffBlock}</span>
          </div>

          <DataTable 
            headers={["Student Profile", "Room & Department", "Contact Number", "Current Presence", "Action"]} 
            rows={filteredBlockStudents.map((s) => {
              const activeMovement = currentlyOutMovements.find(m => m.studentId === s.studentId);
              const isCurrentlyOut = Boolean(activeMovement);

              return [
                <div key="prof" className="flex items-center gap-3">
                  <img 
                    src={s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=006837&color=fff`} 
                    alt={s.name}
                    className="w-8 h-8 rounded-full border object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-800 text-xs">{s.name}</p>
                    <p className="text-[10px] text-slate-500">ID: {s.studentId}</p>
                  </div>
                </div>,
                <div key="room">
                  <p className="font-semibold text-slate-800 text-xs">Room {s.roomNumber || "Unassigned"}</p>
                  <p className="text-[10px] text-slate-400">{s.department || "N/A"}</p>
                </div>,
                <div key="contact">
                  <p className="font-medium text-slate-700 text-xs">{s.phone || "No phone"}</p>
                  <p className="text-[10px] text-slate-400">Emergency: {s.emergencyContact || "N/A"}</p>
                </div>,
                isCurrentlyOut ? (
                  <div key="status" className="space-y-0.5">
                    <StatusBadge tone="orange">Currently Outside</StatusBadge>
                    <p className="text-[10px] text-slate-500">{activeMovement.destination} ({activeMovement.purpose || "Out"})</p>
                  </div>
                ) : (
                  <StatusBadge key="status" tone="green">In Hostel</StatusBadge>
                ),
                <Button 
                  key="act" 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setModal({ type: "studentDetails", data: { student: s, activeMovement } })}
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </Button>
              ];
            })} 
          />
        </Card>

        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  // =========================================================================
  // 4. NOTICES PAGE
  // =========================================================================
  if (activePage === "notices") {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto py-2">
        <PageHeader title="Staff Announcements & Notices" subtitle="Active notices issued by administration" />
        {notices.length ? notices.map((n) => (
          <Card key={n.id} className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">{n.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{api.formatDateTime(n.createdAt)} • Published by {n.createdBy}</p>
              </div>
              <StatusBadge tone="blue">{n.targetAudience}</StatusBadge>
            </div>
            <p className="mt-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed">{n.content}</p>
          </Card>
        )) : (
          <Card><EmptyState icon={<BellRing />} title="No staff notices posted" /></Card>
        )}
      </div>
    );
  }

  // =========================================================================
  // 5. NOTIFICATIONS PAGE
  // =========================================================================
  if (activePage === "notifications") {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto py-2">
        <PageHeader 
          title="Staff Notifications" 
          subtitle="System broadcasts and admin task alerts" 
          actions={<Button variant="secondary" onClick={load}><RefreshCcw className="w-4 h-4" /> Refresh</Button>} 
        />
        {notifications.length ? notifications.map((n) => (
          <Card key={n.id} className={`p-5 ${!n.isRead ? "border-blue-600 bg-blue-50/20" : ""}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">{n.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-2">{api.formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && <StatusBadge tone="red">Unread</StatusBadge>}
            </div>
            {!n.isRead && (
              <Button size="sm" className="mt-3" onClick={() => run(() => api.markNotificationRead(n.id), "Marked as read")}>
                Mark Read
              </Button>
            )}
          </Card>
        )) : (
          <Card><EmptyState icon={<Bell />} title="No notifications" /></Card>
        )}
        <Toast toast={toast} />
      </div>
    );
  }

  // =========================================================================
  // 6. DEFAULT CLEAN STAFF DASHBOARD
  // =========================================================================
  const pendingTasksList = tasks.filter(t => !t.isStaffRequest && t.status !== "Completed");

  return (
    <div className="space-y-8 animate-fade-in font-sans max-w-6xl mx-auto py-2">
      {/* Clean Staff Hero Header */}
      <div className="relative bg-gradient-to-br from-[#021b2b] via-[#04283d] to-[#011422] text-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-800 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
                Staff Operations Desk • {staffBlock}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || "Staff Member"} 👋
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-2 max-w-xl leading-relaxed">
              Assigned Block: <strong className="text-white">{staffBlock}</strong> • Shift: {user?.shift || "General Shift"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => onNavigate("operations")} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
              <ClipboardList className="w-4 h-4" /> Open Operations
            </Button>
            <Button onClick={() => onNavigate("students")} variant="secondary">
              <Users className="w-4 h-4" /> Student Roster
            </Button>
          </div>
        </div>
      </div>

      {/* Clean Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Block Residents" 
          value={blockStudents.length} 
          icon={<Users className="w-5 h-5" />} 
          tone="blue" 
          note={`${staffBlock} Students`} 
        />
        <StatCard 
          title="Students Outside" 
          value={currentlyOutStudentsCount} 
          icon={<LogOut className="w-5 h-5" />} 
          tone="orange" 
          note="Active movement logs" 
        />
        <StatCard 
          title="Visitors Inside" 
          value={visitorsInsideCount} 
          icon={<LogIn className="w-5 h-5" />} 
          tone="green" 
          note="Active visitor logs" 
        />
        <StatCard 
          title="Pending Tasks" 
          value={pendingTasksList.length} 
          icon={<Clock className="w-5 h-5" />} 
          tone="red" 
          note="Duty tasks assigned" 
        />
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Assigned Duty Tasks */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Assigned Duty Tasks
            </h3>
            <Button size="sm" variant="ghost" onClick={() => onNavigate("operations")}>View All</Button>
          </div>

          <div className="space-y-3">
            {pendingTasksList.length ? (
              pendingTasksList.slice(0, 4).map((t) => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{t.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge tone={t.priority === "High" || t.priority === "Urgent" ? "red" : "blue"}>{t.priority}</StatusBadge>
                      <span className="text-[10px] text-slate-400">• Location: {t.location || staffBlock}</span>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    onClick={() => setModal({ type: "completeTask", data: t })}
                  >
                    <Check className="w-3.5 h-3.5" /> Complete
                  </Button>
                </div>
              ))
            ) : (
              <EmptyState icon={<CheckCircle2 className="w-8 h-8" />} title="No pending tasks assigned" />
            )}
          </div>
        </Card>

        {/* Panel 2: Announcements */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-600" /> Recent Staff Announcements
            </h3>
            <Button size="sm" variant="ghost" onClick={() => onNavigate("notices")}>View All</Button>
          </div>

          <div className="space-y-3">
            {notices.length ? (
              notices.slice(0, 3).map((n) => (
                <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <h4 className="font-bold text-slate-800 text-xs">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.content}</p>
                  <p className="text-[10px] text-slate-400 mt-2">{api.formatDateTime(n.createdAt)}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={<BellRing className="w-8 h-8" />} title="No staff announcements" />
            )}
          </div>
        </Card>
      </div>

      {renderModal()}
      <Toast toast={toast} />
    </div>
  );

  // =========================================================================
  // MODAL HANDLERS & COMPONENTS
  // =========================================================================
  function renderModal() {
    if (!modal) return null;
    if (modal.type === "visitor") {
      return <VisitorForm initial={modal.data} onClose={() => setModal(null)} onSave={(form) => run(async () => { await api.upsertVisitor(form); setModal(null); }, form.id ? "Visitor updated" : "Visitor logged")} />;
    }
    if (modal.type === "movement") {
      return <MovementForm initial={modal.data} onClose={() => setModal(null)} onSave={(form) => run(async () => { await api.upsertMovement(form); setModal(null); }, form.id ? "Movement updated" : "Exit movement recorded")} />;
    }
    if (modal.type === "completeTask") {
      return <CompleteTaskModal task={modal.data} onClose={() => setModal(null)} onSubmit={(feedback) => { handleCompleteTaskSubmit(modal.data, feedback); setModal(null); }} />;
    }
    if (modal.type === "staffRequest") {
      return <StaffRequestModal initial={modal.data} onClose={() => setModal(null)} onSubmit={(form) => { handleStaffRequestSubmit(form); setModal(null); }} />;
    }
    if (modal.type === "studentDetails") {
      return (
        <StudentDetailsModal 
          student={modal.data.student} 
          activeMovement={modal.data.activeMovement} 
          onClose={() => setModal(null)}
          onLogExit={() => {
            setModal({ type: "movement", data: { ...blankMovement, studentId: modal.data.student.studentId, studentName: modal.data.student.name } });
          }}
          onMarkReturn={() => {
            if (modal.data.activeMovement) {
              markBack(modal.data.activeMovement);
              setModal(null);
            }
          }}
        />
      );
    }
    return null;
  }
};

// =========================================================================
// HELPER COMPONENTS & MODALS
// =========================================================================

const DataTable = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-[10px] uppercase tracking-widest text-slate-500 bg-slate-50 border-b">
        <tr>{headers.map((h) => <th key={h} className="px-5 py-3 font-extrabold">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.length ? rows.map((row, i) => (
          <tr key={i} className="hover:bg-slate-50/80 transition-colors">
            {row.map((cell, j) => <td key={j} className="px-5 py-3.5 align-middle">{cell}</td>)}
          </tr>
        )) : (
          <tr><td colSpan={headers.length}><EmptyState icon={<FileText />} title="No records found" /></td></tr>
        )}
      </tbody>
    </table>
  </div>
);

// Complete Task Feedback Modal
const CompleteTaskModal = ({ task, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState("");

  return (
    <Modal 
      title="Complete Task Confirmation" 
      onClose={onClose} 
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onSubmit(feedback)}>
            <Check className="w-4 h-4" /> Confirm & Submit Completion
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <h4 className="font-bold text-slate-800 text-sm">{task.title}</h4>
          <p className="text-xs text-slate-600 mt-1">{task.description}</p>
          <p className="text-[10px] text-slate-400 mt-2">Location: {task.location || "Hostel"}</p>
        </div>

        <Field label="Task Feedback / Completion Notes for Admin (Optional)">
          <TextArea 
            rows={4} 
            value={feedback} 
            onChange={(e) => setFeedback(e.target.value)} 
            placeholder="e.g. Completed maintenance in Room 204. Replaced handle and tested functionality." 
          />
        </Field>
      </div>
    </Modal>
  );
};

// Staff Request to Admin Modal
const StaffRequestModal = ({ initial, onClose, onSubmit }) => {
  const [form, setForm] = useState(initial);

  return (
    <Modal 
      title="Submit Request / Assistance to Admin" 
      onClose={onClose} 
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(form)} disabled={!form.title.trim() || !form.description.trim()}>
            <Send className="w-4 h-4" /> Send Request to Admin
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Request Title">
          <TextInput 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })} 
            placeholder="e.g. Request for additional cleaning supplies" 
            required 
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Location / Hostel Block">
            <TextInput 
              value={form.location} 
              onChange={(e) => setForm({ ...form, location: e.target.value })} 
              placeholder="Hostel Block A" 
            />
          </Field>

          <Field label="Priority Level">
            <SelectInput value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </SelectInput>
          </Field>
        </div>

        <Field label="Request Details / Description">
          <TextArea 
            rows={4} 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            placeholder="Provide details about what you need from the administration..." 
            required 
          />
        </Field>
      </div>
    </Modal>
  );
};

// Visitor Log Modal
const VisitorForm = ({ initial, onClose, onSave }) => { 
  const [form, setForm] = useState(initial); 
  return (
    <Modal title={form.id ? "Update Visitor Entry" : "Log New Visitor"} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Save Entry</Button></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Visitor Name"><TextInput value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} required /></Field>
        <Field label="Host Student ID"><TextInput value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value.replace(/\D/g, "") })} required /></Field>
        <Field label="Host Student Name"><TextInput value={form.studentName || ""} onChange={(e) => setForm({ ...form, studentName: e.target.value })} /></Field>
        <Field label="Relation"><TextInput value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} placeholder="Parent, Relative, Friend" required /></Field>
        <Field label="Visitor From Location"><TextInput value={form.fromLocation} onChange={(e) => setForm({ ...form, fromLocation: e.target.value })} required /></Field>
        <Field label="Purpose of Visit"><TextInput value={form.purpose || ""} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></Field>
      </div>
    </Modal>
  ); 
};

// Exit Movement Modal
const MovementForm = ({ initial, onClose, onSave }) => { 
  const [form, setForm] = useState(initial); 
  return (
    <Modal title={form.id ? "Update Exit Record" : "Log Student Exit"} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Save Movement</Button></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Student ID"><TextInput value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value.replace(/\D/g, "") })} required /></Field>
        <Field label="Student Name"><TextInput value={form.studentName || ""} onChange={(e) => setForm({ ...form, studentName: e.target.value })} /></Field>
        <Field label="Destination"><TextInput value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required /></Field>
        <Field label="Reason / Purpose">
          <SelectInput value={form.purpose || "Home Visit"} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
            <option value="Home Visit">Home Visit</option>
            <option value="Class / Exam">Class / Exam</option>
            <option value="Shopping / Personal">Shopping / Personal</option>
            <option value="Medical / Emergency">Medical / Emergency</option>
            <option value="Other">Other</option>
          </SelectInput>
        </Field>
      </div>
    </Modal>
  ); 
};

// Student Details Modal for Staff
const StudentDetailsModal = ({ student, activeMovement, onClose, onLogExit, onMarkReturn }) => {
  const isOutside = Boolean(activeMovement);

  return (
    <Modal 
      title={`Resident Profile: ${student.name}`} 
      onClose={onClose}
      footer={
        <div className="flex justify-between items-center w-full">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          {isOutside ? (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onMarkReturn}>
              Mark Student Returned
            </Button>
          ) : (
            <Button variant="warning" onClick={onLogExit}>
              <Navigation className="w-4 h-4" /> Log Student Exit
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 font-sans">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <img 
            src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=006837&color=fff`} 
            alt={student.name} 
            className="w-16 h-16 rounded-full border-2 border-emerald-600 object-cover shadow-xs" 
          />
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">{student.name}</h3>
            <p className="text-xs text-slate-500">Student ID: <strong className="text-slate-700">{student.studentId}</strong></p>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge tone="blue">{student.department || "Dept"}</StatusBadge>
              <StatusBadge tone={student.isActive ? "green" : "red"}>{student.isActive ? "Active Resident" : "Inactive"}</StatusBadge>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Hostel Room</span>
            <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{student.hostelBlock || "Hostel"} - Room {student.roomNumber || "N/A"}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Contact Phone</span>
            <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{student.phone || "Not set"}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Emergency Contact</span>
            <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{student.emergencyContact || "Not set"}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Email Address</span>
            <span className="font-semibold text-slate-800 mt-0.5 block truncate">{student.email || "N/A"}</span>
          </div>
        </div>

        {/* Live Presence Status Box */}
        <div className={`p-4 rounded-2xl border ${isOutside ? "bg-orange-50 border-orange-200 text-orange-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4" /> Live Presence Status
            </span>
            <StatusBadge tone={isOutside ? "orange" : "green"}>
              {isOutside ? "Currently Outside" : "Inside Hostel"}
            </StatusBadge>
          </div>

          {isOutside && activeMovement && (
            <div className="mt-3 pt-3 border-t border-orange-200/80 space-y-1 text-xs">
              <p><strong>Destination:</strong> {activeMovement.destination}</p>
              <p><strong>Reason / Purpose:</strong> {activeMovement.purpose || "General"}</p>
              <p><strong>Time Exit:</strong> {api.formatDateTime(activeMovement.timeOut)}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
