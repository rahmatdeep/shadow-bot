"use client";

import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfileBadgeProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function UserProfileBadge({ user }: UserProfileBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        layout
        className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white/50 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300 cursor-default group"
      >
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border border-primary-200 text-primary-600 shrink-0">
          {user?.image ? (
            <Image
              src={user?.image}
              alt={user?.name || "User"}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-900 leading-tight">
            {user?.name?.split(" ")[0] || "User"}
          </span>
          {user?.email && (
            <span className="text-[10px] font-medium text-text-400 leading-none truncate max-w-[100px]">
              {user?.email}
            </span>
          )}
        </div>

        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ width: 0, opacity: 0, marginLeft: 0 }}
              animate={{ width: 28, opacity: 1, marginLeft: 8 }}
              exit={{ width: 0, opacity: 0, marginLeft: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              onClick={() => signOut()}
              className="flex items-center justify-center rounded-full text-text-400 hover:text-red-600 hover:bg-red-50 transition-colors overflow-hidden"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
