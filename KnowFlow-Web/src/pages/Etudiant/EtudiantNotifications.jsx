import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  Info,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  Trash2,
  UserPlus,
  X,
  Zap,
} from "lucide-react";

import { apiGet, apiPut, apiDelete } from "../../services/api";
import "./EtudiantNotifications.css";

const NOTIFICATIONS_API = "/api/Notifications";

export default function EtudiantNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  const loadNotifications = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await apiGet(NOTIFICATIONS_API);

      const data = response?.data ?? response;

      const items = Array.isArray(data)
        ? data
        : data?.items ||
          data?.notifications ||
          data?.data ||
          [];

      const normalized = items
        .map(normalizeNotification)
        .filter((item) => item.id !== null)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

      setNotifications(normalized);
    } catch (err) {
      console.error("Failed to load student notifications:", err);

      setError(
        err?.message ||
          "Unable to load your notifications. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // =====================================================
  // NORMALIZE BACKEND DATA
  // =====================================================

  function normalizeNotification(item) {
    const rawType =
      item?.type ??
      item?.Type ??
      item?.notificationType ??
      item?.NotificationType ??
      "info";

    const rawRead =
      item?.read ??
      item?.Read ??
      item?.isRead ??
      item?.IsRead ??
      false;

    const createdAt =
      item?.createdAt ??
      item?.CreatedAt ??
      item?.date ??
      item?.Date ??
      item?.timestamp ??
      item?.Timestamp ??
      null;

    return {
      id: item?.id ?? item?.Id ?? null,

      title:
        item?.title ??
        item?.Title ??
        "Notification",

      message:
        item?.message ??
        item?.Message ??
        item?.description ??
        item?.Description ??
        "",

      type: String(rawType).toLowerCase(),

      read:
        rawRead === true ||
        rawRead === 1 ||
        String(rawRead).toLowerCase() === "true",

      createdAt,

      category: getCategory(rawType),
    };
  }

  // =====================================================
  // CATEGORY
  // =====================================================

  function getCategory(type) {
    const value = String(type || "").toLowerCase();

    if (
      value.includes("ai") ||
      value.includes("assistant") ||
      value.includes("recommend")
    ) {
      return "AI";
    }

    if (
      value.includes("document") ||
      value.includes("course") ||
      value.includes("learning")
    ) {
      return "Learning";
    }

    if (
      value.includes("teacher") ||
      value.includes("enseignant") ||
      value.includes("professor")
    ) {
      return "Teacher";
    }

    if (
      value.includes("progress") ||
      value.includes("milestone") ||
      value.includes("achievement")
    ) {
      return "Progress";
    }

    if (
      value.includes("quiz") ||
      value.includes("evaluation") ||
      value.includes("test")
    ) {
      return "Quiz";
    }

    return "System";
  }

  // =====================================================
  // COUNTS
  // =====================================================

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read
      ).length,
    [notifications]
  );

  const aiCount = useMemo(
    () =>
      notifications.filter(
        (notification) => notification.category === "AI"
      ).length,
    [notifications]
  );

  const learningCount = useMemo(
    () =>
      notifications.filter(
        (notification) => notification.category === "Learning"
      ).length,
    [notifications]
  );

  const progressCount = useMemo(
    () =>
      notifications.filter(
        (notification) => notification.category === "Progress"
      ).length,
    [notifications]
  );

  // =====================================================
  // FILTERS
  // =====================================================

  const filters = [
    "All",
    "Unread",
    "AI",
    "Learning",
    "Teacher",
    "Progress",
    "Quiz",
  ];

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (activeFilter === "All") {
        return true;
      }

      if (activeFilter === "Unread") {
        return !notification.read;
      }

      return notification.category === activeFilter;
    });
  }, [notifications, activeFilter]);

  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  const markAsRead = async (notification) => {
    if (!notification?.id || notification.read) {
      return;
    }

    try {
      await apiPut(
        `${NOTIFICATIONS_API}/${notification.id}/read`
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) {
      return;
    }

    try {
      setMarkingAll(true);

      await apiPut(`${NOTIFICATIONS_API}/read-all`);

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
        }))
      );
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );
    } finally {
      setMarkingAll(false);
    }
  };

  // =====================================================
  // DELETE ONE
  // =====================================================

  const deleteNotification = async (id) => {
    if (!id) {
      return;
    }

    try {
      await apiDelete(`${NOTIFICATIONS_API}/${id}`);

      setNotifications((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error(
        "Failed to delete notification:",
        err
      );
    }
  };

  // =====================================================
  // CLEAR ALL
  // =====================================================

  const clearAll = async () => {
    if (notifications.length === 0) {
      return;
    }

    try {
      /*
       * If your backend exposes:
       * DELETE /api/Notifications
       * this will remove everything server-side.
       */
      await apiDelete(NOTIFICATIONS_API);

      setNotifications([]);
    } catch (err) {
      console.error(
        "Failed to clear notifications:",
        err
      );
    }
  };

  // =====================================================
  // ICON
  // =====================================================

  const getIcon = (type) => {
    const value = String(type || "").toLowerCase();

    if (
      value.includes("ai") ||
      value.includes("assistant") ||
      value.includes("recommend")
    ) {
      return <Sparkles size={19} />;
    }

    if (
      value.includes("document") ||
      value.includes("course") ||
      value.includes("learning")
    ) {
      return <BookOpen size={19} />;
    }

    if (
      value.includes("teacher") ||
      value.includes("enseignant") ||
      value.includes("professor")
    ) {
      return <GraduationCap size={19} />;
    }

    if (
      value.includes("progress") ||
      value.includes("milestone") ||
      value.includes("achievement")
    ) {
      return <Target size={19} />;
    }

    if (
      value.includes("quiz") ||
      value.includes("evaluation") ||
      value.includes("test")
    ) {
      return <MessageSquareText size={19} />;
    }

    if (
      value.includes("security") ||
      value.includes("auth")
    ) {
      return <Shield size={19} />;
    }

    if (
      value.includes("user") ||
      value.includes("created")
    ) {
      return <UserPlus size={19} />;
    }

    if (
      value.includes("warning") ||
      value.includes("error")
    ) {
      return <AlertCircle size={19} />;
    }

    if (value.includes("success")) {
      return <Check size={19} />;
    }

    if (value.includes("info")) {
      return <Info size={19} />;
    }

    return <Zap size={19} />;
  };

  // =====================================================
  // TYPE CLASS
  // =====================================================

  const getTypeClass = (type) => {
    const value = String(type || "").toLowerCase();

    if (value.includes("ai")) {
      return "ai";
    }

    if (
      value.includes("document") ||
      value.includes("learning")
    ) {
      return "learning";
    }

    if (
      value.includes("teacher") ||
      value.includes("enseignant")
    ) {
      return "teacher";
    }

    if (
      value.includes("progress") ||
      value.includes("milestone")
    ) {
      return "progress";
    }

    if (value.includes("quiz")) {
      return "quiz";
    }

    if (value.includes("security")) {
      return "security";
    }

    if (value.includes("warning")) {
      return "warning";
    }

    if (value.includes("error")) {
      return "error";
    }

    if (value.includes("success")) {
      return "success";
    }

    return "system";
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatTime = (value) => {
    if (!value) {
      return "Recently";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    const now = new Date();

    const diffSeconds = Math.floor(
      (now.getTime() - date.getTime()) / 1000
    );

    if (diffSeconds < 60) {
      return "Just now";
    }

    if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} min ago`;
    }

    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours}h ago`;
    }

    if (diffSeconds < 604800) {
      const days = Math.floor(diffSeconds / 86400);
      return `${days}d ago`;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="student-notifications-page">
        <div className="notifications-loading">
          <div className="loading-icon">
            <Loader2 size={30} />
          </div>

          <h3>Loading your notifications</h3>

          <p>
            KnowFlow AI is retrieving your latest learning
            activity.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="student-notifications-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="notifications-header">
        <div>
          <div className="notifications-eyebrow">
            <Bell size={15} />
            KNOWFLOW AI · NOTIFICATIONS
          </div>

          <h1>
            Stay in the
            <span> learning loop.</span>
          </h1>

          <p>
            Important updates, AI recommendations and
            learning activity from your KnowFlow workspace.
          </p>
        </div>

        <div className="notification-header-badge">
          <div className="notification-bell">
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount}
              </span>
            )}
          </div>

          <div>
            <strong>{unreadCount}</strong>
            <span>Unread notifications</span>
          </div>
        </div>
      </header>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="notifications-error">
          <AlertCircle size={18} />

          <div>
            <strong>Unable to load notifications</strong>
            <span>{error}</span>
          </div>

          <button onClick={() => loadNotifications()}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="notification-summary">
        <div className="summary-card">
          <div className="summary-icon ai">
            <Sparkles size={19} />
          </div>

          <div>
            <span>AI UPDATES</span>
            <strong>{aiCount}</strong>
            <small>AI-related notifications</small>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon learning">
            <BookOpen size={19} />
          </div>

          <div>
            <span>LEARNING</span>
            <strong>{learningCount}</strong>
            <small>Learning activity</small>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon progress">
            <Target size={19} />
          </div>

          <div>
            <span>PROGRESS</span>
            <strong>{progressCount}</strong>
            <small>Progress updates</small>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon activity">
            <Clock3 size={19} />
          </div>

          <div>
            <span>UNREAD</span>
            <strong>{unreadCount}</strong>
            <small>Needs your attention</small>
          </div>
        </div>
      </section>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <section className="notifications-toolbar">
        <div className="filter-label">
          <Filter size={16} />
          <span>Filter</span>
        </div>

        <div className="notification-filters">
          {filters.map((filter) => (
            <button
              key={filter}
              className={
                activeFilter === filter ? "active" : ""
              }
              onClick={() => setActiveFilter(filter)}
            >
              {filter}

              {filter === "Unread" &&
                unreadCount > 0 && (
                  <span>{unreadCount}</span>
                )}
            </button>
          ))}
        </div>

        <div className="notification-actions">
          <button
            onClick={markAllAsRead}
            disabled={
              unreadCount === 0 || markingAll
            }
          >
            {markingAll ? (
              <Loader2
                size={16}
                className="spin"
              />
            ) : (
              <CheckCheck size={16} />
            )}

            <span>
              {markingAll
                ? "Updating..."
                : "Mark all read"}
            </span>
          </button>

          <button
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
            title="Refresh notifications"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "spin" : ""}
            />

            <span>Refresh</span>
          </button>

          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            title="Clear all notifications"
          >
            <Trash2 size={16} />
            <span>Clear</span>
          </button>
        </div>
      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="notifications-content">
        <div className="notifications-list-header">
          <div>
            <span>YOUR ACTIVITY</span>

            <h2>
              {activeFilter === "All"
                ? "Recent notifications"
                : `${activeFilter} notifications`}
            </h2>
          </div>

          <div className="total-notifications">
            {filteredNotifications.length} notification
            {filteredNotifications.length !== 1
              ? "s"
              : ""}
          </div>
        </div>

        {/* =================================================
            LIST
        ================================================= */}

        {filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map(
              (notification) => (
                <article
                  key={notification.id}
                  className={`notification-item ${
                    notification.read ? "" : "unread"
                  }`}
                >
                  <div
                    className={`notification-type ${getTypeClass(
                      notification.type
                    )}`}
                  >
                    {getIcon(notification.type)}
                  </div>

                  <div className="notification-body">
                    <div className="notification-top">
                      <div>
                        <div className="notification-title-row">
                          <h3>
                            {notification.title}
                          </h3>

                          {!notification.read && (
                            <span className="unread-dot" />
                          )}
                        </div>

                        <span className="notification-category">
                          {notification.category}
                        </span>
                      </div>

                      <span className="notification-time">
                        <Clock3 size={13} />

                        {formatTime(
                          notification.createdAt
                        )}
                      </span>
                    </div>

                    <p>
                      {notification.message ||
                        "You have a new KnowFlow AI update."}
                    </p>

                    <div className="notification-footer">
                      {!notification.read ? (
                        <button
                          onClick={() =>
                            markAsRead(notification)
                          }
                          className="mark-read-btn"
                        >
                          <Check size={15} />
                          Mark as read
                        </button>
                      ) : (
                        <span className="read-status">
                          <CheckCheck size={14} />
                          Read
                        </span>
                      )}

                      <button className="open-notification-btn">
                        View details
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>

                  <button
                    className="delete-notification"
                    onClick={() =>
                      deleteNotification(
                        notification.id
                      )
                    }
                    title="Delete notification"
                  >
                    <X size={16} />
                  </button>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="empty-notifications">
            <div className="empty-icon">
              <Bell size={30} />
            </div>

            <h3>
              {activeFilter === "All"
                ? "You're all caught up ✨"
                : `No ${activeFilter.toLowerCase()} notifications`}
            </h3>

            <p>
              {activeFilter === "All"
                ? "There are no notifications available right now. Keep learning and KnowFlow AI will keep you updated."
                : "There are no notifications in this category right now."}
            </p>

            {activeFilter !== "All" && (
              <button
                onClick={() => setActiveFilter("All")}
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}