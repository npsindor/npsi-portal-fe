import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, Users, Calendar, XCircle, Loader2 } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import { base44 } from "@/api/base44Client";

export default function VerifyMember() {
  const { familyId } = useParams();
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const { family: found, members: familyMembers } = await base44.verifyFamily(familyId);
        if (cancelled) return;
        setFamily(found);
        setMembers(familyMembers || []);
      } catch (err) {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [familyId]);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gold/30 bg-card p-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-maroon" />
            <p className="text-sm text-muted-foreground">Verifying membership…</p>
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-16 text-center">
            <XCircle className="h-10 w-10 text-red-500" />
            <h1 className="font-display text-xl font-semibold text-red-700">Invalid or Unknown Membership</h1>
            <p className="text-sm text-red-600">No family found for ID <strong>{familyId}</strong>. This QR code may be invalid or the membership may have been revoked.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border-2 border-gold/50 shadow-lg">
            <div className="maroon-pass relative p-6 text-cream">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[0.65rem] uppercase tracking-[0.2em] text-gold/80">Nimar Patidar Sangathan, Indore</div>
                  <div className="font-display text-lg font-semibold text-gold">Verified Family Membership</div>
                </div>
                <ShieldCheck className="h-8 w-8 text-gold" />
              </div>
              <div className="mt-5">
                <div className="text-[0.6rem] uppercase tracking-[0.18em] text-cream/60">Family ID</div>
                <div className="font-display text-2xl font-bold tracking-wide text-gold">{family.familyId}</div>
                <div className="mt-1 text-sm text-cream/90">{family.familyName}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">Family Head</div>
                  <div className="font-medium text-cream">{family.headName || "—"}</div>
                </div>
                <div>
                  <div className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">Status</div>
                  <div className="inline-flex items-center gap-1 font-semibold text-green-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {family.status || "ACTIVE"}
                  </div>
                </div>
                <div>
                  <div className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">City</div>
                  <div className="font-medium text-cream">{family.city || "—"}</div>
                </div>
                <div>
                  <div className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">Registered</div>
                  <div className="flex items-center gap-1.5 font-medium text-cream">
                    <Calendar className="h-3.5 w-3.5 text-gold" />
                    {family.registrationDate ? new Date(family.registrationDate).toLocaleDateString("en-IN") : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-maroon">
                <Users className="h-4 w-4" />
                Family Members ({members.length})
              </div>
              <div className="space-y-2">
                {members.length === 0 && <p className="text-sm text-muted-foreground">No members on record.</p>}
                {members.map((m, i) => (
                  <div key={`${m.name}-${i}`} className="flex items-center justify-between rounded-xl border border-border bg-cream/60 px-4 py-2.5 text-sm">
                    <div>
                      <div className="font-medium text-maroon">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.relationship}{m.gender ? ` · ${m.gender}` : ""}</div>
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-green-700">{m.status || "ACTIVE"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
