import {

Bell,

Search,

User

} from "lucide-react";

export default function Header(){

return(

<header className="h-20 border-b border-white/10 px-8 flex items-center justify-between">

<div className="flex items-center gap-3 bg-[#101827] px-5 py-3 rounded-2xl w-[400px]">

<Search size={18}/>

<input

placeholder="Search..."

className="bg-transparent flex-1 text-white"

/>

</div>

<div className="flex items-center gap-5">

<button>

<Bell/>

</button>

<div className="w-11 h-11 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center">

<User/>

</div>

</div>

</header>

)

}