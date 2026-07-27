import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, BellRing, CalendarDays, Check, Download, FileText, RefreshCcw, Send, Utensils, Wallet, Coffee, Sun, Moon, ArrowRight, History, CreditCard } from "lucide-react";
import { buildFinancialSnapshot, toIsoDate, MEAL_WINDOWS, isStudentOnApprovedLeave, isMealCutoffPassed } from "../financialService";
import { Button, Card, EmptyState, Field, LoadingState, Modal, PageHeader, SelectInput, StatCard, StatusBadge, TextArea, TextInput, Toast } from "./ui";
import { ReceiptModal } from "./ReceiptModal";
import * as api from "../services/hostelService";

const dayName = (date) => date.toLocaleDateString("en-US", { weekday: "long" });

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Meal time windows definition (in 24-hour format)
// Breakfast: starts 08:00 AM, Cutoff: 07:30 AM
// Lunch: starts 01:00 PM (13:00), Cutoff: 12:30 PM
// Dinner: starts 07:00 PM (19:00), Cutoff: 06:30 PM
const MEAL_TIMES = {
  Breakfast: { startHour: 8, startMin: 0, endHour: 11, endMin: 0, cutoffHour: 7, cutoffMin: 30, displayStart: "08:00 AM", displayCutoff: "07:30 AM" },
  Lunch: { startHour: 13, startMin: 0, endHour: 18, endMin: 0, cutoffHour: 12, cutoffMin: 30, displayStart: "01:00 PM", displayCutoff: "12:30 PM" },
  Dinner: { startHour: 19, startMin: 0, endHour: 23, endMin: 0, cutoffHour: 18, cutoffMin: 30, displayStart: "07:00 PM", displayCutoff: "06:30 PM" }
};

export const StudentView = ({ user, activePage, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [meals, setMeals] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [movements, setMovements] = useState([]);
  const [modal, setModal] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("ALL");

  const notify = (message, type = "success") => { 
    setToast({ message, type }); 
    setTimeout(() => setToast(null), 3500); 
  };

  const load = async () => {
    setLoading(true);
    try {
      const [mealData, scheduleData, leaveData, complaintData, paymentData, noticeData, notificationData, movementData] = await Promise.all([
        api.listMeals(user.studentId), 
        api.listMealSchedules(), 
        api.listLeaves(user.studentId), 
        api.listComplaints(user.studentId), 
        api.listPayments(user.studentId), 
        api.listNotices("STUDENT", true), 
        api.listNotificationsForUser(user), 
        api.listMovements()
      ]);
      setMeals(mealData); 
      setSchedules(scheduleData); 
      setLeaves(leaveData); 
      setComplaints(complaintData); 
      setPayments(paymentData); 
      setNotices(noticeData); 
      setNotifications(notificationData); 
      setMovements(movementData.filter((m) => m.studentId === user.studentId));
    } catch (error) { 
      notify(error.message || "Failed to load data", "error"); 
    }
    setLoading(false);
  };

  useEffect(() => { 
    load(); 
  }, [user.studentId]);

  const currentTime = new Date();
  const todayStr = toIsoDate(currentTime);
  const tomorrowStr = toIsoDate(addDays(currentTime, 1));
  
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // Determine active actionable meals to show
  const activeActionableMeals = useMemo(() => {
    const items = [];

    const todayDay = dayName(currentTime);
    const tomorrowObj = addDays(currentTime, 1);
    const tomorrowDay = dayName(tomorrowObj);

    const isBreakfastOver = currentTotalMinutes >= MEAL_TIMES.Breakfast.endHour * 60 + MEAL_TIMES.Breakfast.endMin;
    const isLunchOver = currentTotalMinutes >= MEAL_TIMES.Lunch.endHour * 60 + MEAL_TIMES.Lunch.endMin;
    const isDinnerOver = currentTotalMinutes >= MEAL_TIMES.Dinner.endHour * 60 + MEAL_TIMES.Dinner.endMin;

    const findSchedule = (day, type) => {
      return schedules.find((s) => s.dayOfWeek === day && s.mealType === type) || {
        dayOfWeek: day,
        mealType: type,
        menu: type === "Breakfast" ? "Paratha, Egg Curry, Tea" : type === "Lunch" ? "Rice, Chicken Curry, Dal, Salad" : "Rice, Fish Curry, Vegetables",
        price: type === "Breakfast" ? 30 : type === "Lunch" ? 60 : 50,
        startTime: type === "Breakfast" ? "08:00 AM" : type === "Lunch" ? "01:00 PM" : "07:00 PM",
        isAvailable: true
      };
    };

    // 1. Breakfast slot
    if (!isBreakfastOver) {
      items.push({
        dateStr: todayStr,
        dateObj: currentTime,
        isToday: true,
        mealType: "Breakfast",
        dayOfWeek: todayDay,
        schedule: findSchedule(todayDay, "Breakfast")
      });
    }

    // 2. Lunch slot
    if (!isLunchOver) {
      items.push({
        dateStr: todayStr,
        dateObj: currentTime,
        isToday: true,
        mealType: "Lunch",
        dayOfWeek: todayDay,
        schedule: findSchedule(todayDay, "Lunch")
      });
    }

    // 3. Dinner slot
    if (!isDinnerOver) {
      items.push({
        dateStr: todayStr,
        dateObj: currentTime,
        isToday: true,
        mealType: "Dinner",
        dayOfWeek: todayDay,
        schedule: findSchedule(todayDay, "Dinner")
      });
    }

    // If Today's Breakfast was over, append Tomorrow's Breakfast below Dinner
    if (isBreakfastOver) {
      items.push({
        dateStr: tomorrowStr,
        dateObj: tomorrowObj,
        isToday: false,
        mealType: "Breakfast",
        dayOfWeek: tomorrowDay,
        schedule: findSchedule(tomorrowDay, "Breakfast")
      });
    }

    // If Today's Lunch was over, append Tomorrow's Lunch
    if (isLunchOver) {
      items.push({
        dateStr: tomorrowStr,
        dateObj: tomorrowObj,
        isToday: false,
        mealType: "Lunch",
        dayOfWeek: tomorrowDay,
        schedule: findSchedule(tomorrowDay, "Lunch")
      });
    }

    // If Today's Dinner was over, append Tomorrow's Dinner
    if (isDinnerOver) {
      items.push({
        dateStr: tomorrowStr,
        dateObj: tomorrowObj,
        isToday: false,
        mealType: "Dinner",
        dayOfWeek: tomorrowDay,
        schedule: findSchedule(tomorrowDay, "Dinner")
      });
    }

    return items;
  }, [schedules, currentTime, currentTotalMinutes, todayStr, tomorrowStr]);

  // Financial snapshot computation
  const financial = useMemo(() => {
    try {
      return buildFinancialSnapshot({ 
        studentId: user.studentId, 
        meals: meals || [], 
        leaveRequests: leaves || [], 
        payments: payments || [] 
      });
    } catch (error) {
      console.error("Financial snapshot error:", error);
      return { 
        totalOutstanding: 0, 
        totalPaid: 0, 
        statements: [], 
        activities: [],
        currentStatement: null,
        lastPayment: null
      };
    }
  }, [meals, leaves, payments, user.studentId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const run = async (fn, success) => { 
    try { 
      await fn(); 
      await load(); 
      notify(success); 
    } catch (error) { 
      notify(error.message || "Operation failed", "error"); 
    } 
  };

  const getMealRecord = (dateStr, type) => {
    return meals.find((m) => m.date === dateStr && m.type === type);
  };

  const toggleMealStatus = async (item) => {
    const isOnLeave = isStudentOnApprovedLeave(item.dateStr, leaves);
    if (isOnLeave) {
      return notify("You are on an approved leave for this date. Meal cannot be activated.", "error");
    }

    const cutoffPassed = isMealCutoffPassed(item.dateStr, item.mealType);
    if (cutoffPassed) {
      return notify(`30-minute cutoff passed (${MEAL_TIMES[item.mealType]?.displayCutoff || "before start"}). Changes no longer allowed.`, "error");
    }

    const record = getMealRecord(item.dateStr, item.mealType);
    const currentStatus = record ? record.status : "Active";
    const nextStatus = currentStatus === "Cancelled" ? "Active" : "Cancelled";

    await run(
      async () => {
        await api.upsertMeal({ 
          id: record?.id, 
          date: item.dateStr, 
          type: item.mealType, 
          status: nextStatus, 
          menu: item.schedule.menu, 
          cost: item.schedule.price, 
          studentId: user.studentId 
        });
      },
      nextStatus === "Cancelled" ? `${item.mealType} (${item.dateStr}) cancelled` : `${item.mealType} (${item.dateStr}) activated`
    );
  };

  // Comprehensive meal history (includes active, cancelled, & leave-disabled meals)
  const allMealHistory = useMemo(() => {
    const historyList = [...meals];

    // Ensure today's meals are represented
    ["Breakfast", "Lunch", "Dinner"].forEach((type) => {
      if (!historyList.some((m) => m.date === todayStr && m.type === type)) {
        historyList.push({
          id: `virtual-${todayStr}-${type}`,
          date: todayStr,
          type,
          status: "Active",
          cost: MEAL_WINDOWS[type]?.cost || 30,
          menu: type === "Breakfast" ? "Paratha, Egg Curry, Tea" : type === "Lunch" ? "Rice, Chicken Curry, Dal, Salad" : "Rice, Fish Curry, Vegetables",
          studentId: user.studentId
        });
      }
    });

    const list = historyList.sort((a, b) => b.date.localeCompare(a.date) || a.type.localeCompare(b.type));

    return list.map((m) => {
      const onLeave = isStudentOnApprovedLeave(m.date, leaves);
      const cutoffPassed = isMealCutoffPassed(m.date, m.type);
      const isCancelled = m.status === "Cancelled";

      let statusLabel = "Active";
      let tone = "blue";
      let billingNote = "Scheduled";

      if (onLeave) {
        statusLabel = "Off (Leave)";
        tone = "orange";
        billingNote = "৳0 (Approved leave period)";
      } else if (isCancelled) {
        statusLabel = "Cancelled";
        tone = "red";
        billingNote = "৳0 (Cancelled prior to cutoff)";
      } else if (cutoffPassed) {
        statusLabel = "Active (Charged)";
        tone = "green";
        billingNote = `৳${m.cost || MEAL_WINDOWS[m.type]?.cost || 0} added to bill history`;
      } else {
        statusLabel = "Active (Upcoming)";
        tone = "blue";
        billingNote = `৳${m.cost || MEAL_WINDOWS[m.type]?.cost || 0} (Pending cutoff)`;
      }

      return {
        ...m,
        onLeave,
        cutoffPassed,
        statusLabel,
        tone,
        billingNote
      };
    }).filter((m) => {
      if (historyFilter === "ACTIVE") return m.statusLabel.startsWith("Active");
      if (historyFilter === "CANCELLED") return m.status === "Cancelled";
      if (historyFilter === "LEAVE") return m.onLeave;
      return true;
    });
  }, [meals, leaves, historyFilter, todayStr, user.studentId]);

  if (loading) return <LoadingState label="Loading student panel..." />;

  // ============================================================
  // DASHBOARD VIEW
  // ============================================================
  if (activePage === "dashboard") {
    return (
      <div className="space-y-8 animate-fade-in font-sans max-w-5xl mx-auto py-2">
        {/* Main Clean & Smart Welcome Hero Card */}
        <div className="relative bg-gradient-to-br from-[#012e1b] via-[#004d28] to-[#013b20] text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-emerald-900/40 overflow-hidden">
          {/* Subtle Ambient Glow Effect */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header Status & Greeting */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400" />
                <span className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                  Green University Hostel ERP • Student Portal
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md text-emerald-100 text-xs px-4 py-1.5 rounded-full border border-white/15 font-medium">
                ID: {user.studentId} • Room {user.roomNumber || "302"}
              </div>
            </div>

            {/* Main Welcome Headline */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Welcome back, <br className="hidden md:block" />
                  <span className="text-emerald-300">{user.name}</span> 👋
                </h1>
                <p className="text-slate-200 text-sm md:text-base mt-4 max-w-2xl font-normal leading-relaxed">
                  We are glad to have you in the hostel. Your resident account is fully active. Access all your meal schedules, leave applications, complaints, and financial statements directly from the navigation menu on the left.
                </p>
              </div>

              {/* Avatar Pill */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 border-white/20 p-1 bg-white/5 shadow-2xl overflow-hidden">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/10">
              <button
                type="button"
                onClick={() => onNavigate("meals")}
                className="group p-4 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-left flex items-center gap-4 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Meal Schedule</h3>
                  <p className="text-xs text-slate-300">View & manage active meals</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("leave")}
                className="group p-4 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-left flex items-center gap-4 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Apply Leave</h3>
                  <p className="text-xs text-slate-300">Submit leave permission</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("fees")}
                className="group p-4 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-left flex items-center gap-4 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Statements</h3>
                  <p className="text-xs text-slate-300">Dues & payment records</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <Toast toast={toast} />
      </div>
    );
  }

  // ============================================================
  // MEAL MANAGEMENT PAGE
  // ============================================================
  if (activePage === "meals") {
    const currentMonthStr = todayStr.slice(0, 7);
    const currentMonthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const currentMonthMeals = (meals || []).filter((m) => m.date && m.date.startsWith(currentMonthStr));
    const activeMonthMeals = currentMonthMeals.filter((m) => m.status !== "Cancelled" && !isStudentOnApprovedLeave(m.date, leaves));

    const bfCount = activeMonthMeals.filter((m) => m.type === "Breakfast").length;
    const lunchCount = activeMonthMeals.filter((m) => m.type === "Lunch").length;
    const dinnerCount = activeMonthMeals.filter((m) => m.type === "Dinner").length;
    const totalMonthCount = activeMonthMeals.length;

    return (
      <div className="space-y-6 font-sans animate-fade-in">
        <PageHeader 
          title="Meal Manager" 
          subtitle="Manage active daily meals, toggle status, and inspect full meal history" 
          actions={
            <Button variant="secondary" onClick={load}>
              <RefreshCcw className="w-4 h-4" /> Refresh
            </Button>
          } 
        />

        {/* Monthly Meal Count Card */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md text-emerald-300">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                  Monthly Meal Tracker • {currentMonthName}
                </span>
                <h2 className="text-xl font-black text-white">Monthly Meal Count</h2>
              </div>
            </div>
            <div className="bg-emerald-500/20 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/30 self-start sm:self-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Refreshes Each Month
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-xs text-slate-300 font-medium">Total Meals Taken</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {totalMonthCount} <span className="text-xs font-normal text-emerald-300">meals</span>
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-xs text-slate-300 font-medium">Breakfast Count</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-300 mt-1">
                {bfCount}
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-xs text-slate-300 font-medium">Lunch Count</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-300 mt-1">
                {lunchCount}
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-xs text-slate-300 font-medium">Dinner Count</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-300 mt-1">
                {dinnerCount}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 italic text-right">
            * Meal count is calculated for {currentMonthName} and automatically resets at the start of next month.
          </p>
        </div>

        {/* Active Actionable 3-Meal Cycle Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-emerald-600 w-1.5 h-6 rounded-full" />
                Active Actionable Meal Windows
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Breakfast (8:00 AM, cutoff 7:30 AM) • Lunch (1:00 PM, cutoff 12:30 PM) • Dinner (7:00 PM, cutoff 6:30 PM)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {activeActionableMeals.map((item) => {
              const record = getMealRecord(item.dateStr, item.mealType);
              const isCancelled = record?.status === "Cancelled";
              const isOnLeave = isStudentOnApprovedLeave(item.dateStr, leaves);
              const cutoffPassed = isMealCutoffPassed(item.dateStr, item.mealType);

              const mealInfo = MEAL_TIMES[item.mealType] || { displayStart: "08:00 AM", displayCutoff: "07:30 AM" };

              const getIcon = () => {
                if (item.mealType === "Breakfast") return <Coffee className="w-6 h-6 text-amber-600" />;
                if (item.mealType === "Lunch") return <Sun className="w-6 h-6 text-orange-600" />;
                return <Moon className="w-6 h-6 text-indigo-600" />;
              };

              const getBorderColor = () => {
                if (isOnLeave) return "border-amber-200 bg-amber-50/30";
                if (isCancelled) return "border-red-200 bg-red-50/50";
                if (item.mealType === "Breakfast") return "border-amber-200 bg-amber-50/40";
                if (item.mealType === "Lunch") return "border-orange-200 bg-orange-50/40";
                return "border-indigo-200 bg-indigo-50/40";
              };

              return (
                <div 
                  key={`${item.dateStr}-${item.mealType}`} 
                  className={`rounded-2xl border-2 p-6 transition-all shadow-xs flex flex-col justify-between ${getBorderColor()}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-white shadow-xs border border-gray-200/80">
                          {getIcon()}
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                            {item.isToday ? "Today" : "Tomorrow"} • {item.dateStr}
                          </span>
                          <h3 className="text-lg font-extrabold text-gray-800">{item.mealType}</h3>
                        </div>
                      </div>

                      {isOnLeave ? (
                        <StatusBadge tone="orange">Off (Leave)</StatusBadge>
                      ) : cutoffPassed ? (
                        <StatusBadge tone={isCancelled ? "red" : "green"}>
                          {isCancelled ? "Cancelled (Locked)" : "Active (Locked)"}
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone={isCancelled ? "red" : "green"}>
                          {isCancelled ? "Cancelled" : "Active"}
                        </StatusBadge>
                      )}
                    </div>

                    <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3.5 border border-gray-200/60 mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Menu</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{item.schedule.menu}</p>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 font-medium px-1">
                      <div className="flex items-center justify-between">
                        <span>Price: <b className="text-emerald-700 text-sm">৳{item.schedule.price}</b></span>
                        <span>Meal Time: <b>{mealInfo.displayStart}</b></span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Cutoff Time: <b className="text-red-600">{mealInfo.displayCutoff}</b></span>
                        <span>(30m Before Start)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200/60">
                    {isOnLeave ? (
                      <div>
                        <Button disabled variant="secondary" className="w-full py-2.5 text-xs opacity-60 cursor-not-allowed">
                          Disabled (On Approved Leave)
                        </Button>
                        <p className="text-[10px] text-amber-700 text-center mt-1.5 font-medium">
                          Meals are automatically off during hostel leave.
                        </p>
                      </div>
                    ) : cutoffPassed ? (
                      <div>
                        <Button disabled variant="secondary" className="w-full py-2.5 text-xs opacity-60 cursor-not-allowed">
                          {isCancelled ? "Cancelled (Cutoff Passed)" : "Active & Charged (Locked)"}
                        </Button>
                        <p className="text-[10px] text-gray-500 text-center mt-1.5 font-medium">
                          Cutoff time passed ({mealInfo.displayCutoff}). Status is locked.
                        </p>
                      </div>
                    ) : (
                      <Button 
                        variant={isCancelled ? "primary" : "danger"} 
                        onClick={() => toggleMealStatus(item)} 
                        className="w-full py-2.5 text-xs"
                      >
                        {isCancelled ? "Activate Meal" : "Cancel Meal"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete Meal History Table Section */}
        <div className="pt-6">
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  Meal History & Billing Log
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Complete history of all meals, active status, leave deductions, and automatic billing updates.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                <button 
                  onClick={() => setHistoryFilter("ALL")} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${historyFilter === "ALL" ? "bg-white text-gray-800 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
                >
                  All ({allMealHistory.length})
                </button>
                <button 
                  onClick={() => setHistoryFilter("ACTIVE")} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${historyFilter === "ACTIVE" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
                >
                  Active / Billed
                </button>
                <button 
                  onClick={() => setHistoryFilter("CANCELLED")} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${historyFilter === "CANCELLED" ? "bg-white text-red-700 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
                >
                  Cancelled
                </button>
                <button 
                  onClick={() => setHistoryFilter("LEAVE")} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${historyFilter === "LEAVE" ? "bg-white text-amber-700 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
                >
                  On Leave
                </button>
              </div>
            </div>

            <DataTable 
              headers={["Date", "Meal Type", "Menu Description", "Price", "Meal Status", "Billing & Action History"]} 
              rows={allMealHistory.map((m) => [
                <span key="1" className="font-bold text-gray-800">{m.date}</span>,
                <span key="2" className="font-semibold text-gray-700">{m.type}</span>,
                <span key="3" className="text-xs text-gray-600 max-w-xs block truncate">{m.menu || "Standard Menu"}</span>,
                <span key="4" className="font-extrabold text-emerald-700">৳{m.cost || MEAL_WINDOWS[m.type]?.cost || 0}</span>,
                <StatusBadge key="5" tone={m.tone}>
                  {m.statusLabel}
                </StatusBadge>,
                <span key="6" className="text-xs text-gray-600 font-medium">{m.billingNote}</span>
              ])} 
            />
          </Card>
        </div>

        <Toast toast={toast} />
      </div>
    );
  }

  // ============================================================
  // LEAVE APPLICATIONS PAGE
  // ============================================================
  if (activePage === "leave") {
    return (
      <div className="space-y-6 font-sans">
        <PageHeader 
          title="Leave Applications" 
          subtitle="Submit leave requests and view approval status" 
          actions={
            <Button onClick={() => setModal({ type: "leave", data: { startDate: "", endDate: "", reason: "" } })}>
              <CalendarDays className="w-4 h-4" /> Apply For Leave
            </Button>
          } 
        />
        <Card className="overflow-hidden">
          <DataTable 
            headers={["Start Date", "End Date", "Reason", "Status", "Reviewed By"]} 
            rows={leaves.map((l) => [
              l.startDate, 
              l.endDate, 
              <span key="r" className="text-xs text-gray-700 max-w-sm block">{l.reason}</span>, 
              <StatusBadge key="s" tone={l.status === "Approved" ? "green" : l.status === "Rejected" ? "red" : "orange"}>{l.status}</StatusBadge>,
              l.reviewedBy || "-"
            ])} 
          />
        </Card>
        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  // ============================================================
  // FEES & PAYMENT HISTORY PAGE
  // ============================================================
  if (activePage === "fees") {
    return (
      <div className="space-y-6 font-sans">
        <PageHeader 
          title="Fee History & Financial Ledger" 
          subtitle="Official hostel monthly billing, seat rent, completed meal charges and receipts" 
        />
        
        {/* Exactly FOUR Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Bill" 
            value={`৳${(financial.totalBill || 0).toLocaleString()}`} 
            icon={<FileText />} 
            tone="blue" 
          />
          <StatCard 
            title="Total Paid" 
            value={`৳${(financial.totalPaid || 0).toLocaleString()}`} 
            icon={<Check />} 
            tone="green" 
          />
          <StatCard 
            title="Balance Due" 
            value={`৳${(financial.balanceDue || 0).toLocaleString()}`} 
            icon={<Wallet />} 
            tone="red" 
          />
          <StatCard 
            title="Current Month Fee" 
            value={`৳${(financial.currentMonthFee || 0).toLocaleString()}`} 
            icon={<Coffee />} 
            tone="orange" 
          />
        </div>

        {/* Monthly Billing History Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-gray-800">Monthly Billing History</h3>
              <p className="text-xs text-gray-500">Breakdown of seat rent (৳4,500) and actual completed meal charges per month</p>
            </div>
            <StatusBadge tone="blue">ERP Synchronized</StatusBadge>
          </div>
          <DataTable 
            headers={["Billing Month", "Seat Rent", "Meal Charges", "Total Bill", "Paid Amount", "Balance Due", "Status", "Receipt"]} 
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
              (s.status === "Paid" || (s.paidAmount || 0) > 0) ? (
                <Button key="b" variant="secondary" onClick={() => setSelectedReceipt({ ...s, studentName: user.name, studentId: user.studentId, department: user.department, hostelBlock: user.hostelBlock, roomNo: user.roomNumber })} className="text-xs">
                  <Download className="w-3.5 h-3.5" /> Download Receipt
                </Button>
              ) : (
                <span key="pending-rcpt" className="text-xs text-gray-400 font-medium italic">Pending Admin Confirmation</span>
              )
            ])} 
          />
        </Card>

        {/* Confirmed Payment Receipts History */}
        {payments && payments.filter((p) => p.status === "Paid" || Number(p.paidAmount || 0) > 0).length > 0 && (
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-extrabold text-gray-800">Confirmed Payment Receipts</h3>
              <p className="text-xs text-gray-500">Official payments recorded and approved by Green University Accounts</p>
            </div>
            <DataTable
              headers={["Receipt No", "Date", "Period", "Paid Amount", "Status", "Action"]}
              rows={payments.filter((p) => p.status === "Paid" || Number(p.paidAmount || 0) > 0).map((p) => [
                <span key="r" className="font-mono font-bold text-emerald-800">{p.receiptNo || p.id}</span>,
                p.invoiceDate || p.createdAt?.slice(0, 10),
                p.billingPeriod || "Monthly Fee",
                <span key="amt" className="font-extrabold text-emerald-700">৳{Number(p.paidAmount || 0).toLocaleString()}</span>,
                <StatusBadge key="sb2" tone="green">CONFIRMED</StatusBadge>,
                <Button key="btn" variant="secondary" onClick={() => setSelectedReceipt({ ...p, totalBill: p.totalBill || p.paidAmount, seatRent: 4500, mealCharges: Math.max(0, (p.totalBill || p.paidAmount) - 4500), studentName: user.name, studentId: user.studentId, department: user.department, hostelBlock: user.hostelBlock, roomNo: user.roomNumber })} className="text-xs">
                  <Download className="w-3.5 h-3.5" /> Receipt PDF
                </Button>
              ])}
            />
          </Card>
        )}

        {selectedReceipt && (
          <ReceiptModal 
            receipt={selectedReceipt} 
            student={user} 
            onClose={() => setSelectedReceipt(null)} 
          />
        )}

        <Toast toast={toast} />
      </div>
    );
  }

  // ============================================================
  // COMPLAINTS PAGE
  // ============================================================
  if (activePage === "complaints") {
    return (
      <div className="space-y-6 font-sans">
        <PageHeader 
          title="Resident Complaints" 
          subtitle="Submit maintenance, Wi-Fi or food complaints and track resolution" 
          actions={
            <Button onClick={() => setModal({ type: "complaint", data: { type: "Maintenance", priority: "Medium", description: "" } })}>
              <Send className="w-4 h-4" /> New Complaint
            </Button>
          } 
        />
        <Card className="overflow-hidden">
          <DataTable 
            headers={["Date", "Type", "Priority", "Description", "Status"]} 
            rows={complaints.map((c) => [
              c.date, 
              c.type, 
              <StatusBadge key="p" tone={c.priority === "Urgent" ? "red" : c.priority === "High" ? "orange" : "blue"}>{c.priority}</StatusBadge>, 
              <span key="d" className="text-xs text-gray-700 max-w-md block">{c.description}</span>, 
              <StatusBadge key="s" tone={c.status === "Resolved" ? "green" : "red"}>{c.status}</StatusBadge>
            ])} 
          />
        </Card>
        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  // ============================================================
  // NOTICES PAGE
  // ============================================================
  if (activePage === "notices") {
    return (
      <div className="space-y-6 font-sans">
        <PageHeader title="Hostel Notices" subtitle="Official announcements from administration" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((n) => (
            <Card key={n.id} className="p-5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-extrabold text-gray-800">{n.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">Published by {n.createdBy} • {api.formatDateTime(n.createdAt)}</p>
                </div>
                <StatusBadge tone="green">{n.targetAudience}</StatusBadge>
              </div>
              <p className="text-sm text-gray-600 mt-3 line-clamp-4 leading-relaxed">{n.content}</p>
              <Button className="mt-4 text-xs" variant="secondary" onClick={() => setModal({ type: "notice", data: n })}>Read Full Notice</Button>
            </Card>
          ))}
          {notices.length === 0 && <Card><EmptyState icon={<BellRing />} title="No notices active" /></Card>}
        </div>
        {renderModal()}
        <Toast toast={toast} />
      </div>
    );
  }

  return null;

  function renderModal() {
    if (!modal) return null;
    
    if (modal.type === "notice") {
      return (
        <Modal title={modal.data.title} onClose={() => setModal(null)} footer={<Button onClick={() => setModal(null)}>Close</Button>}>
          <p className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">{modal.data.content}</p>
        </Modal>
      );
    }
    
    if (modal.type === "leave") {
      return (
        <LeaveForm 
          initial={modal.data || { startDate: "", endDate: "", reason: "" }} 
          onClose={() => setModal(null)} 
          onSave={(form) => run(async () => { 
            await api.createLeave({ ...form, studentId: user.studentId, studentName: user.name }); 
            await api.sendNotification({ 
              title: "Leave request submitted", 
              message: `${user.name} (${user.studentId}) requested leave from ${form.startDate} to ${form.endDate}. Reason: ${form.reason || "N/A"}`, 
              targetAudience: "ADMIN", 
              receiverRole: "ADMIN",
              type: "Leave",
              priority: "High"
            }, user); 
            setModal(null); 
          }, "Leave application submitted successfully")} 
        />
      );
    }
    
    if (modal.type === "complaint") {
      return (
        <ComplaintForm 
          initial={modal.data || { type: "Maintenance", priority: "Medium", targetRecipient: "BOTH", description: "" }} 
          onClose={() => setModal(null)} 
          onSave={(form) => run(async () => { 
            await api.createComplaint({ ...form, studentId: user.studentId, studentName: user.name }); 
            const audience = form.targetRecipient === "ADMIN" ? "ADMIN" : form.targetRecipient === "EMPLOYEE" ? "EMPLOYEE" : "ALL_STAFF";
            await api.sendNotification({ 
              title: "New complaint submitted", 
              message: `${user.name} (${user.studentId}): [${form.type}] ${form.description}`, 
              targetAudience: audience, 
              receiverRole: form.targetRecipient !== "BOTH" ? form.targetRecipient : null,
              type: "Complaint", 
              priority: form.priority || "Medium" 
            }, user); 
            setModal(null); 
          }, "Complaint logged successfully")} 
        />
      );
    }
    
    return null;
  }
};

const DataTable = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-[10px] uppercase tracking-widest text-gray-500 bg-gray-50/80 border-b border-gray-100">
        <tr>{headers.map((h) => <th key={h} className="px-5 py-3 font-extrabold">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows && rows.length ? rows.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50/80 transition-colors">
            {row.map((cell, j) => <td key={j} className="px-5 py-3.5 align-middle">{cell}</td>)}
          </tr>
        )) : (
          <tr><td colSpan={headers.length}><EmptyState icon={<FileText />} /></td></tr>
        )}
      </tbody>
    </table>
  </div>
);

const LeaveForm = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState(initial);
  return (
    <Modal title="Apply For Hostel Leave" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Submit Application</Button></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Start Date"><TextInput type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></Field>
        <Field label="End Date"><TextInput type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></Field>
        <Field label="Reason for Leave"><TextArea rows={4} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason..." required /></Field>
      </div>
    </Modal>
  );
};

const ComplaintForm = ({ initial, onClose, onSave }) => {
  const [form, setForm] = useState(initial || { type: "Maintenance", priority: "Medium", targetRecipient: "BOTH", description: "" });
  return (
    <Modal title="Submit Service Complaint" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)}>Submit Complaint</Button></>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Complaint Category">
          <SelectInput value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="Maintenance">Maintenance / Electrical</option>
            <option value="Food">Food / Dining Service</option>
            <option value="Internet">Internet / Wi-Fi</option>
            <option value="Security">Security / Safety</option>
            <option value="Cleaning">Cleaning & Hygiene</option>
            <option value="Other">Other</option>
          </SelectInput>
        </Field>
        <Field label="Priority Level">
          <SelectInput value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </SelectInput>
        </Field>
        <Field label="Send Complaint To">
          <SelectInput value={form.targetRecipient || "BOTH"} onChange={(e) => setForm({ ...form, targetRecipient: e.target.value })}>
            <option value="BOTH">Both (Admin & Hostel Staff)</option>
            <option value="ADMIN">Admin Only</option>
            <option value="EMPLOYEE">Hostel Staff Only</option>
          </SelectInput>
        </Field>
        <Field label="Detailed Description"><TextArea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue..." required /></Field>
      </div>
    </Modal>
  );
};
