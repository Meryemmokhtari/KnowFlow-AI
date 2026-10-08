export default function Card({ children }) {
  return (
    <div
      className="
      w-full
      max-w-md
      rounded-[32px]
      border
      border-white/10
      bg-white/5
      backdrop-blur-3xl
      shadow-2xl
      p-10
      "
    >
      {children}
    </div>
  );
}