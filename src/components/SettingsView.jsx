import React, { useState } from "react";
import { AlertTriangle, ArrowLeft, Camera, Eye, EyeOff, Lock, LogOut, Save, Upload, User as UserIcon } from "lucide-react";
import { Button, Card, Field, PageHeader, TextArea, TextInput, Toast } from "./ui";
import { supabase } from "../supabaseClient";
import { updateUser, createDischargeRequest, todayIso } from "../services/hostelService";

const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const SettingsView = ({ user, onNavigate, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [profile, setProfile] = useState({ 
    phone: user?.phone || "", 
    emergencyContact: user?.emergencyContact || "",
    avatar: user?.avatar || ""
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [dischargeReq, setDischargeReq] = useState({ reason: "", requestedDate: todayIso(), remarks: "" });
  
  const notify = (message, type = "success") => { 
    setToast({ message, type }); 
    setTimeout(() => setToast(null), 3500); 
  };
  
  const run = async (fn, success) => { 
    setLoading(true); 
    try { 
      await fn(); 
      notify(success); 
    } catch (error) { 
      notify(error.message || "An error occurred", "error"); 
    } 
    setLoading(false); 
  };
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return notify("Profile picture must be under 5MB", "error");
      }
      const reader = new FileReader();
      reader.onload = () => {
        setProfile((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = (e) => { 
    e.preventDefault(); 
    run(async () => {
      const updated = await updateUser(user.id, profile);
      const mergedUser = updated || { ...user, ...profile };
      if (onUpdateUser) {
        onUpdateUser(mergedUser);
      }
    }, "Profile updated successfully"); 
  };
  
  const changePassword = (e) => { 
    e.preventDefault(); 
    if (passwords.next !== passwords.confirm) return notify("New passwords do not match", "error"); 
    if (passwords.next.length < 6) return notify("Password must be at least 6 characters", "error"); 
    
    run(async () => { 
      if (supabase) {
        const { data, error } = await supabase.from("users").select("password,password_hash").eq("id", user.id).single(); 
        if (error) throw error; 
        const currentHash = await sha256(passwords.current); 
        if (data.password_hash ? data.password_hash !== currentHash : data.password !== passwords.current) throw new Error("Current password is incorrect"); 
        const { error: updateError } = await supabase.from("users").update({ password_hash: await sha256(passwords.next), password: null }).eq("id", user.id); 
        if (updateError) throw updateError; 
      }
      setPasswords({ current: "", next: "", confirm: "" }); 
    }, "Password updated successfully"); 
  };
  
  const submitDischarge = (e) => {
    e.preventDefault();
    if (!dischargeReq.reason.trim()) return notify("Please provide a reason for discharge", "error");
    run(async () => {
      await createDischargeRequest({
        studentId: user.studentId,
        studentName: user.name,
        reason: dischargeReq.reason,
        requestedDate: dischargeReq.requestedDate,
        remarks: dischargeReq.remarks
      });
      setDischargeReq({ reason: "", requestedDate: todayIso(), remarks: "" });
    }, "Discharge request submitted to Hostel Administrator");
  };
  
  const tabClass = (id) => `flex-1 px-4 py-3 font-bold text-xs md:text-sm transition-colors cursor-pointer ${activeTab === id ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30 font-bold" : "text-gray-500 hover:text-gray-700"}`;
  
  return (
    <div className="space-y-6 font-sans">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your personal profile, account security, and hostel preferences" 
        actions={<Button variant="secondary" onClick={() => onNavigate("dashboard")}><ArrowLeft className="w-4 h-4" /> Back to Dashboard</Button>} 
      />
      <Card className="overflow-hidden">
        <div className="flex border-b">
          <button className={tabClass("profile")} onClick={() => setActiveTab("profile")}>
            <UserIcon className="w-4 h-4 inline mr-2" /> Personal Info
          </button>
          <button className={tabClass("password")} onClick={() => setActiveTab("password")}>
            <Lock className="w-4 h-4 inline mr-2" /> Security
          </button>
          {user?.role === "STUDENT" && (
            <button className={tabClass("discharge")} onClick={() => setActiveTab("discharge")}>
              <LogOut className="w-4 h-4 inline mr-2 text-red-600" /> Discharge Request
            </button>
          )}
        </div>
        <div className="p-6">
          {activeTab === "profile" && (
            <form onSubmit={updateProfile} className="space-y-5 max-w-xl">
              {/* Profile Photo Uploader */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50/90 rounded-2xl border border-slate-200">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 border-2 border-emerald-600/30 shadow-xs flex-shrink-0">
                  <img src={profile.avatar || user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">Profile Picture</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Upload a photo from your device (PNG, JPG, max 5MB)</p>
                  <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                    <label
                      htmlFor="settings-photo-upload"
                      className="cursor-pointer inline-flex items-center gap-1.5 bg-[#006837] hover:bg-[#00522b] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Choose Photo from Device
                    </label>
                    {profile.avatar && profile.avatar !== user?.avatar && (
                      <button
                        type="button"
                        onClick={() => setProfile((prev) => ({ ...prev, avatar: user?.avatar || "" }))}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 cursor-pointer"
                      >
                        Reset Photo
                      </button>
                    )}
                  </div>
                  <input
                    id="settings-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 text-xs md:text-sm space-y-1 text-gray-700 border border-gray-200">
                <p><b>Name:</b> {user?.name}</p>
                <p><b>ID / Email:</b> {user?.studentId || user?.email}</p>
                <p><b>Current Room:</b> {user?.hostelBlock} - Room {user?.roomNumber}</p>
                <p><b>Department:</b> {user?.department || "N/A"}</p>
              </div>
              <Field label="Phone Number">
                <TextInput value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+880 1700 000000" />
              </Field>
              <Field label="Emergency Contact">
                <TextInput value={profile.emergencyContact} onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })} placeholder="+880 1800 000000" />
              </Field>
              <Button type="submit" disabled={loading}><Save className="w-4 h-4" /> Save Profile</Button>
            </form>
          )}
          
          {activeTab === "password" && (
            <form onSubmit={changePassword} className="space-y-5 max-w-xl">
              <Field label="Current Password">
                <div className="relative">
                  <TextInput 
                    type={showCurrent ? "text" : "password"} 
                    value={passwords.current} 
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} 
                    required 
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrent(!showCurrent)} 
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="New Password">
                <div className="relative">
                  <TextInput 
                    type={showNext ? "text" : "password"} 
                    value={passwords.next} 
                    onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} 
                    required 
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNext(!showNext)} 
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm New Password">
                <div className="relative">
                  <TextInput 
                    type={showConfirm ? "text" : "password"} 
                    value={passwords.confirm} 
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} 
                    required 
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(!showConfirm)} 
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Button type="submit" disabled={loading}><Lock className="w-4 h-4" /> Update Password</Button>
            </form>
          )}
          
          {activeTab === "discharge" && user?.role === "STUDENT" && (
            <form onSubmit={submitDischarge} className="space-y-5 max-w-xl">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 leading-relaxed">
                <b>Hostel Discharge Request:</b> Submitting a discharge request will notify the Hostel Administrator for review. Once approved, your room allocation will be released and account set to discharged status. All your past financial receipts and history will remain permanently preserved.
              </div>
              <Field label="Reason for Discharge">
                <TextArea 
                  rows={4} 
                  value={dischargeReq.reason} 
                  onChange={(e) => setDischargeReq({ ...dischargeReq, reason: e.target.value })} 
                  placeholder="State your reason for leaving the hostel (e.g. Graduation, Moving out, Semester break)..." 
                  required 
                />
              </Field>
              <Field label="Requested Discharge Date">
                <TextInput 
                  type="date" 
                  value={dischargeReq.requestedDate} 
                  onChange={(e) => setDischargeReq({ ...dischargeReq, requestedDate: e.target.value })} 
                  required 
                />
              </Field>
              <Field label="Optional Remarks">
                <TextInput 
                  value={dischargeReq.remarks} 
                  onChange={(e) => setDischargeReq({ ...dischargeReq, remarks: e.target.value })} 
                  placeholder="Additional notes for warden..." 
                />
              </Field>
              <Button type="submit" variant="danger" disabled={loading}>
                <LogOut className="w-4 h-4" /> Submit Discharge Request
              </Button>
            </form>
          )}
        </div>
      </Card>
      <Toast toast={toast} />
    </div>
  );
};
