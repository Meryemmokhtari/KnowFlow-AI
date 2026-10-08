import Loader from "./Loader";

export default function Button({
  children,
  loading,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={loading}
      className="
      h-14
      w-full
      rounded-2xl
      bg-gradient-to-r
      from-violet-600
      via-indigo-600
      to-cyan-500
      font-semibold
      text-white
      transition
      hover:scale-[1.02]
      active:scale-95
      disabled:opacity-70
      flex
      items-center
      justify-center
      gap-3
      "
    >
      {loading && <Loader />}

      {children}
    </button>
  );
}