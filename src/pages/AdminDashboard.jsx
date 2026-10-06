import React, { useEffect, useState } from "react";
import { Users, FileCheck, CalendarDays, IndianRupee, TrendingUp, AlertCircle, Clock, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";

const L = {
  en: {
    title: "Dashboard",
    sub: "Overview of the Patidar Samaj Sangathan platform.",
    totalFamilies: "Total Families",
    totalMembers: "Total Members",
    pendingApps: "Pending Applications",
    activeMembers: "Active Members",
    upcomingEvents: "Upcoming Events",
    totalRevenue: "Total Revenue",
    pendingPayments: "Pending Payments",
    totalApps: "Total Applications",
    totalStudents: "Total Students",
    pendingStudentApps: "Pending Student Apps",
    recentApps: "Recent Applications",
    viewAll: "View all",
    noApps: "No applications yet.",
  },
  hi: {
    title: "डैशबोर्ड",
    sub: "पाटीदार समाज संगठन मंच का अवलोकन।",
    totalFamilies: "कुल परिवार",
    totalMembers: "कुल सदस्य",
    pendingApps: "प्रतीक्षारत आवेदन",
    activeMembers: "सक्रिय सदस्य",
    upcomingEvents: "आगामी कार्यक्रम",
    totalRevenue: "कुल आय",
    pendingPayments: "लंबित भुगतान",
    totalApps: "कुल आवेदन",
    totalStudents: "कुल स्टूडेंट",
    pendingStudentApps: "प्रतीक्षारत स्टूडेंट आवेदन",
    recentApps: "हाल के आवेदन",
    viewAll: "सभी देखें",
    noApps: "अभी कोई आवेदन नहीं।",
  },
};

export default function AdminDashboard() {
  const { lang } = useLang();
  const t = L[lang];
  const [stats, setStats] = useState({ families: 0, members: 0, pending: 0, active: 0, events: 0, revenue: 0, pendingPay: 0, regs: 0, students: 0, pendingStu: 0 });
  const [recentApps, setRecentApps] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [fams, mems, apps, evs, txns, stuApps, students] = await Promise.all([
          base44.entities.Family.listAll(),
          base44.entities.FamilyMember.listAll(),
          base44.entities.Application.list("-submittedDate", 5),
          base44.entities.Event.listAll(),
          base44.entities.Transaction.listAll(),
          base44.entities.StudentApplication.listAll(),
          base44.entities.Student.listAll(),
        ]);
        const activeMembers = mems.filter((m) => m.status === "ACTIVE").length;
        const pending = apps.filter((a) => a.status === "PENDING_VERIFICATION" || a.status === "SUBMITTED").length;
        const parseAmount = (value) => {
          const numeric = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
          return Number.isFinite(numeric) ? numeric : 0;
        };
        const revenue = txns.filter((tx) => tx.paymentStatus === "SUCCESS").reduce((s, tx) => s + parseAmount(tx.amount), 0);
        const pendingPay = txns.filter((tx) => tx.paymentStatus === "PENDING").length;
        setStats({
          families: fams.length,
          members: mems.length,
          pending,
          active: activeMembers,
          events: evs.filter((e) => e.status === "PUBLISHED").length,
          revenue,
          pendingPay,
          regs: apps.length,
          students: students.length,
          pendingStu: stuApps.filter((a) => a.status === "PENDING_VERIFICATION" || a.status === "SUBMITTED").length,
        });
        setRecentApps(apps);
      } catch (e) {}
    })();
  }, []);

  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  const kpis = [
    { label: t.totalFamilies, value: stats.families, icon: Users, color: "text-maroon", bg: "bg-maroon/10" },
    { label: t.totalMembers, value: stats.members, icon: Users, color: "text-maroon", bg: "bg-maroon/10" },
    { label: t.pendingApps, value: stats.pending, icon: FileCheck, color: "text-amber-600", bg: "bg-amber-50" },
    { label: t.activeMembers, value: stats.active, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: t.upcomingEvents, value: stats.events, icon: CalendarDays, color: "text-maroon", bg: "bg-maroon/10" },
    { label: t.totalRevenue, value: `₹${stats.revenue.toLocaleString(locale)}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
    { label: t.pendingPayments, value: stats.pendingPay, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: t.totalStudents, value: stats.students, icon: GraduationCap, color: "text-maroon", bg: "bg-maroon/10" },
    { label: t.pendingStudentApps, value: stats.pendingStu, icon: FileCheck, color: "text-amber-600", bg: "bg-amber-50" },
    { label: t.totalApps, value: stats.regs, icon: AlertCircle, color: "text-maroon", bg: "bg-maroon/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-maroon">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-gold/30 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${k.bg}`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
            </div>
            <div className="mt-3 font-display text-2xl font-bold text-foreground">{k.value}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gold/30 bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-maroon">{t.recentApps}</h2>
          <Link to="/admin/applications" className="text-xs font-semibold text-maroon hover:underline">{t.viewAll} →</Link>
        </div>
        <div className="mt-4 space-y-2">
          {recentApps.map((a) => (
            <Link key={a.id} to="/admin/applications" className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted">
              <div>
                <div className="text-sm font-semibold text-foreground">{a.applicationId}</div>
                <div className="text-xs text-muted-foreground">{a.familyHeadName} · {a.familyName}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                a.status === "APPROVED" ? "bg-green-100 text-green-800" :
                a.status === "REJECTED" ? "bg-red-100 text-red-800" :
                a.status === "CORRECTION_REQUIRED" ? "bg-orange-100 text-orange-800" :
                "bg-amber-100 text-amber-800"
              }`}>{a.status.replace(/_/g, " ")}</span>
            </Link>
          ))}
          {recentApps.length === 0 && <p className="text-sm text-muted-foreground">{t.noApps}</p>}
        </div>
      </div>
    </div>
  );
}