import {
  Search,
  Bell,
  User
} from "lucide-react";

import "./Navbar.css";


export default function Navbar() {


  return (

    <header className="navbar">


      <div className="search-box">

        <Search />

        <input
          type="text"
          placeholder="Search knowledge..."
        />

      </div>





      <div className="navbar-actions">


        <button className="icon-btn">

          <Bell />

        </button>




        <div className="profile">


          <div className="avatar">

            <User />

          </div>


          <div>

            <h4>
              Meryem
            </h4>

            <span>
              Admin
            </span>

          </div>


        </div>


      </div>


    </header>

  );
}