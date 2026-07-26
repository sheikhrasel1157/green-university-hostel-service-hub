import React from "react";
import { Info, Code, Github, Mail, ExternalLink, ArrowLeft, Heart, GraduationCap, Facebook } from "lucide-react";

export const AboutUsView = ({ onNavigate, isGuest = false }) => {
  const handleBack = () => {
    if (isGuest) {
      onNavigate("login");
    } else {
      onNavigate("dashboard");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="flex items-center gap-4">
        <button onClick={handleBack} className="p-2 bg-white rounded-lg border border-slate-200 hover:text-blue-600 transition-colors shadow-xs cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">About Us</h2>
      </div>

      {/* GUB Hostel Info Section */}
      <section className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 bg-slate-900 p-8 flex flex-col justify-center items-center text-white text-center">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-4 overflow-hidden p-2 shadow-lg">
              <img src="/GUB_Logo.png" alt="GUB Logo" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-2xl font-bold">GUB Hostel</h3>
            <p className="text-sm opacity-80 mt-2">A home away from home</p>
          </div>
          <div className="md:w-2/3 p-8">
            <h4 className="text-xl font-bold text-slate-800 mb-4">Our Commitment</h4>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Green University of Bangladesh (GUB) provides high-quality residential facilities for its students at the Permanent Campus. Our hostels are meticulously designed to provide a safe, secure, and conducive environment that fosters academic excellence and personal growth.
              </p>
              <p>
                With 24/7 CCTV surveillance, high-speed Wi-Fi, spacious common rooms, and hygienic dining services, we strive to make every student's stay comfortable. This digital hub is part of our ongoing effort to automate operations and provide seamless services to our residential community.
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                <a href="https://www.green.edu.bd/hostel" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-bold text-blue-600 hover:underline">
                  Official Website <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer & Team Leader Section */}
      <section className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Code className="w-6 h-6 text-blue-600" /> Team Leader & Lead Developer
          </h3>
        </div>
        <div className="p-8 md:flex gap-12 items-center">
          <div className="md:w-1/3 mb-8 md:mb-0">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <img
                src="/Rasel_Sheikh.png"
                alt="Rasel Sheikh"
                referrerPolicy="no-referrer"
                className="relative w-full aspect-square rounded-full object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                <Heart className="w-5 h-5 fill-current" />
              </div>
            </div>
          </div>
          <div className="md:w-2/3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <h4 className="text-3xl font-extrabold text-slate-800">Rasel Sheikh</h4>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                Team Leader & Lead Developer
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-500 mb-6 font-medium">
              <GraduationCap className="w-5 h-5" />
              <span>B.Sc. in CSE Student, Green University of Bangladesh</span>
            </div>

            <div className="space-y-4 text-slate-600 text-lg leading-relaxed">
              <p>
                Hello! I am <span className="font-bold text-slate-900">Rasel Sheikh</span>, a passionate Computer Science and Engineering student at GUB. I am deeply interested in building modern web applications that solve real-world problems.
              </p>
              <p>
                As the primary architect of the <span className="font-bold">Green University Hostel Service Hub</span>, I focused on creating a user-friendly interface that simplifies complex operations like meal management and leave applications. My goal is to leverage technology to enhance the campus lifestyle for all my fellow students.
              </p>
              <p className="text-sm italic text-slate-500">
                "Driven by curiosity and fueled by coffee, I believe in writing clean code and building experiences that matter."
              </p>
            </div>

            <div className="flex gap-4 mt-8">
              <a
                href="https://github.com/sheikhrasel1157"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-black/10 hover:-translate-y-1"
                title="GitHub Profile"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/sheikh.rasel.996173"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 hover:-translate-y-1"
                title="Facebook Profile"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="mailto:sheikh177679@gmail.com"
                className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/10 hover:-translate-y-1"
                title="Send Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" /> Team Members
          </h3>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Member 1: Rafi */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
            <img
              src="/Rafi.png"
              alt="Rafi"
              referrerPolicy="no-referrer"
              className="w-28 h-28 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-xl font-bold text-slate-800">Rafi</h4>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Team Member
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-3">B.Sc. in CSE Student, GUB</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dedicated team member contributing to frontend design, layout responsiveness, and user experience enhancements across the Hostel Hub.
              </p>
            </div>
          </div>

          {/* Member 2: Nibir */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:shadow-md transition-all">
            <img
              src="/Nibir.png"
              alt="Nibir"
              referrerPolicy="no-referrer"
              className="w-28 h-28 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-xl font-bold text-slate-800">Nibir</h4>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Team Member
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-3">B.Sc. in CSE Student, GUB</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dedicated team member contributing to database module logic, data verification, and testing for the Hostel Hub system.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 text-slate-400 text-sm">
        <p>© 2026 Green University Hostel Service Hub. Built with ❤️ for Green University.</p>
      </footer>
    </div>
  );
};
