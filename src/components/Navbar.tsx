import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  Volume2,
  VolumeX,
  ChefHat,
  User,
  LogOut,
  Flame,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Heart,
  ReceiptText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { sound } from '../utils/sound.ts';

interface NavbarProps {
  currentTab: 'menu' | 'active-orders' | 'history' | 'wishlist' | 'staff-orders' | 'staff-menu' | 'staff-analytics';
  setCurrentTab: (tab: any) => void;
  staffMode: boolean;
  setStaffMode: (enabled: boolean) => void;
  wishlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  staffMode,
  setStaffMode,
  wishlistCount,
}) => {
  const { user, dbUser, role, switchRole, signInWithGoogle, signOut } = useAuth();
  const { totalItems, subtotal, setIsOpen } = useCart();
  const [time, setTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const handleRoleToggle = async () => {
    if (staffMode) {
      setStaffMode(false);
      setCurrentTab('menu');
      await switchRole('student');
    } else {
      setStaffMode(true);
      setCurrentTab('staff-orders');
      await switchRole('staff');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
      {/* Top micro banner: Canteen status & Peak hours */}
      <div className="bg-emerald-900 text-emerald-100 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Canteen Kitchen Open • Pickup Slots: 12:00-14:00 & 18:00-20:00
          </span>
          <span className="hidden md:inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-amber-500/30">
            <Flame className="w-3 h-3 text-amber-400" />
            Peak Lunch Hours: 12:15 - 13:30 (Prep +5-10m)
          </span>
        </div>

        <div className="flex items-center gap-4 text-emerald-200">
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <Clock className="w-3 h-3" />
            {time}
          </div>
          <button
            onClick={toggleMute}
            className="hover:text-white transition flex items-center gap-1 text-[11px]"
            title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-300" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-300" />}
            <span className="hidden sm:inline">{isMuted ? 'Sound Off' : 'Sound On'}</span>
          </button>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (staffMode) {
                  setCurrentTab('staff-orders');
                } else {
                  setCurrentTab('menu');
                }
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-gray-900">
                    Quick<span className="text-emerald-600">Bite</span>
                  </span>
                  <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                    {staffMode ? 'Kitchen Ops' : 'Canteen'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Smart Pre-Order System</p>
              </div>
            </button>
          </div>

          {/* Central Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl text-sm font-medium">
            {!staffMode ? (
              <>
                <button
                  onClick={() => setCurrentTab('menu')}
                  className={`px-3.5 py-1.5 rounded-lg transition ${
                    currentTab === 'menu'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Menu & Order
                </button>
                <button
                  onClick={() => setCurrentTab('active-orders')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    currentTab === 'active-orders'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>Active Tracking</span>
                </button>
                <button
                  onClick={() => setCurrentTab('history')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    currentTab === 'history'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ReceiptText className="w-4 h-4" />
                  Past Orders
                </button>
                <button
                  onClick={() => setCurrentTab('wishlist')}
                  className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    currentTab === 'wishlist'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  Saved {wishlistCount > 0 && `(${wishlistCount})`}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentTab('staff-orders')}
                  className={`px-3.5 py-1.5 rounded-lg transition ${
                    currentTab === 'staff-orders'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Kitchen Orders
                </button>
                <button
                  onClick={() => setCurrentTab('staff-menu')}
                  className={`px-3.5 py-1.5 rounded-lg transition ${
                    currentTab === 'staff-menu'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Manage Menu
                </button>
                <button
                  onClick={() => setCurrentTab('staff-analytics')}
                  className={`px-3.5 py-1.5 rounded-lg transition ${
                    currentTab === 'staff-analytics'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics & Reports
                </button>
              </>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            {/* Quick Kitchen / Student View Mode Switcher */}
            <button
              onClick={handleRoleToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                staffMode
                  ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Switch role view for testing staff vs student"
            >
              <ChefHat className="w-4 h-4" />
              <span className="hidden sm:inline">
                {staffMode ? 'Switch to Student View' : 'Staff / Kitchen Panel'}
              </span>
              <span className="sm:hidden">{staffMode ? 'Student' : 'Staff'}</span>
            </button>

            {/* Shopping Cart Button (Student view) */}
            {!staffMode && (
              <button
                onClick={() => setIsOpen(true)}
                className="relative flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3.5 py-2 rounded-xl font-medium shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs font-bold font-mono">
                  ₹{subtotal.toFixed(2)}
                </span>
                {totalItems > 0 && (
                  <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-extrabold flex items-center justify-center animate-bounce">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {/* Auth / Profile menu */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-gray-200 hover:border-emerald-300 transition bg-white"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-gray-700 hidden sm:inline max-w-[100px] truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {/* Dropdown */}
                  {showProfileMenu && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {user.displayName || 'Logged In User'}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        <span className="mt-1 inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Role: {role}
                        </span>
                      </div>

                      <div className="p-1">
                        <button
                          onClick={() => switchRole(role === 'student' ? 'staff' : 'student')}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Set role to {role === 'student' ? 'Staff' : 'Student'}
                        </button>
                        <button
                          onClick={signOut}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Google Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="md:hidden flex items-center justify-around border-t border-gray-100 py-2 text-xs font-semibold">
          {!staffMode ? (
            <>
              <button
                onClick={() => setCurrentTab('menu')}
                className={`py-1 px-2 rounded-md ${currentTab === 'menu' ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}
              >
                Menu
              </button>
              <button
                onClick={() => setCurrentTab('active-orders')}
                className={`py-1 px-2 rounded-md ${currentTab === 'active-orders' ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}
              >
                Tracking
              </button>
              <button
                onClick={() => setCurrentTab('history')}
                className={`py-1 px-2 rounded-md ${currentTab === 'history' ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}
              >
                History
              </button>
              <button
                onClick={() => setCurrentTab('wishlist')}
                className={`py-1 px-2 rounded-md ${currentTab === 'wishlist' ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}
              >
                Saved ({wishlistCount})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentTab('staff-orders')}
                className={`py-1 px-2 rounded-md ${currentTab === 'staff-orders' ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}
              >
                Orders
              </button>
              <button
                onClick={() => setCurrentTab('staff-menu')}
                className={`py-1 px-2 rounded-md ${currentTab === 'staff-menu' ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}
              >
                Menu
              </button>
              <button
                onClick={() => setCurrentTab('staff-analytics')}
                className={`py-1 px-2 rounded-md ${currentTab === 'staff-analytics' ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}
              >
                Analytics
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
