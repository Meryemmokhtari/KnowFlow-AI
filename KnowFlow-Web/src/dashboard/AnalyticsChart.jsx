import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import "./Dashboard.css";


export default function AnalyticsChart(){


  const data = [

    {
      month:"Jan",
      documents:40,
      queries:120
    },

    {
      month:"Feb",
      documents:80,
      queries:240
    },

    {
      month:"Mar",
      documents:130,
      queries:380
    },

    {
      month:"Apr",
      documents:190,
      queries:520
    },

    {
      month:"May",
      documents:245,
      queries:700
    }

  ];




  return (

    <div className="charts-grid">



      <div className="chart-card">


        <h3>
          📈 Knowledge Growth
        </h3>



        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <LineChart data={data}>

            <XAxis dataKey="month"/>

            <YAxis/>

            <Tooltip/>


            <Line

              type="monotone"

              dataKey="documents"

              stroke="#38bdf8"

              strokeWidth={3}

            />


          </LineChart>


        </ResponsiveContainer>


      </div>







      <div className="chart-card">


        <h3>
          🤖 AI Queries Activity
        </h3>



        <ResponsiveContainer
          width="100%"
          height={300}
        >

          <BarChart data={data}>


            <XAxis dataKey="month"/>

            <YAxis/>

            <Tooltip/>


            <Bar

              dataKey="queries"

              fill="#a855f7"

            />


          </BarChart>


        </ResponsiveContainer>



      </div>



    </div>

  );

}