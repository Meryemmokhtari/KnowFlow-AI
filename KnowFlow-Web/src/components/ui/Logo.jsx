import { motion } from "framer-motion";


export default function Logo(){


return(

<div className="logo-wrapper">


{/* AI Glow */}

<motion.div

className="logo-glow"


animate={{

scale:[1,1.2,1],

opacity:[0.3,0.6,0.3]

}}

transition={{

duration:4,

repeat:Infinity,

ease:"easeInOut"

}}

/>





{/* Logo */}


<motion.img


src="/logo.PNG"


alt="KnowFlow AI Logo"



initial={{

opacity:0,

scale:.7,

y:20

}}



animate={{

opacity:1,

scale:1,

y:[0,-8,0]

}}



whileHover={{

scale:1.08,

rotate:2

}}



transition={{

opacity:{
duration:.8
},

scale:{
duration:.8
},

y:{

duration:4,

repeat:Infinity,

ease:"easeInOut"

}

}}



className="knowflow-logo"



/>





</div>


);


}