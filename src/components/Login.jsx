import React, { useState } from "react";
import { ArrowRight, BadgeCheck, Camera, Eye, EyeOff, Info, Lock, LogIn, Upload, UserCircle, UserPlus } from "lucide-react";
import { UserRole } from "../types";
import { isSupabaseConfigured, supabase } from "../supabaseClient";
import { Button } from "./ui";
import { mapUser, sendNotification, listUsers } from "../services/hostelService";

const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const Login = ({ onLogin, onShowAbout }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState(UserRole.STUDENT);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);
  const [reg, setReg] = useState({ name: "", id: "", department: "", hostel: "Hostel A", room: "", password: "", confirm: "", avatar: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return setError("Profile photo must be less than 5MB.");
      }
      const reader = new FileReader();
      reader.onload = () => {
        setReg((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    const cleanId = loginId.trim();
    const cleanPass = loginPass.trim();

    // 1. Check ID based on role
    if (role === UserRole.STUDENT) {
      if (!/^\d{9}$/.test(cleanId)) {
        return setError("Student ID must contain exactly 9 numeric digits.");
      }
    } else {
      if (!cleanId) {
        return setError(`Please enter your ${role === UserRole.ADMIN ? "Admin" : "Employee"} ID, username, or email.`);
      }
    }

    // 2. Password length check
    if (cleanPass.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setIsLoading(true);

    try {
      // First check Supabase DB if configured
      if (isSupabaseConfigured && supabase) {
        let matchedUser = null;
        
        const { data: userRecords, error: queryError } = await supabase
          .from("users")
          .select("*");

        if (!queryError && userRecords) {
          const cleanLower = cleanId.toLowerCase();
          matchedUser = userRecords.find((u) => {
            if (u.role !== role) return false;
            
            const email = (u.email || "").toLowerCase();
            const studentId = (u.student_id || u.studentId || "").toLowerCase();
            const employeeId = (u.employee_id || u.employeeId || "").toLowerCase();
            const username = (u.username || "").toLowerCase();
            const name = (u.name || "").toLowerCase();
            const uId = (u.id || "").toLowerCase();

            if (role === UserRole.STUDENT) {
              return studentId === cleanLower || email === cleanLower;
            }

            if (
              email === cleanLower ||
              studentId === cleanLower ||
              employeeId === cleanLower ||
              username === cleanLower ||
              uId === cleanLower ||
              name === cleanLower
            ) {
              return true;
            }

            if (role === UserRole.ADMIN && (cleanLower === "admin" || cleanLower === "admin@green.edu.bd" || cleanLower === "chief warden")) return true;
            if (role === UserRole.EMPLOYEE && (cleanLower === "staff" || cleanLower === "employee" || cleanLower === "warden")) return true;

            return false;
          });
        }

        if (matchedUser) {
          const passwordHash = await sha256(cleanPass);
          const isPasswordValid = matchedUser.password_hash 
            ? (matchedUser.password_hash === passwordHash || matchedUser.password === cleanPass)
            : (matchedUser.password === cleanPass || matchedUser.password === passwordHash);

          if (isPasswordValid) {
            if (matchedUser.role === UserRole.STUDENT && !matchedUser.is_approved) {
              setIsLoading(false);
              return setError("Your account is pending admin approval.");
            }
            if (matchedUser.is_active === false) {
              setIsLoading(false);
              return setError("Your account has been deactivated / discharged. Please contact admin.");
            }
            await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", matchedUser.id);
            setIsLoading(false);
            return onLogin(mapUser(matchedUser));
          }
        }
      }

      // Check local storage users database
      const allUsers = await listUsers();
      const cleanLower = cleanId.toLowerCase();

      const matchedUser = allUsers.find((u) => {
        if (u.role !== role) return false;

        const email = (u.email || "").toLowerCase();
        const studentId = (u.studentId || u.student_id || "").toLowerCase();
        const employeeId = (u.employeeId || u.employee_id || "").toLowerCase();
        const username = (u.username || "").toLowerCase();
        const name = (u.name || "").toLowerCase();
        const uId = (u.id || "").toLowerCase();

        if (role === UserRole.STUDENT) {
          return studentId === cleanLower || email === cleanLower;
        }

        if (
          email === cleanLower ||
          studentId === cleanLower ||
          employeeId === cleanLower ||
          username === cleanLower ||
          uId === cleanLower ||
          name === cleanLower
        ) {
          return true;
        }

        if (role === UserRole.ADMIN && (cleanLower === "admin" || cleanLower === "admin@green.edu.bd" || cleanLower === "chief warden")) return true;
        if (role === UserRole.EMPLOYEE && (cleanLower === "staff" || cleanLower === "employee" || cleanLower === "warden")) return true;

        return false;
      });

      if (matchedUser) {
        const passwordHash = await sha256(cleanPass);
        const isPasswordValid = matchedUser.password_hash 
          ? (matchedUser.password_hash === passwordHash || matchedUser.password === cleanPass)
          : (matchedUser.password === cleanPass || matchedUser.password === passwordHash);

        if (isPasswordValid) {
          if (matchedUser.role === UserRole.STUDENT && !matchedUser.isApproved) {
            setIsLoading(false);
            return setError("Your account is pending admin approval.");
          }
          if (matchedUser.isActive === false) {
            setIsLoading(false);
            return setError("Your account has been deactivated / discharged. Please contact admin.");
          }
          setIsLoading(false);
          return onLogin(mapUser(matchedUser));
        }
      }

      setIsLoading(false);
      return setError(
        role === UserRole.STUDENT
          ? "Invalid Student ID or password. Please check your credentials."
          : `Invalid ${role === UserRole.ADMIN ? "Admin" : "Employee"} credential or password. Match strictly with database.`
      );
    } catch (err) {
      console.error("Login error:", err);
      setIsLoading(false);
      return setError("An error occurred during login. Please try again.");
    }
  };

  const handleRegistrationSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const cleanRegId = reg.id.trim();
    const cleanRegPass = reg.password.trim();

    if (!/^\d{9}$/.test(cleanRegId)) {
      return setError("Student ID must contain exactly 9 numeric digits.");
    }

    if (cleanRegPass !== reg.confirm.trim()) {
      return setError("Passwords do not match.");
    }

    if (cleanRegPass.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setIsLoading(true);

    const avatar = reg.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reg.name)}&background=2563eb&color=fff`;

    try {
      if (isSupabaseConfigured && supabase) {
        const { error: insertError } = await supabase.from("users").insert([{ 
          name: reg.name.trim(), 
          email: `${cleanRegId}@green.edu.bd`, 
          password_hash: await sha256(cleanRegPass), 
          password: cleanRegPass,
          role: UserRole.STUDENT, 
          student_id: cleanRegId, 
          department: reg.department, 
          hostel_block: reg.hostel, 
          room_no: reg.room.trim(), 
          avatar, 
          is_approved: false, 
          is_active: true 
        }]).select().single();
        
        if (insertError) {
          setIsLoading(false);
          return setError(insertError.code === "23505" ? "An account with this Student ID already exists." : insertError.message);
        }
      } else {
        // Local storage user creation
        const users = JSON.parse(localStorage.getItem("mealport_users") || "[]");
        if (users.some((u) => u.student_id === cleanRegId || u.studentId === cleanRegId)) {
          setIsLoading(false);
          return setError("An account with this Student ID already exists.");
        }
        users.push({
          id: `usr-student-${cleanRegId}`,
          name: reg.name.trim(),
          student_id: cleanRegId,
          studentId: cleanRegId,
          email: `${cleanRegId}@green.edu.bd`,
          password: cleanRegPass,
          password_hash: await sha256(cleanRegPass),
          role: UserRole.STUDENT,
          department: reg.department,
          hostel_block: reg.hostel,
          hostelBlock: reg.hostel,
          room_no: reg.room.trim(),
          roomNumber: reg.room.trim(),
          is_approved: false,
          isApproved: false,
          is_active: true,
          isActive: true,
          avatar
        });
        localStorage.setItem("mealport_users", JSON.stringify(users));
      }

      await sendNotification(
        { title: "New student approval required", message: `${reg.name} (${cleanRegId}) submitted a hostel admission request.`, targetAudience: "ADMINS", type: "Approval", priority: "High" },
        { name: "System" }
      ).catch(() => null);

      setIsLoading(false);
      setNotice("Registration request submitted! An admin will review and approve your account shortly.");
      setIsRegistering(false);
      setReg({ name: "", id: "", department: "", hostel: "Hostel A", room: "", password: "", confirm: "", avatar: "" });
    } catch (err) {
      console.error("Registration error:", err);
      setIsLoading(false);
      setError("Failed to register. Please try again.");
    }
  };

  const inputClass = "w-full bg-slate-50/80 border border-slate-200/90 rounded-xl px-4 py-3.5 text-slate-800 text-sm outline-none focus:border-[#006837] focus:bg-white focus:ring-2 focus:ring-[#006837]/20 transition-all font-normal";

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#01321d] via-[#023e23] to-[#0d2a4a] flex items-center justify-center p-4 md:p-10 font-sans">
      <div className="bg-white rounded-3xl border border-emerald-900/30 shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden min-h-[660px]">
        {/* Left Dark Side */}
        <div className="md:w-[42%] bg-[#030a10] text-white flex flex-col justify-between p-8 md:p-12 relative">
          <div>
            <div className="w-40 h-40 bg-white rounded-3xl p-5 flex items-center justify-center shadow-lg mb-8">
              <img 
                src="/GUB_Logo.png" 
                alt="Green University Logo" 
                referrerPolicy="no-referrer" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Green University<br />Hostel Service Hub
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Production-ready hostel ERP for meals, leave, complaints, finance, notices, visitor logs, movement tracking, and staff operations.
            </p>
          </div>

          <div className="space-y-3 pt-6">
            <button 
              type="button" 
              onClick={onShowAbout} 
              className="bg-[#0e1720] hover:bg-[#182430] text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl border border-slate-800/80 flex items-center gap-2.5 transition-all cursor-pointer w-full"
            >
              <Info className="w-4 h-4 text-slate-400" />
              Learn About Us
            </button>
            <div className="bg-[#0e1720]/80 text-emerald-400 text-xs font-medium px-4 py-3 rounded-xl border border-slate-800/80 flex items-center gap-2.5">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              Secure role-based management portal
            </div>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="md:w-[58%] p-8 md:p-14 bg-white flex flex-col justify-between">
          <div>
            {(role === UserRole.STUDENT || isRegistering) && (
              <div className="flex justify-end mb-8">
                <button 
                  type="button"
                  onClick={() => { setIsRegistering(!isRegistering); setError(null); setNotice(null); }} 
                  className="bg-[#e8f5e9] text-[#006837] font-bold text-xs px-5 py-2.5 rounded-full hover:bg-[#d8edd9] transition-all cursor-pointer"
                >
                  {isRegistering ? "Already registered? Login" : "New Student? Apply Now"}
                </button>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <span className="text-[#006837] font-black text-xl">➔</span>
                {isRegistering ? "Student Admission Request" : `${role === UserRole.ADMIN ? "Admin" : role === UserRole.EMPLOYEE ? "Staff" : "Student"} Portal Login`}
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-1.5 font-medium">
                {isRegistering 
                  ? "Fill in your details to apply for hostel accommodation." 
                  : role === UserRole.STUDENT
                  ? "Enter your 9-digit Student ID and password to access the ERP."
                  : `Enter your ${role === UserRole.ADMIN ? "Admin" : "Employee"} ID, username, or email and password to log in.`}
              </p>
            </div>

            {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</div>}
            {notice && <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">{notice}</div>}

            {isRegistering ? (
              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                {/* Photo Upload from Device */}
                <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/90 flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 border-2 border-[#006837]/30 flex-shrink-0 flex items-center justify-center shadow-xs">
                    {reg.avatar ? (
                      <img src={reg.avatar} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Profile Photo (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="reg-photo-upload"
                        className="cursor-pointer inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#006837]" />
                        {reg.avatar ? "Change Photo" : "Upload from Device"}
                      </label>
                      {reg.avatar && (
                        <button
                          type="button"
                          onClick={() => setReg((prev) => ({ ...prev, avatar: "" }))}
                          className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      id="reg-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleRegPhotoChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required className={inputClass} placeholder="Full name" value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} />
                  <input 
                    required 
                    maxLength={9}
                    className={inputClass} 
                    placeholder="Student ID (9 digits e.g. 202100001)" 
                    value={reg.id} 
                    onChange={(e) => setReg({ ...reg, id: e.target.value.replace(/\D/g, "") })} 
                  />
                </div>
                <select required className={inputClass} value={reg.department} onChange={(e) => setReg({ ...reg, department: e.target.value })}>
                  <option value="">Select Department</option>
                  <option value="CSE">CSE (Computer Science)</option>
                  <option value="EEE">EEE (Electrical)</option>
                  <option value="BBA">BBA (Business)</option>
                  <option value="English">English</option>
                  <option value="Law">Law</option>
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select className={inputClass} value={reg.hostel} onChange={(e) => setReg({ ...reg, hostel: e.target.value })}>
                    <option value="Hostel A">Hostel A</option>
                    <option value="Hostel B">Hostel B</option>
                    <option value="Hostel C">Hostel C</option>
                    <option value="Hostel A-NX">Hostel A-NX</option>
                  </select>
                  <input required className={inputClass} placeholder="Preferred Room (e.g. 302)" value={reg.room} onChange={(e) => setReg({ ...reg, room: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <input 
                      required 
                      type={showRegPass ? "text" : "password"} 
                      className={`${inputClass} pr-10`} 
                      placeholder="Password (min 6 chars)" 
                      value={reg.password} 
                      onChange={(e) => setReg({ ...reg, password: e.target.value })} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowRegPass(!showRegPass)} 
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      required 
                      type={showRegConfirmPass ? "text" : "password"} 
                      className={`${inputClass} pr-10`} 
                      placeholder="Confirm password" 
                      value={reg.confirm} 
                      onChange={(e) => setReg({ ...reg, confirm: e.target.value })} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowRegConfirmPass(!showRegConfirmPass)} 
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-[#006837] hover:bg-[#00522b] text-white font-bold py-4 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-[#006837]/20 text-sm mt-3"
                >
                  {isLoading ? "Submitting..." : "Submit Admission Request"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                {/* Role Tabs */}
                <div className="bg-slate-100/80 p-1.5 rounded-2xl flex border border-slate-200/50 mb-7">
                  <button 
                    type="button" 
                    onClick={() => { setRole(UserRole.STUDENT); setIsRegistering(false); setError(null); }} 
                    className={`flex-1 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${role === UserRole.STUDENT ? "bg-white text-[#006837] shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Student
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setRole(UserRole.EMPLOYEE); setIsRegistering(false); setError(null); }} 
                    className={`flex-1 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${role === UserRole.EMPLOYEE ? "bg-white text-[#006837] shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Employee
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setRole(UserRole.ADMIN); setIsRegistering(false); setError(null); }} 
                    className={`flex-1 py-3 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${role === UserRole.ADMIN ? "bg-white text-[#006837] shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Admin
                  </button>
                </div>

                <label className="block">
                  <span className="text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2.5">
                    <UserCircle className="w-4 h-4 text-[#006837]" /> 
                    {role === UserRole.ADMIN 
                      ? "Admin ID / Email / Username" 
                      : role === UserRole.EMPLOYEE 
                      ? "Employee ID / Email / Username" 
                      : "Student ID (9 digits)"}
                  </span>
                  <input 
                    required 
                    maxLength={role === UserRole.STUDENT ? 9 : 100}
                    className={inputClass} 
                    placeholder={
                      role === UserRole.ADMIN 
                        ? "e.g. admin, admin@green.edu.bd, or 900000001" 
                        : role === UserRole.EMPLOYEE 
                        ? "e.g. staff, staff@green.edu.bd, or 100000001" 
                        : "202100001"
                    }
                    value={loginId} 
                    onChange={(e) => {
                      if (role === UserRole.STUDENT) {
                        setLoginId(e.target.value.replace(/\D/g, ""));
                      } else {
                        setLoginId(e.target.value);
                      }
                    }} 
                  />
                </label>

                <label className="block relative">
                  <span className="text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2.5">
                    <Lock className="w-4 h-4 text-[#006837]" /> Password
                  </span>
                  <div className="relative">
                    <input 
                      required 
                      type={showLoginPass ? "text" : "password"} 
                      className={`${inputClass} pr-10`} 
                      placeholder="••••••••" 
                      value={loginPass} 
                      onChange={(e) => setLoginPass(e.target.value)} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowLoginPass(!showLoginPass)} 
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </label>

                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-[#006837] hover:bg-[#00522b] text-white font-bold py-4 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-[#006837]/20 text-sm mt-6 flex items-center justify-center gap-2"
                >
                  {isLoading ? "Signing in..." : <>Login to Portal <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
