import React from "react";
import { Settings as SettingsIcon, Shield, Bell, CreditCard, Globe, Database } from "lucide-react";
import { useLang } from "@/lib/i18n";

const L = {
  en: {
    title: "Settings",
    sub: "Platform configuration and system settings.",
    roles: "Roles & Permissions",
    rolesDesc: "Manage admin roles and access control",
    notifChannels: "Notification Channels",
    notifDesc: "Configure SMS, Email, WhatsApp, Push",
    payment: "Payment Gateway",
    paymentDesc: "Configure UPI, QR, and payment provider",
    cms: "CMS Pages & Menus",
    cmsDesc: "Manage public website content",
    system: "System Settings",
    systemDesc: "ID formats, retention, and configuration",
  },
  hi: {
    title: "सेटिंग्स",
    sub: "मंच विन्यास और सिस्टम सेटिंग्स।",
    roles: "भूमिकाएँ एवं अनुमतियाँ",
    rolesDesc: "एडमिन भूमिकाएँ और पहुँच नियंत्रण प्रबंधित करें",
    notifChannels: "सूचना चैनल",
    notifDesc: "SMS, ईमेल, WhatsApp, Push विन्यसित करें",
    payment: "भुगतान गेटवे",
    paymentDesc: "UPI, QR और भुगतान प्रदाता विन्यसित करें",
    cms: "CMS पेज एवं मेनू",
    cmsDesc: "सार्वजनिक वेबसाइट सामग्री प्रबंधित करें",
    system: "सिस्टम सेटिंग्स",
    systemDesc: "आईडी प्रारूप, प्रतिधारण और विन्यास",
  },
};

export default function AdminSettings() {
  const { lang } = useLang();
  const t = L[lang];
  const sections = [
    { icon: Shield, title: t.roles, desc: t.rolesDesc },
    { icon: Bell, title: t.notifChannels, desc: t.notifDesc },
    { icon: CreditCard, title: t.payment, desc: t.paymentDesc },
    { icon: Globe, title: t.cms, desc: t.cmsDesc },
    { icon: Database, title: t.system, desc: t.systemDesc },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-maroon">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gold/30 bg-card">
        {sections.map((s, i) => (
          <button key={s.title} className={`flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted ${i !== sections.length - 1 ? "border-b border-border" : ""}`}>
            <s.icon className="h-5 w-5 text-maroon" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </div>
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}