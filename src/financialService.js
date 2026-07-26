export const SEAT_RENT = 4500;
export const CANCELLATION_CUTOFF_MINUTES = 30;

export const MEAL_WINDOWS = {
  Breakfast: { start: 8, end: 11, cost: 30, displayStart: "08:00 AM", cutoffDisplay: "07:30 AM" },
  Lunch: { start: 13, end: 18, cost: 60, displayStart: "01:00 PM", cutoffDisplay: "12:30 PM" },
  Dinner: { start: 19, end: 23, cost: 50, displayStart: "07:00 PM", cutoffDisplay: "06:30 PM" }
};

export const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const toIsoDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const toDisplayDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
};

export const formatDateTime = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

export const getMonthKey = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const getMonthLabel = (monthKey) => {
  if (!monthKey) return "";
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return "";
  return `${monthNames[month - 1] || ""} ${year}`;
};

export const parseDateOnly = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const getMealStartTime = (date, type) => {
  const mealWindow = MEAL_WINDOWS[type];
  if (!mealWindow || !date) return null;
  const mealDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  mealDate.setHours(mealWindow.start, 0, 0, 0);
  return mealDate;
};

export const getMealDeadline = (date, type) => {
  const mealStart = getMealStartTime(date, type);
  if (!mealStart) return null;
  return new Date(mealStart.getTime() - CANCELLATION_CUTOFF_MINUTES * 60 * 1000);
};

export const isStudentOnApprovedLeave = (dateStrOrObj, leaveRequests = []) => {
  if (!dateStrOrObj) return false;
  const isoDate = typeof dateStrOrObj === "string" ? dateStrOrObj : toIsoDate(dateStrOrObj);
  return leaveRequests.some((leave) => {
    if (leave.status !== "Approved") return false;
    return isoDate >= leave.startDate && isoDate <= leave.endDate;
  });
};

export const isMealCutoffPassed = (dateStrOrObj, type, now = new Date()) => {
  const d = typeof dateStrOrObj === "string" ? parseDateOnly(dateStrOrObj) : dateStrOrObj;
  if (!d) return false;
  
  const mealDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (mealDate.getTime() < todayDate.getTime()) return true; // Past date
  if (mealDate.getTime() > todayDate.getTime()) return false; // Future date
  
  // Same date - check 30 minutes cutoff before start time
  const deadline = getMealDeadline(mealDate, type);
  return deadline ? now >= deadline : false;
};

// Internal helper to calculate monthly breakdown
const buildMonthStatement = ({ monthKey, studentId, meals = [], leaveRequests = [], payments = [], now = new Date() }) => {
  const [year, monthNum] = monthKey.split("-").map(Number);
  const monthName = monthNames[monthNum - 1] || "";
  const monthLabel = `${monthName} ${year}`;
  
  const startOfMonth = new Date(year, monthNum - 1, 1);
  const endOfMonth = new Date(year, monthNum, 0);

  let mealCharges = 0;
  let completedMealsCount = 0;

  // Filter meals that belong to this month
  meals.forEach((meal) => {
    const mealDate = parseDateOnly(meal.date);
    if (!mealDate) return;
    if (mealDate.getFullYear() === year && mealDate.getMonth() + 1 === monthNum) {
      const isCancelled = meal.status === "Cancelled";
      const onLeave = isStudentOnApprovedLeave(meal.date, leaveRequests);
      
      if (!isCancelled && !onLeave) {
        // If meal is explicitly in DB or completed/passed cutoff
        const cutoffPassed = isMealCutoffPassed(meal.date, meal.type, now);
        if (cutoffPassed || meal.status === "Served" || meal.status === "Active") {
          const cost = Number(meal.cost || MEAL_WINDOWS[meal.type]?.cost || 0);
          mealCharges += cost;
          completedMealsCount += 1;
        }
      }
    }
  });

  const seatRent = SEAT_RENT;
  const additionalCharges = 0;
  const discount = 0;
  const totalBill = seatRent + mealCharges + additionalCharges - discount;

  // Payments for this billing period or invoice date in this month
  const monthPayments = payments.filter((p) => {
    if (p.studentId && p.studentId !== studentId) return false;
    const pDate = parseDateOnly(p.invoiceDate) || new Date(p.createdAt || p.paidAt || now);
    const pMonthKey = getMonthKey(pDate);
    return (p.billingPeriod && p.billingPeriod.toLowerCase().includes(monthName.toLowerCase())) || pMonthKey === monthKey;
  });

  const paidAmount = monthPayments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);
  const balance = Math.max(0, totalBill - paidAmount);
  
  let status = "Pending";
  if (balance <= 0 && totalBill > 0) status = "Paid";
  else if (paidAmount > 0 && balance > 0) status = "Partial";
  else if (totalBill === 0) status = "Paid";

  const receiptNo = monthPayments.find((p) => p.receiptNo)?.receiptNo || `RCP-${year}${String(monthNum).padStart(2, "0")}-${studentId.slice(-4) || "1001"}`;
  const paymentDate = monthPayments.find((p) => p.paidAt || p.invoiceDate)?.invoiceDate || toIsoDate(now);

  return {
    id: `bill-${monthKey}-${studentId}`,
    studentId,
    monthKey,
    month: monthLabel,
    monthName,
    year,
    seatRent,
    mealCharges,
    additionalCharges,
    discount,
    totalBill,
    paidAmount,
    balance,
    remainingDue: balance,
    status,
    completedMealsCount,
    receiptNo,
    paymentDate,
    payments: monthPayments
  };
};

export const buildFinancialSnapshot = ({ studentId, student, meals = [], leaveRequests = [], payments = [], now = new Date() }) => {
  const currentMonthKey = getMonthKey(now);
  
  // Collect all months that should exist for this student
  const monthKeysSet = new Set([currentMonthKey]);
  
  // Discover historical months from meals, payments, and leaves
  meals.forEach((m) => {
    const d = parseDateOnly(m.date);
    if (d) monthKeysSet.add(getMonthKey(d));
  });
  payments.forEach((p) => {
    const d = parseDateOnly(p.invoiceDate);
    if (d) monthKeysSet.add(getMonthKey(d));
  });

  const sortedMonthKeys = Array.from(monthKeysSet).sort();
  const firstMonthKey = sortedMonthKeys[0] || currentMonthKey;
  const [firstYear, firstMonthNum] = firstMonthKey.split("-").map(Number);
  
  // Generate contiguous list of month keys from first month to current month
  const allContiguousMonthKeys = [];
  for (let d = new Date(firstYear, firstMonthNum - 1, 1); getMonthKey(d) <= currentMonthKey; d.setMonth(d.getMonth() + 1)) {
    allContiguousMonthKeys.push(getMonthKey(d));
  }

  // Build monthly statements
  const statements = allContiguousMonthKeys.map((mk) =>
    buildMonthStatement({
      monthKey: mk,
      studentId: studentId || student?.studentId || "",
      meals,
      leaveRequests,
      payments,
      now
    })
  );

  // Formula Calculations:
  // 1. Total Bill = Sum of every monthly bill generated since student joined
  const totalBill = statements.reduce((sum, s) => sum + s.totalBill, 0);

  // 2. Total Paid = Sum of all confirmed payments made by the student
  const studentPayments = payments.filter((p) => !studentId || p.studentId === studentId);
  const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);

  // 3. Balance Due = Total Bill - Total Paid
  const balanceDue = Math.max(0, totalBill - totalPaid);

  // 4. Current Month Fee = Running bill for the current month (Seat Rent 4500 + completed meals in current month + additional)
  const currentStatement = statements.find((s) => s.monthKey === currentMonthKey) || statements[statements.length - 1];
  const currentMonthFee = currentStatement ? currentStatement.totalBill : SEAT_RENT;

  return {
    totalBill,
    totalPaid,
    balanceDue,
    totalOutstanding: balanceDue,
    currentMonthFee,
    currentStatement,
    statements: statements.sort((a, b) => b.monthKey.localeCompare(a.monthKey)),
    payments: studentPayments
  };
};
