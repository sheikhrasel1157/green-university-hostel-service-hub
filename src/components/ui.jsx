import React from "react";
import { Loader2, AlertTriangle, CheckCircle, X } from "lucide-react";

export const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 cursor-pointer",
    danger: "bg-red-600 text-white hover:bg-red-700 cursor-pointer",
    warning: "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer",
    dark: "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 cursor-pointer"
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant] || styles.primary} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-3xl border border-slate-200 shadow-xs ${className}`}>{children}</div>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatCard = ({ title, value, icon, tone = "green", note }) => {
  const colorMap = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-slate-200 text-slate-700",
  };
  const colorClass = colorMap[tone] || colorMap.green;
  
  return (
    <div className="bg-slate-100 rounded-3xl p-6 flex flex-col justify-between border border-slate-200/80">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">{value}</h3>
          {note && <p className="text-xs text-slate-500 mt-2 font-medium">{note}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${colorClass}`}>{icon}</div>
      </div>
    </div>
  );
};

export const EmptyState = ({ icon, title = "No records found", subtitle }) => (
  <div className="text-center py-16 text-slate-400">
    <div className="mx-auto mb-3 w-fit opacity-40">{icon}</div>
    <p className="font-bold text-slate-600">{title}</p>
    {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
  </div>
);

export const LoadingState = ({ label = "Loading data..." }) => (
  <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
    <span className="font-semibold text-sm">{label}</span>
  </div>
);

export const StatusBadge = ({ children, tone = "gray" }) => {
  const colorMap = {
    green: "bg-green-100 text-green-700 border border-green-200/60",
    red: "bg-red-100 text-red-700 border border-red-200/60",
    orange: "bg-orange-100 text-orange-700 border border-orange-200/60",
    blue: "bg-blue-100 text-blue-700 border border-blue-200/60",
    purple: "bg-purple-100 text-purple-700 border border-purple-200/60",
    gray: "bg-slate-100 text-slate-700 border border-slate-200",
    yellow: "bg-amber-100 text-amber-700 border border-amber-200/60",
  };
  const colorClass = colorMap[tone] || colorMap.gray;
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
      {children}
    </span>
  );
};

export const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</span>
    {children}
  </label>
);

export const TextInput = (props) => (
  <input
    {...props}
    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${props.className || ""}`}
  />
);

export const SelectInput = (props) => (
  <select
    {...props}
    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${props.className || ""}`}
  />
);

export const TextArea = (props) => (
  <textarea
    {...props}
    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${props.className || ""}`}
  />
);

export const Modal = ({ title, children, onClose, footer }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-6">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
      {footer && <div className="border-t border-slate-100 bg-slate-50 p-6 rounded-b-3xl flex justify-end gap-3">{footer}</div>}
    </div>
  </div>
);

export const Toast = ({ toast }) => toast ? (
  <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold shadow-2xl ${toast.type === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}>
    {toast.type === "error" ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5 text-green-400" />}
    {toast.message}
  </div>
) : null;

export const confirmAction = (message) => window.confirm(message);
