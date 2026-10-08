import { NavLink } from "react-router-dom";

export default function SidebarItem({
    icon: Icon,
    label,
    to
}) {

    return (

        <NavLink
            to={to}
            className={({ isActive }) =>

                `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all

                ${isActive

                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white"

                    : "text-slate-400 hover:bg-white/5 hover:text-white"

                }`

            }

        >

            <Icon size={20} />

            <span>

                {label}

            </span>

        </NavLink>

    )

}