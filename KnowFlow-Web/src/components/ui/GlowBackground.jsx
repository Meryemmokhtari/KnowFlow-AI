import { motion } from "framer-motion";

export default function GlowBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">

      {/* Main Background */}
      <div className="absolute inset-0 bg-[#03061A]" />

      {/* Top Purple Glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.45, 0.7, 0.45],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          -top-52
          left-1/2
          h-[600px]
          w-[600px]
          -translate-x-1/2
          rounded-full
          bg-violet-600/20
          blur-[170px]
        "
      />

      {/* Left Cyan Glow */}
      <motion.div
        animate={{
          x: [-20, 20, -20],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          top-1/3
          -left-44
          h-[420px]
          w-[420px]
          rounded-full
          bg-cyan-500/20
          blur-[150px]
        "
      />

      {/* Right Blue Glow */}
      <motion.div
        animate={{
          x: [20, -20, 20],
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          bottom-0
          -right-44
          h-[450px]
          w-[450px]
          rounded-full
          bg-blue-600/20
          blur-[170px]
        "
      />

      {/* Bottom Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
        }}
        className="
          absolute
          bottom-[-250px]
          left-1/2
          h-[550px]
          w-[550px]
          -translate-x-1/2
          rounded-full
          bg-sky-500/10
          blur-[190px]
        "
      />

      {/* Noise Layer */}
      <div
        className="
          absolute
          inset-0
          opacity-[0.03]
          mix-blend-soft-light
        "
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

    </div>
  );
}