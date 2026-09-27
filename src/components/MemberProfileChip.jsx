import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

export default function MemberProfileChip({ compact = false, variant = "chip" }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.full_name || "Member");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user?.email) return;
      try {
        const { family: mine } = await base44.me.family();
        if (active && mine?.head_name) {
          setDisplayName(mine.head_name);
          return;
        }
      } catch (e) {
      } finally {
        if (active && !displayName) setDisplayName(user?.full_name || "Member");
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const name = displayName || user?.full_name || "Member";
  const firstName = name.split(" ").filter(Boolean)[0] || "Member";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (variant === "sidebar") {
    return (
      <div className="flex items-center gap-2.5">
        {user?.photo_url ? (
          <img src={user.photo_url} alt={firstName} className="h-9 w-9 rounded-full border-2 border-gold/60 object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gold/60 bg-maroon text-xs font-semibold text-gold">
            {initials || "M"}
          </div>
        )}
        <div className="text-sm font-semibold leading-tight text-maroon">{firstName}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {!compact && (
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-semibold text-maroon">{name}</div>
          <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{user?.email}</div>
        </div>
      )}
      <div className="relative">
        {user?.photo_url ? (
          <img src={user.photo_url} alt={name} className="h-10 w-10 rounded-full border-2 border-gold/60 object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold/60 bg-maroon text-sm font-semibold text-gold">
            {initials || "M"}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-cream bg-green-500" />
      </div>
    </div>
  );
}