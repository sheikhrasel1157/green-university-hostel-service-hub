import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, BellRing, CalendarDays, ClipboardList, FileText, Home, LogOut, Menu, Settings, Users, Utensils, X, Info } from "lucide-react";
import { listNotificationsForUser, markAllNotificationsRead, markNotificationRead, subscribeToNotifications, formatDateTime } from "../services/hostelService";

export const DashboardLayout = ({ user, children, onLogout, activePage, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const loadNotifications = async () => {
    try { 
      setNotifications(await listNotificationsForUser(user)); 
    } catch { 
      setNotifications([]); 
    }
  };

  useEffect(() => { 
    loadNotifications(); 
    const off = subscribeToNotifications(user, loadNotifications); 
    return off; 
  }, [user.id, user.role, user.studentId]);

  const unread = useMemo(() => notifications.filter((item) => !item.isRead), [notifications]);

  const openNotification = async (notif) => { 
    setSelectedNotification(notif); 
    if (!notif.isRead) { 
      await markNotificationRead(notif.id).catch(() => null); 
      await loadNotifications(); 
    } 
  };

  const readAll = async () => { 
    await markAllNotificationsRead(unread.map((n) => n.id)).catch(() => null); 
    await loadNotifications(); 
  };

  const go = (page) => { 
    onNavigate(page); 
    setSidebarOpen(false); 
  };

  const nav = [{ id: "dashboard", icon: Home, label: "Dashboard" }];
  if (user.role === "STUDENT") {
    nav.push(
      { id: "meals", icon: Utensils, label: "Meal Manager" },
      { id: "leave", icon: CalendarDays, label: "Leave Applications" },
      { id: "fees", icon: FileText, label: "Fee History" },
      { id: "complaints", icon: AlertCircle, label: "Complaints" },
      { id: "notices", icon: BellRing, label: "Notices" },
      { id: "notifications", icon: Bell, label: "Notifications" }
    );
  } else if (user.role === "ADMIN") {
    nav.push(
      { id: "students", icon: Users, label: "Students" },
      { id: "rooms", icon: Home, label: "Rooms" },
      { id: "meals", icon: Utensils, label: "Meals" },
      { id: "staff", icon: ClipboardList, label: "Employees & Tasks" },
      { id: "reports", icon: FileText, label: "Finance & Reports" },
      { id: "notices", icon: BellRing, label: "Notices" },
      { id: "notifications", icon: Bell, label: "Notifications" }
    );
  } else if (user.role === "EMPLOYEE") {
    nav.push(
      { id: "operations", icon: ClipboardList, label: "Operations" },
      { id: "attendance", icon: Users, label: "Visitor & Exit Desk" },
      { id: "students", icon: Users, label: "Student Management" },
      { id: "notices", icon: BellRing, label: "Notices" },
      { id: "notifications", icon: Bell, label: "Notifications" }
    );
  }

  const NavItem = ({ item }) => (
    <button 
      onClick={() => go(item.id)} 
      className={`flex items-center w-full px-3.5 py-3 rounded-xl transition-all cursor-pointer text-sm font-semibold ${
        activePage === item.id 
          ? "bg-blue-50 text-blue-700 font-bold shadow-2xs" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      <item.icon className={`w-5 h-5 mr-3 ${activePage === item.id ? "text-blue-600" : "text-slate-400"}`} />
      {item.label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {sidebarOpen && (
        <button 
          aria-label="Close sidebar" 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-xs" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}`}>
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <img 
              src="/GUB_Logo.png" 
              alt="Green University Hostel Logo" 
              referrerPolicy="no-referrer" 
              className="w-10 h-10 rounded-xl p-0.5 bg-white object-contain border border-slate-200 shadow-xs" 
            />
            <div>
              <span className="text-base font-bold text-slate-800 tracking-tight block leading-tight">Green Hostel</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Service Hub</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {nav.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </nav>

          {/* Bottom Sidebar Controls */}
          <div className="p-4 border-t border-slate-100 space-y-1">
            <button 
              onClick={() => go("settings")} 
              className={`flex items-center px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 w-full rounded-xl hover:bg-slate-100 cursor-pointer transition-colors ${activePage === "settings" ? "bg-blue-50 text-blue-700 font-bold" : ""}`}
            >
              <Settings className="w-5 h-5 mr-3 text-slate-400" />
              Settings
            </button>
            <button 
              onClick={onLogout} 
              className="flex items-center px-3.5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 w-full rounded-xl cursor-pointer transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-6 md:px-8 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-xl cursor-pointer">
              <Menu className="w-6 h-6" />
            </button>
            <img 
              src="/GUB_Logo.png" 
              alt="Hostel Logo" 
              referrerPolicy="no-referrer" 
              className="w-9 h-9 rounded-xl p-0.5 bg-white object-contain border border-slate-200 shadow-xs md:hidden" 
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 capitalize tracking-tight">{activePage.replace("-", " ")}</h1>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">Green University Hostel Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl cursor-pointer transition-colors border border-slate-100"
              >
                <Bell className="w-5 h-5" />
                {unread.length > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-1">
                    {unread.length > 9 ? "9+" : unread.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-14 w-80 md:w-96 max-w-[90vw] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                    <div className="flex items-center gap-3">
                      {unread.length > 0 && (
                        <button onClick={readAll} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
                          MARK ALL READ
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-semibold">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button 
                          key={notif.id} 
                          onClick={() => openNotification(notif)} 
                          className={`w-full text-left p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? "bg-blue-50/60" : ""}`}
                        >
                          <div className="flex gap-3 items-start">
                            <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!notif.isRead ? "bg-blue-600" : "bg-slate-300"}`} />
                            <div>
                              <p className="font-bold text-xs text-slate-800">{notif.title}</p>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(notif.createdAt)}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Info */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{user.role}</p>
              </div>
              <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs bg-slate-200" />
            </div>
          </div>
        </header>

        {/* Content View Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

      {/* Detail Notification Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[90] bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-blue-600">{selectedNotification.priority} • {selectedNotification.type}</p>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedNotification.title}</h3>
              </div>
              <button onClick={() => setSelectedNotification(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mt-4 whitespace-pre-line">{selectedNotification.message}</p>
            <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p><b>Sender:</b> {selectedNotification.senderName}</p>
              <p><b>Date:</b> {formatDateTime(selectedNotification.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
