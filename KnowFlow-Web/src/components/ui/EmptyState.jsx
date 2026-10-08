import { Inbox } from "lucide-react";

import "./StateComponents.css";


export default function EmptyState({
  icon,
  title = "Nothing here yet",
  message = "There is no data to display.",
}) {

  return (

    <div className="state-container">

      <div className="state-icon empty">

        {icon || <Inbox />}

      </div>

      <h3>
        {title}
      </h3>

      <p>
        {message}
      </p>

    </div>

  );

}