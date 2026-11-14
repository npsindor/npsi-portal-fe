import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, GraduationCap, KeyRound, LayoutDashboard, LogOut, Shield, UserRound } from 'lucide-react';
import { STUDENT_REGISTRATION_PATH } from '@/lib/student-flow';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { usePublicCopy } from '@/lib/public-copy';

const initialsOf = name => String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || '?';

// Signed-in account button for the public header: photo/initials, first name, and a menu
// with the portal, profile, change password and logout.
export default function UserMenu() {
  const c = usePublicCopy();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [photoFailed, setPhotoFailed] = useState(false);
  const name = user?.fullName || user?.email || '';
  const firstName = String(name).split(/[\s@]/)[0];
  const isAdmin = user?.role === 'admin';
  const item = 'flex min-h-10 cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm';
  const signOut = async () => {
    await logout();
    navigate('/');
  };
  const avatar = size => (user?.photoUrl && !photoFailed
    ? <img src={user.photoUrl} alt="" onError={() => setPhotoFailed(true)} className={`${size} shrink-0 rounded-full border border-gold/60 object-cover`} />
    : <span aria-hidden="true" className={`${size} flex shrink-0 items-center justify-center rounded-full bg-maroon text-xs font-semibold text-cream`}>{initialsOf(name)}</span>);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`${c('Account menu')}: ${name}`} className="flex min-h-11 max-w-[11rem] items-center gap-2 rounded-full border border-border bg-card p-1 text-sm sm:pr-2.5 font-medium text-foreground transition-colors hover:border-gold/60 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold data-[state=open]:border-gold/60">
          {avatar('h-9 w-9 sm:h-8 sm:w-8')}
          <span className="hidden min-w-0 truncate sm:inline">{firstName}</span>
          <ChevronDown aria-hidden="true" className="hidden h-4 w-4 shrink-0 sm:block text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2 font-normal">
          {avatar('h-10 w-10')}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{user?.fullName || firstName}</span>
            {user?.email && <span className="block truncate text-xs text-muted-foreground">{user.email}</span>}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className={item}>
          <Link to={isAdmin ? '/admin' : '/portal'}>{isAdmin ? <Shield className="h-4 w-4 text-maroon" /> : <LayoutDashboard className="h-4 w-4 text-maroon" />}{c(isAdmin ? 'Admin Panel' : 'My Portal')}</Link>
        </DropdownMenuItem>
        {!isAdmin && (
          <DropdownMenuItem asChild className={item}>
            <Link to={STUDENT_REGISTRATION_PATH}><GraduationCap className="h-4 w-4 text-maroon" />{c('Student Registration')}</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className={item}>
          <Link to="/portal/settings"><UserRound className="h-4 w-4 text-maroon" />{c('Profile')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={item}>
          <Link to="/portal/settings?changePassword=1"><KeyRound className="h-4 w-4 text-maroon" />{c('Change Password')}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className={`${item} text-destructive focus:text-destructive`}>
          <LogOut className="h-4 w-4" />{c('Logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
