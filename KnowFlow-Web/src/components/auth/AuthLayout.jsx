import GlowBackground from "../ui/GlowBackground";
import Logo from "../ui/Logo";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 px-6">

      <GlowBackground />

      {/* Grid Background */}
      <div
        className="
          absolute inset-0
          opacity-10
          bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]
          bg-[size:40px_40px]
        "
      />

      <div
        className="
          relative
          z-10
          w-full
          max-w-md
          rounded-3xl
          border
          border-white/10
          bg-white/5
          backdrop-blur-xl
          shadow-2xl
          p-8
        "
      >
        <Logo />

        <div className="mt-8">
          {children}
        </div>
      </div>

    </div>
  );
}