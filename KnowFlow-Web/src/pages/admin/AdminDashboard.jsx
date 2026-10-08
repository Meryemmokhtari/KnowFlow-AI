import {
  Activity,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Database,
  FileText,
  FolderOpen,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Zap,
  Settings,
  ScrollText,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiGet } from "../../services/api";

import "./AdminDashboard.css";


/* =========================================================
   KNOWFLOW AI
   ADMIN CONTROL CENTER
   ========================================================= */

export default function AdminDashboard() {

  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    users: 9,
    activeUsers: 9,
    documents: 0,
    aiQueries: 0,
  });

  const [activities, setActivities] = useState([
    {
      id: 1,
      user: "Eline Mokhtari",
      action: "Login",
      status: "Success",
      description: "User logged in successfully.",
      date: "29 Aug, 21:30",
    },
    {
      id: 2,
      user: "Eline Mokhtari",
      action: "Login",
      status: "Success",
      description: "User logged in successfully.",
      date: "29 Aug, 19:06",
    },
    {
      id: 3,
      user: "Eline Mokhtari",
      action: "Login",
      status: "Success",
      description: "User logged in successfully.",
      date: "29 Aug, 18:08",
    },
    {
      id: 4,
      user: "Eline Mokhtari",
      action: "Login",
      status: "Success",
      description: "User logged in successfully.",
      date: "29 Aug, 14:05",
    },
    {
      id: 5,
      user: "Eline Mokhtari",
      action: "Login",
      status: "Success",
      description: "User logged in successfully.",
      date: "29 Aug, 13:57",
    },
    {
      id: 6,
      user: "Eline Mokhtari",
      action: "Login",
      status: "Success",
      description: "User logged in successfully.",
      date: "29 Aug, 13:33",
    },
  ]);

  const [lastSync, setLastSync] = useState(
    "Just now"
  );


  /* =========================================================
     LOAD REAL ADMIN DATA
     ========================================================= */

  const loadAdminData = useCallback(
    async (silent = false) => {

      try {

        if (silent) {
          setRefreshing(true);
        }


        const results =
          await Promise.allSettled([
            apiGet("/api/Admin/stats"),
            apiGet("/api/Admin/activity"),
          ]);


        /* ===================================================
           STATS
           =================================================== */

        if (
          results[0].status === "fulfilled"
        ) {

          const response =
            results[0].value;

          const data =
            response?.data ??
            response ??
            {};


          setStats((previous) => ({
            ...previous,

            users:
              data.totalUsers ??
              data.users ??
              previous.users,

            activeUsers:
              data.activeUsers ??
              previous.activeUsers,

            documents:
              data.totalDocuments ??
              data.documents ??
              previous.documents,

            aiQueries:
              data.totalAiQueries ??
              data.aiQueries ??
              previous.aiQueries,
          }));

        }


        /* ===================================================
           ACTIVITY
           =================================================== */

        if (
          results[1].status === "fulfilled"
        ) {

          const response =
            results[1].value;

          const data =
            response?.data ??
            response ??
            [];


          const list =
            Array.isArray(data)
              ? data
              : Array.isArray(data?.items)
                ? data.items
                : [];


          if (list.length > 0) {

            setActivities(
              list
                .slice(0, 8)
                .map(
                  (item, index) => ({
                    id:
                      item.id ??
                      item.Id ??
                      index,

                    user:
                      item.userName ??
                      item.user ??
                      item.UserName ??
                      "System",

                    action:
                      item.action ??
                      item.Action ??
                      "Activity",

                    status:
                      item.status ??
                      item.Status ??
                      "Success",

                    description:
                      item.description ??
                      item.Description ??
                      "Workspace activity.",

                    date:
                      formatActivityDate(
                        item.createdAt ??
                        item.CreatedAt ??
                        item.date
                      ),
                  })
                )
            );

          }

        }


        setLastSync(
          new Date().toLocaleTimeString(
            "en-US",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )
        );

      }
      catch (error) {

        console.error(
          "Admin dashboard:",
          error
        );

      }
      finally {

        setRefreshing(false);

      }

    },
    []
  );


  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {

    loadAdminData();

  }, [loadAdminData]);


  /* =========================================================
     RENDER
     ========================================================= */

  return (

    <div className="admin-dashboard-page">


      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="admin-control-header">

        <div className="admin-control-heading">

          <div className="admin-control-eyebrow">

            <ShieldCheck size={15} />

            KNOWFLOW AI · ADMIN CONTROL CENTER

          </div>


          <h1>
            Workspace <span>Intelligence</span>
          </h1>


          <p>
            Monitor your knowledge ecosystem, AI
            intelligence and platform activity from
            one centralized command center.
          </p>

        </div>


        <div className="admin-control-actions">

          <div className="admin-system-status">

            <span className="status-pulse" />

            <div>

              <strong>
                Administrator
              </strong>

              <small>
                All systems operational
              </small>

            </div>

          </div>


          <button
            type="button"
            className="admin-control-refresh"
            onClick={() =>
              loadAdminData(true)
            }
            disabled={refreshing}
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "refresh-animation"
                  : ""
              }
            />

            Refresh

          </button>

        </div>

      </header>


      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <section className="admin-control-kpis">


        <ControlStat
          icon={<Users />}
          trend="+12.5%"
          title="Total Users"
          value={stats.users}
          subtitle="vs last month"
          type="cyan"
        />


        <ControlStat
          icon={<UserCheck />}
          trend="100%"
          title="Active Users"
          value={stats.activeUsers}
          subtitle="active accounts"
          type="green"
        />


        <ControlStat
          icon={<FileText />}
          trend="+8.2%"
          title="Knowledge Documents"
          value={stats.documents}
          subtitle="this month"
          type="purple"
        />


        <ControlStat
          icon={<Brain />}
          trend="+24.1%"
          title="AI Queries"
          value={stats.aiQueries}
          subtitle="AI interactions"
          type="blue"
        />

      </section>


      {/* =====================================================
          WORKSPACE ACTIVITY
          ===================================================== */}

      <section className="admin-control-card activity-overview">

        <div className="admin-control-card-header">

          <div>

            <span className="section-label">
              PLATFORM ACTIVITY
            </span>

            <h2>
              Workspace Activity
            </h2>

            <p>
              Recent platform engagement
            </p>

          </div>


          <div className="activity-header-icon">
            <Activity />
          </div>

        </div>


        <div className="activity-chart">

          <div className="chart-y-labels">

            <span>12</span>
            <span>8</span>
            <span>4</span>
            <span>0</span>

          </div>


          <div className="chart-main">

            <div className="chart-grid">

              <span />
              <span />
              <span />
              <span />

            </div>


            <div className="activity-bars">

              {[
                28,
                45,
                34,
                58,
                42,
                67,
                52,
              ].map(
                (height, index) => (

                  <div
                    className="activity-bar-wrapper"
                    key={index}
                  >

                    <div
                      className="activity-bar"
                      style={{
                        height: `${height}%`,
                      }}
                    />

                  </div>

                )
              )}

            </div>


            <div className="chart-days">

              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>

            </div>

          </div>

        </div>


        <div className="activity-metrics">

          <ActivityMetric
            icon={<Search />}
            value="0"
            label="semantic searches"
            type="cyan"
          />

          <ActivityMetric
            icon={<Upload />}
            value="0"
            label="uploads"
            type="purple"
          />

          <ActivityMetric
            icon={<BotIcon />}
            value={stats.aiQueries}
            label="AI queries"
            type="blue"
          />

        </div>

      </section>


      {/* =====================================================
          AI INTELLIGENCE + INFRASTRUCTURE
          ===================================================== */}

      <section className="admin-control-two-column">


        {/* ===================================================
            AI INTELLIGENCE
            =================================================== */}

        <div className="admin-control-card intelligence-card">

          <div className="admin-control-card-header">

            <div>

              <span className="section-label">
                AI INTELLIGENCE
              </span>

              <h2>
                Knowledge Engine
              </h2>

              <p>
                Semantic intelligence performance
              </p>

            </div>


            <div className="ai-header-icon">
              <Brain />
            </div>

          </div>


          <div className="accuracy-area">

            <div className="accuracy-circle">

              <div>

                <strong>
                  98.7%
                </strong>

                <span>
                  Accuracy
                </span>

              </div>

            </div>


            <div className="accuracy-details">

              <MiniIntelligence
                icon={<Brain />}
                title="AI Queries"
                value={stats.aiQueries}
              />

              <MiniIntelligence
                icon={<Search />}
                title="Semantic Search"
                value="0"
              />

              <MiniIntelligence
                icon={<Database />}
                title="Indexed Documents"
                value={stats.documents}
              />

            </div>

          </div>


          <div className="engine-status">

            <span className="engine-status-dot" />

            <div>

              <strong>
                AI Semantic Engine
              </strong>

              <small>
                ACTIVE
              </small>

            </div>

            <Zap />

          </div>

        </div>


        {/* ===================================================
            INFRASTRUCTURE
            =================================================== */}

        <div className="admin-control-card infrastructure-card">

          <div className="admin-control-card-header">

            <div>

              <span className="section-label">
                INFRASTRUCTURE
              </span>

              <h2>
                System Monitor
              </h2>

              <p>
                KnowFlow AI service health
              </p>

            </div>


            <div className="system-header-icon">
              <Server />
            </div>

          </div>


          <div className="service-list">

            <ServiceRow
              icon={<Shield />}
              name="Authentication Service"
              status="ONLINE"
            />

            <ServiceRow
              icon={<FileText />}
              name="Document Service"
              status="ONLINE"
            />

            <ServiceRow
              icon={<Search />}
              name="Semantic Search"
              status="ONLINE"
            />

            <ServiceRow
              icon={<Brain />}
              name="AI Service"
              status="ONLINE"
            />

            <ServiceRow
              icon={<Database />}
              name="Knowledge Database"
              status="READY"
            />

          </div>


          <div className="overall-health">

            <div>

              <span>
                Overall System Health
              </span>

              <strong>
                98%
              </strong>

            </div>


            <div className="health-progress">

              <span />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          DOCUMENT DISTRIBUTION
          ===================================================== */}

      <section className="admin-control-card document-card">

        <div className="admin-control-card-header">

          <div>

            <span className="section-label">
              KNOWLEDGE BASE
            </span>

            <h2>
              Document Distribution
            </h2>

            <p>
              Knowledge formats across workspace
            </p>

          </div>


          <div className="document-header-icon">
            <FolderOpen />
          </div>

        </div>


        <div className="document-distribution">

          <div className="document-total">

            <div className="document-total-icon">
              <FileText />
            </div>

            <div>

              <strong>
                {stats.documents}
              </strong>

              <span>
                files
              </span>

            </div>

          </div>


          <DocumentFormat
            type="PDF"
            value="0"
            percentage="0%"
            color="red"
          />

          <DocumentFormat
            type="DOCX"
            value="0"
            percentage="0%"
            color="blue"
          />

          <DocumentFormat
            type="TXT"
            value="0"
            percentage="0%"
            color="green"
          />

        </div>

      </section>


      {/* =====================================================
          LIVE ACTIVITY
          ===================================================== */}

      <section className="admin-control-card recent-events">

        <div className="admin-control-card-header">

          <div>

            <span className="section-label">
              LIVE ACTIVITY
            </span>

            <h2>
              Recent Events
            </h2>

            <p>
              Latest actions across your workspace
            </p>

          </div>


          <div className="live-indicator">

            <span />

            LIVE

          </div>

        </div>


        <div className="events-list">

          {activities
            .slice(0, 6)
            .map(
              (activity) => (

                <EventRow
                  key={activity.id}
                  activity={activity}
                />

              )
            )}

        </div>

      </section>


      {/* =====================================================
          QUICK ACTIONS
          ===================================================== */}

      <section className="command-center">

        <div className="command-heading">

          <div>

            <span className="section-label">
              COMMAND CENTER
            </span>

            <h2>
              Quick Actions
            </h2>

            <p>
              Manage your workspace
            </p>

          </div>

        </div>


        <div className="command-grid">


          <CommandAction
            icon={<UserPlus />}
            title="Add User"
            description="Create a new account"
            type="cyan"
            onClick={() =>
              window.location.href =
                "/dashboard/admin/users"
            }
          />


          <CommandAction
            icon={<Upload />}
            title="Upload Document"
            description="Add knowledge"
            type="purple"
            onClick={() =>
              window.location.href =
                "/dashboard/upload"
            }
          />


          <CommandAction
            icon={<Settings />}
            title="Manage Roles"
            description="Permissions & access"
            type="blue"
            onClick={() =>
              window.location.href =
                "/dashboard/admin/roles"
            }
          />


          <CommandAction
            icon={<ScrollText />}
            title="Audit Logs"
            description="Track workspace events"
            type="green"
            onClick={() =>
              window.location.href =
                "/dashboard/admin/audit-logs"
            }
          />

        </div>

      </section>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="admin-control-footer">

        <span>

          <span className="footer-online-dot" />

          KnowFlow AI · All systems operational

        </span>


        <span>

          Last synchronization:{" "}

          <strong>
            {lastSync}
          </strong>

        </span>

      </footer>

    </div>

  );
}


/* =========================================================
   STAT CARD
   ========================================================= */

function ControlStat({
  icon,
  trend,
  title,
  value,
  subtitle,
  type,
}) {

  return (

    <div
      className={`control-stat-card ${type}`}
    >

      <div className="control-stat-top">

        <div className="control-stat-icon">
          {icon}
        </div>

        <span className="control-stat-trend">

          <ArrowUpRight size={12} />

          {trend}

        </span>

      </div>


      <div className="control-stat-body">

        <span>
          {title}
        </span>

        <strong>
          {formatNumber(value)}
        </strong>

        <small>
          {subtitle}
        </small>

      </div>

    </div>

  );
}


/* =========================================================
   ACTIVITY METRIC
   ========================================================= */

function ActivityMetric({
  icon,
  value,
  label,
  type,
}) {

  return (

    <div
      className={`activity-metric ${type}`}
    >

      <div className="metric-icon">
        {icon}
      </div>

      <div>

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </div>

  );
}


/* =========================================================
   MINI INTELLIGENCE
   ========================================================= */

function MiniIntelligence({
  icon,
  title,
  value,
}) {

  return (

    <div className="mini-intelligence">

      <div className="mini-intelligence-icon">
        {icon}
      </div>

      <span>
        {title}
      </span>

      <strong>
        {formatNumber(value)}
      </strong>

    </div>

  );
}


/* =========================================================
   SERVICE ROW
   ========================================================= */

function ServiceRow({
  icon,
  name,
  status,
}) {

  return (

    <div className="service-row">

      <div className="service-icon">
        {icon}
      </div>

      <span>
        {name}
      </span>

      <div className="service-status">

        <span />

        {status}

      </div>

    </div>

  );
}


/* =========================================================
   DOCUMENT FORMAT
   ========================================================= */

function DocumentFormat({
  type,
  value,
  percentage,
  color,
}) {

  return (

    <div className="document-format">

      <div
        className={`document-format-icon ${color}`}
      >

        <FileText />

      </div>


      <div className="document-format-info">

        <div>

          <strong>
            {type}
          </strong>

          <b>
            {value}
          </b>

        </div>

        <span>
          {percentage} of knowledge base
        </span>


        <div className="format-progress">

          <span
            style={{
              width: percentage,
            }}
          />

        </div>

      </div>

    </div>

  );
}


/* =========================================================
   EVENT ROW
   ========================================================= */

function EventRow({
  activity,
}) {

  const isSuccess =
    String(activity.status)
      .toLowerCase() !== "failed";


  return (

    <div className="event-row">

      <div className="event-avatar">

        {activity.user
          ?.charAt(0)
          .toUpperCase() || "E"}

      </div>


      <div className="event-info">

        <div className="event-title">

          <strong>
            {activity.action}
          </strong>

          <span
            className={
              isSuccess
                ? "event-success"
                : "event-failed"
            }
          >

            <CheckCircle2 size={11} />

            {activity.status}

          </span>

        </div>


        <p>
          {activity.description}
        </p>

      </div>


      <time>
        {activity.date}
      </time>

    </div>

  );
}


/* =========================================================
   COMMAND ACTION
   ========================================================= */

function CommandAction({
  icon,
  title,
  description,
  type,
  onClick,
}) {

  return (

    <button
      type="button"
      className={`command-action ${type}`}
      onClick={onClick}
    >

      <div className="command-icon">
        {icon}
      </div>


      <div className="command-info">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>


      <ArrowUpRight
        className="command-arrow"
        size={17}
      />

    </button>

  );
}


/* =========================================================
   BOT ICON
   ========================================================= */

function BotIcon() {

  return (
    <Brain size={17} />
  );

}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(value) {

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0";
  }

  return number.toLocaleString(
    "en-US"
  );

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatActivityDate(value) {

  if (!value) {
    return "Recently";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return date.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

}