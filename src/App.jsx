import React, { useState, useEffect, Component } from "react";
import { Login } from "./components/Login";
import { DashboardLayout } from "./components/DashboardLayout";
import { StudentView } from "./components/StudentView";
import { AdminView } from "./components/AdminView";
import { EmployeeView } from "./components/EmployeeView";
import { AboutUsView } from "./components/AboutUsView";
import { SettingsView } from "./components/SettingsView";
import { UserRole } from "./types";

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-600 text-sm mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [guestViewingAbout, setGuestViewingAbout] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("hostel_user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        localStorage.removeItem("hostel_user");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineModal(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineModal(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLogin = (loggedInUser) => {
    if (!loggedInUser) return;
    setActivePage("dashboard");
    setUser(loggedInUser);
    try {
      localStorage.setItem("hostel_user", JSON.stringify(loggedInUser));
    } catch (e) {
      console.error("Failed to save user:", e);
    }
    setGuestViewingAbout(false);
  };

  const handleLogout = () => {
    setUser(null);
    setActivePage("dashboard");
    try {
      localStorage.removeItem("hostel_user");
    } catch (e) {
      console.error("Failed to remove user:", e);
    }
    setGuestViewingAbout(false);
  };

  const handleNavigate = (page) => {
    if (page === "login") {
      setGuestViewingAbout(false);
    } else {
      setActivePage(page);
    }
  };

  const renderPage = () => {
    if (!user) return null;

    try {
      switch (activePage) {
        case "settings":
          return (
            <SettingsView 
              user={user} 
              onNavigate={handleNavigate} 
              onUpdateUser={(updatedUser) => {
                setUser(updatedUser);
                try {
                  localStorage.setItem("hostel_user", JSON.stringify(updatedUser));
                } catch (e) {}
              }} 
            />
          );
        case "about":
          return <AboutUsView onNavigate={handleNavigate} isGuest={false} />;
        default:
          if (user.role === UserRole.STUDENT) {
            return <StudentView user={user} activePage={activePage} onNavigate={handleNavigate} />;
          }
          if (user.role === UserRole.ADMIN) {
            return <AdminView activePage={activePage} onNavigate={handleNavigate} user={user} />;
          }
          if (user.role === UserRole.EMPLOYEE) {
            return <EmployeeView activePage={activePage} onNavigate={handleNavigate} user={user} />;
          }
          return null;
      }
    } catch (error) {
      console.error("Error rendering page:", error);
      return (
        <div className="p-8 text-center">
          <p className="text-red-600 font-bold mb-4">Error loading page: {error.message}</p>
          <button 
            onClick={() => handleNavigate("dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold text-sm">Loading Hostel Hub...</p>
        </div>
      </div>
    );
  }

  if (showOfflineModal && !isOnline) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Internet Connection</h2>
          <p className="text-slate-600 text-xs mb-6">
            Please check your network connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (guestViewingAbout) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-12 font-sans">
        <div className="max-w-5xl mx-auto">
          <AboutUsView onNavigate={() => setGuestViewingAbout(false)} isGuest={true} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Login onLogin={handleLogin} onShowAbout={() => setGuestViewingAbout(true)} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardLayout
        user={user}
        onLogout={handleLogout}
        activePage={activePage}
        onNavigate={handleNavigate}
      >
        {renderPage()}
      </DashboardLayout>
    </ErrorBoundary>
  );
}
