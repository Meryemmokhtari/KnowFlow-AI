import { motion } from "framer-motion";

export default function GlassCard({ children }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 35,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}
      className="
        relative
        w-full
        max-w-md
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-white/[0.05]
        backdrop-blur-[30px]
        shadow-[0_25px_80px_rgba(0,0,0,0.55)]
      "
    >
      {/* Glass Reflection */}
      <div
        className="
          absolute
          inset-0
          rounded-[32px]
          bg-gradient-to-br
          from-white/10
          via-transparent
          to-transparent
          pointer-events-none
        "
      />

      {/* Top Glow */}
      <div
        className="
          absolute
          -top-32
          left-1/2
          h-72
          w-72
          -translate-x-1/2
          rounded-full
          bg-cyan-400/10
          blur-[120px]
        "
      />

      {/* Bottom Glow */}
      <div
        className="
          absolute
          -bottom-32
          right-0
          h-60
          w-60
          rounded-full
          bg-violet-500/10
          blur-[120px]
        "
      />

      {/* Border Glow */}
      <div
        className="
          absolute
          inset-0
          rounded-[32px]
          ring-1
          ring-white/5
          pointer-events-none
        "
      />

      {/* Content */}
      <div className="relative z-10 px-8 py-8">
        {children}
      </div>
    </motion.div>
  );
}