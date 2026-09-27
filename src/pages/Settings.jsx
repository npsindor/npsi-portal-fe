import React, { useEffect, useState } from "react";
import { Bell, Shield, Globe, HelpCircle, FileText, Info, LogOut, ChevronRight, Camera, MessageSquare, KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import LanguageToggle from "@/components/LanguageToggle";
import MembershipPass from "@/components/MembershipPass";
import { useT } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const { user, logout, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const t = useT();
  const [uploading, setUploading] = useState(false);
  const [family, setFamily] = useState(null);
  const [loadingFam, setLoadingFam] = useState(true);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdError, setPwdError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { family: mine } = await base44.me.family();
        setFamily(mine);
      } catch (e) {
      } finally {
        setLoadingFam(false);
      }
    })();
  }, [user]);

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.auth.updateMe({ photo_url: file_url });
      await checkUserAuth();
      toast({ title: t("settings.photoUpdated") });
    } catch (err) {
      toast({ title: t("settings.uploadFailed"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setPwdError("");
    // Read the actual DOM values via FormData as a fallback: browser/OS
    // password managers sometimes fill these fields directly without firing
    // React's onChange, leaving pwdForm state empty even though the inputs
    // visibly show a value.
    const formValues = new FormData(e.currentTarget);
    const currentPassword = String(formValues.get("currentPassword") || pwdForm.currentPassword || "");
    const newPassword = String(formValues.get("newPassword") || pwdForm.newPassword || "");
    const confirmPassword = String(formValues.get("confirmPassword") || pwdForm.confirmPassword || "");
    if (newPassword.length < 6) {
      setPwdError(t("auth.pwdMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError(t("auth.pwdNoMatch"));
      return;
    }
    setPwdSaving(true);
    try {
      await base44.auth.changePassword({ currentPassword, newPassword });
      toast({ title: t("settings.pwdUpdated") });
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwdOpen(false);
    } catch (err) {
      setPwdError(err.message || t("settings.pwdUpdateFailed"));
    } finally {
      setPwdSaving(false);
    }
  };

  const name = family?.head_name || user?.full_name || "Member";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sections = [
    { icon: Bell, label: t("settings.notifications"), desc: t("settings.notificationsDesc") },
    { icon: HelpCircle, label: t("settings.help"), desc: t("settings.helpDesc") },
    { icon: FileText, label: t("settings.terms"), desc: t("settings.termsDesc") },
    { icon: FileText, label: t("settings.privacy"), desc: t("settings.privacyDesc") },
    { icon: Info, label: t("settings.about"), desc: t("settings.aboutDesc") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-maroon">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.sub")}</p>
      </div>

      {/* Profile card with photo upload */}
      <div className="rounded-2xl border border-gold/30 bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.photo_url ? (
              <img src={user.photo_url} alt={name} className="h-20 w-20 rounded-full border-2 border-gold/60 object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/60 bg-maroon text-xl font-semibold text-gold">
                {initials || "M"}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-cream bg-maroon text-gold shadow hover:bg-maroon-dark">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} disabled={uploading} />
            </label>
          </div>
          <div className="flex-1">
            <div className="font-display text-lg font-semibold text-foreground">{name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            {uploading && <div className="mt-1 text-xs text-maroon">{t("settings.uploading")}</div>}
          </div>
        </div>
      </div>

      {/* Family membership card */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4 text-maroon" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-maroon">{t("settings.familyInfo")}</h2>
        </div>
        {loadingFam ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-gold/30 bg-card">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" />
          </div>
        ) : family ? (
          <MembershipPass family={family} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t("settings.noFamily")}
          </div>
        )}
      </div>

      {/* Feedback shortcut */}
      <Link to="/portal/feedback" className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-card px-5 py-4 hover:bg-gold/5">
        <MessageSquare className="h-5 w-5 text-maroon" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">{t("portal.feedback")}</div>
          <div className="text-xs text-muted-foreground">{t("fb.title")} →</div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Change password */}
      <Dialog open={pwdOpen} onOpenChange={(open) => { setPwdOpen(open); if (!open) { setPwdError(""); setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); } }}>
        <DialogTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-2xl border border-gold/30 bg-card px-5 py-4 hover:bg-gold/5">
            <KeyRound className="h-5 w-5 text-maroon" />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-foreground">{t("settings.changePassword")}</div>
              <div className="text-xs text-muted-foreground">{t("settings.changePasswordDesc")}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.changePassword")}</DialogTitle>
          </DialogHeader>
          {pwdError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{pwdError}</div>
          )}
          <form onSubmit={submitPasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("settings.currentPassword")}</Label>
              <PasswordInput
                id="currentPassword"
                name="currentPassword"
                autoComplete="current-password"
                required
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                autoComplete="new-password"
                required
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirm")}</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full h-12 font-medium" disabled={pwdSaving}>
              {pwdSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("auth.resetting")}
                </>
              ) : (
                t("settings.changePassword")
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Standard settings rows */}
      <div className="overflow-hidden rounded-2xl border border-gold/30 bg-card">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Globe className="h-5 w-5 text-maroon" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">{t("settings.language")}</div>
            <div className="text-xs text-muted-foreground">{t("settings.languageDesc")}</div>
          </div>
          <LanguageToggle />
        </div>
        {sections.map((s, i) => (
          <button
            key={s.label}
            className={`flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted ${
              i !== sections.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <s.icon className="h-5 w-5 text-maroon" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        {t("settings.version")}: 1.0.0
      </div>

      <button
        onClick={async () => {
          await logout();
          navigate("/");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-destructive/30 py-3 text-sm font-semibold text-destructive hover:bg-destructive/5"
      >
        <LogOut className="h-4 w-4" /> {t("portal.logout")}
      </button>
    </div>
  );
}