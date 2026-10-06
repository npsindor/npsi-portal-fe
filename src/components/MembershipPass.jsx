import React from "react";
import { QrCode, Users, Calendar, ShieldCheck } from "lucide-react";

export default function MembershipPass({ family, onFlip }) {
  return (
    <div className="maroon-pass relative overflow-hidden rounded-2xl border-2 border-gold/60 p-5 text-cream shadow-xl">
      {/* decorative corner */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-gold/20" />
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full border border-gold/10" />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.2em] text-gold/80">Patidar Samaj Sangathan</div>
          <div className="font-display text-lg font-semibold text-gold">Family Membership Pass</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-maroon-dark">
          <span className="font-display text-base font-semibold text-gold">P</span>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="text-[0.6rem] uppercase tracking-[0.18em] text-cream/60">Family ID</div>
        <div className="font-display text-2xl font-bold tracking-wide text-gold">{family?.familyId || "—"}</div>
        <div className="mt-1 text-sm text-cream/90">{family?.familyName}</div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">Family Head</div>
          <div className="font-medium text-cream">{family?.headName}</div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">Members</div>
          <div className="flex items-center gap-1.5 font-medium text-cream">
            <Users className="h-3.5 w-3.5 text-gold" />
            {family?.memberCount || 0}
          </div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">Status</div>
          <div className="inline-flex items-center gap-1 font-semibold text-green-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            {family?.status || "ACTIVE"}
          </div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">Registered</div>
          <div className="flex items-center gap-1.5 font-medium text-cream">
            <Calendar className="h-3.5 w-3.5 text-gold" />
            {family?.registrationDate ? new Date(family.registrationDate).toLocaleDateString("en-IN") : "—"}
          </div>
        </div>
      </div>

      {onFlip && (
        <button
          onClick={onFlip}
          className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/10 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
        >
          <QrCode className="h-4 w-4" />
          View Digital Membership Card
        </button>
      )}
    </div>
  );
}