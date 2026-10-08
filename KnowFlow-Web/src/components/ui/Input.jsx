export default function Input({
  icon: Icon,
  rightIcon,
  ...props
}) {
  return (
    <div
      className="
      flex
      items-center
      rounded-2xl
      border
      border-white/10
      bg-[#0F172A]
      px-5
      h-14
      "
    >
      {Icon && (
        <Icon
          size={20}
          className="text-cyan-400"
        />
      )}

      <input
        {...props}
        className="
        flex-1
        bg-transparent
        px-4
        outline-none
        text-white
        placeholder:text-slate-500
        "
      />

      {rightIcon}
    </div>
  );
}