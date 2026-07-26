import React, { useRef, useState } from "react";
import { Download, Printer, CheckCircle, Building, FileText, X, ShieldCheck } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button, Modal } from "./ui";

export const ReceiptModal = ({ receipt, student, onClose }) => {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!receipt) return null;

  const billingPeriod = receipt.billingPeriod || receipt.month || "Current Month";
  const receiptNo = receipt.receiptNo || receipt.receipt_no || `RCP-${Date.now().toString().slice(-6)}`;
  const invoiceDate = receipt.invoiceDate || receipt.paidAt || receipt.createdAt || new Date().toISOString().slice(0, 10);
  
  const seatRent = Number(receipt.seatRent ?? 4500);
  const mealCharges = Number(receipt.mealCharges ?? (receipt.totalBill ? receipt.totalBill - seatRent : 0));
  const additionalCharges = Number(receipt.additionalCharges ?? 0);
  const discount = Number(receipt.discount ?? 0);
  const totalBill = Number(receipt.totalBill ?? (seatRent + mealCharges + additionalCharges - discount));
  const paidAmount = Number(receipt.paidAmount ?? totalBill);
  const balance = Math.max(0, totalBill - paidAmount);
  const status = receipt.status || (balance <= 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending");

  const studentName = student?.name || receipt.studentName || "Student";
  const studentId = student?.studentId || receipt.studentId || "20210000";
  const department = student?.department || "Computer Science & Engineering";
  const hostelBlock = student?.hostelBlock || "Block A";
  const roomNo = student?.roomNumber || "302";
  const confirmedBy = receipt.confirmedBy || "Hostel Accounts Dept";
  const paymentMethod = receipt.paymentMethod || "Online / Bank Transfer";

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Hostel_Fee_Receipt_${receiptNo}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      title="Official Hostel Fee Receipt"
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Digitally Verified ERP Document
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handlePrint} className="text-xs">
              <Printer className="w-4 h-4" /> Print Receipt
            </Button>
            <Button onClick={handleDownloadPdf} disabled={downloading} className="text-xs bg-emerald-700 hover:bg-emerald-800">
              <Download className="w-4 h-4" /> {downloading ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-2 sm:p-4 bg-gray-50/50 rounded-2xl border border-gray-200">
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-xs text-gray-800 font-sans space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-emerald-800 pb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                GUB
              </div>
              <div>
                <h1 className="text-lg font-black text-emerald-900 tracking-tight uppercase">
                  Green University of Bangladesh
                </h1>
                <p className="text-xs font-bold text-gray-600">Hostel Management & Service Hub</p>
                <p className="text-[11px] text-gray-500">City Campus, Dhaka • Official ERP Fee Receipt</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider mb-1">
                {status === "Paid" ? "CONFIRMED RECEIPT" : "MONTHLY STATEMENT"}
              </span>
              <p className="text-xs font-extrabold text-gray-800">Receipt No: <span className="font-mono text-emerald-700">{receiptNo}</span></p>
              <p className="text-xs text-gray-500">Date: {invoiceDate}</p>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Student Name</p>
              <p className="font-bold text-gray-800 mt-0.5">{studentName}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Student ID</p>
              <p className="font-mono font-bold text-gray-800 mt-0.5">{studentId}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Department</p>
              <p className="font-semibold text-gray-800 mt-0.5">{department}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Hostel & Room</p>
              <p className="font-semibold text-gray-800 mt-0.5">{hostelBlock} - Room {roomNo}</p>
            </div>
          </div>

          {/* Billing Period Title */}
          <div className="flex items-center justify-between bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-200">
            <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">
              Billing Period: {billingPeriod}
            </span>
            <span className="text-xs font-bold text-emerald-800">
              Payment Method: {paymentMethod}
            </span>
          </div>

          {/* Charges Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 font-extrabold text-gray-700">
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-gray-800">Hostel Seat Rent</p>
                    <p className="text-[11px] text-gray-500">Standard monthly room accommodation fee</p>
                  </td>
                  <td className="p-3 text-right font-bold text-gray-800">৳{seatRent.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-gray-800">Completed Meal Charges</p>
                    <p className="text-[11px] text-gray-500">Actual served/completed meals in {billingPeriod}</p>
                  </td>
                  <td className="p-3 text-right font-bold text-gray-800">৳{mealCharges.toLocaleString()}</td>
                </tr>
                {additionalCharges > 0 && (
                  <tr>
                    <td className="p-3">
                      <p className="font-bold text-gray-800">Additional Service / Maintenance Charges</p>
                    </td>
                    <td className="p-3 text-right font-bold text-gray-800">৳{additionalCharges.toLocaleString()}</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr className="text-emerald-700">
                    <td className="p-3">
                      <p className="font-bold">Discount Applied</p>
                    </td>
                    <td className="p-3 text-right font-bold">-৳{discount.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-black border-t-2 border-gray-300 text-sm">
                  <td className="p-3 text-gray-800">TOTAL MONTHLY BILL</td>
                  <td className="p-3 text-right text-emerald-800">৳{totalBill.toLocaleString()}</td>
                </tr>
                <tr className="bg-emerald-50 text-emerald-900 font-bold border-t border-emerald-200">
                  <td className="p-3">Total Amount Paid (Confirmed)</td>
                  <td className="p-3 text-right font-black">৳{paidAmount.toLocaleString()}</td>
                </tr>
                <tr className="bg-white font-extrabold text-gray-700 border-t border-gray-200">
                  <td className="p-3">Remaining Balance Due</td>
                  <td className={`p-3 text-right ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    ৳{balance.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Signatures */}
          <div className="pt-6 border-t border-gray-200 flex justify-between items-end text-xs">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Confirmation</p>
              <p className="font-extrabold text-gray-800 mt-1">Confirmed By: {confirmedBy}</p>
              <p className="text-gray-500 text-[11px]">System Time: {invoiceDate}</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-gray-400 mb-1" />
              <p className="text-[10px] font-bold text-gray-500 uppercase">Accounts Officer Signature</p>
              <p className="text-[9px] text-emerald-800 font-bold">Green University Hostel ERP</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
