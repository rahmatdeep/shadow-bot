"use client";

import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiLogoutBoxRLine, RiUserLine, RiSettings4Line } from "react-icons/ri";

interface UserProfileBadgeProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  position?: "top" | "bottom";
}

export function UserProfileBadge({
  user,
  position = "bottom",
}: UserProfileBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-full bg-white/70 backdrop-blur-md border border-text-200/50 hover:bg-white hover:border-text-300 transition-all shadow-sm cursor-pointer group active:scale-95"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-7 h-7 rounded-full object-cover ring-2 ring-text-100 group-hover:ring-text-200 transition-all"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-text-100 flex items-center justify-center text-text-500 text-xs font-semibold group-hover:bg-text-200 transition-all">
            {user.name?.charAt(0) || "?"}
          </div>
        )}
        <span className="text-sm font-semibold text-text-700 hidden sm:inline max-w-[120px] truncate">
          {user.name?.split(" ")[0] || "User"}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: position === "bottom" ? 8 : -8,
              scale: 0.95,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: position === "bottom" ? 8 : -8,
              scale: 0.95,
            }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={`absolute right-0 ${
              position === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
            } w-64 bg-white/95 backdrop-blur-2xl rounded-3xl border border-text-200/60 shadow-2xl shadow-text-900/10 overflow-hidden z-100`}
          >
            {/* Header info */}
            <div className="px-5 py-4 border-b border-text-100/50 bg-secondary-50/30">
              <p className="text-sm font-bold text-text-900 truncate">
                {user.name}
              </p>
              <p className="text-[11px] font-medium text-text-400 truncate mt-0.5 tracking-tight">
                {user.email}
              </p>
            </div>

            <div className="p-1.5">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all group active:scale-[0.98]"
              >
                <RiLogoutBoxRLine className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
