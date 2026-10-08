import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  Shield,
  UserPlus,
  AlertCircle,
  Info,
  X,
  Loader2,
} from "lucide-react";

import { apiGet, apiPut } from "../../services/api";

import "./Notifications.css";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // =====================================================
  // UNREAD COUNT
  // =====================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await apiGet("/api/Notifications");

      const data = response?.data ?? response;

      const items = Array.isArray(data)
        ? data
        : data?.items || data?.notifications || [];

      setNotifications(
        items.map((item) => ({
          ...item,
          id: item.id ?? item.Id,
          title: item.title ?? item.Title ?? "Notification",
          message:
            item.message ??
            item.Message ??
            item.description ??
            item.Description ??
            "",
          type:
            item.type ??
            item.Type ??
            "info",
          read:
            item.read ??
            item.isRead ??
            item.IsRead ??
            false,
          createdAt:
            item.createdAt ??
            item.CreatedAt ??
            item.date ??
            "",
        }))
      );
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadNotifications();
  }, []);

  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  const markAsRead = async (notification) => {
    if (!notification?.id || notification.read) {
      return;
    }

    try {
      await apiPut(
        `/api/Notifications/${notification.id}/read`
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }

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
  };

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setMarkingAll(true);

      await apiPut(
        "/api/Notifications/read-all"
      );

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
        }))
      );
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );
    } finally {
      setMarkingAll(false);
    }
  };

  // =====================================================
  // NOTIFICATION ICON
  // =====================================================

  const getNotificationIcon = (type) => {
    switch (String(type).toLowerCase()) {
      case "user":
      case "usercreated":
      case "user_created":
        return <UserPlus size={18} />;

      case "document":
      case "documentuploaded":
      case "document_uploaded":
        return <FileText size={18} />;

      case "security":
      case "auth":
        return <Shield size={18} />;

      case "warning":
      case "error":
        return <AlertCircle size={18} />;

      case "success":
        return <Check size={18} />;

      default:
        return <Info size={18} />;
    }
  };

  // =====================================================
  // TYPE CLASS
  // =====================================================

  const getTypeClass = (type) => {
    switch (String(type).toLowerCase()) {
      case "success":
        return "notification-type-success";

      case "warning":
        return "notification-type-warning";

      case "error":
        return "notification-type-error";

      case "security":
        return "notification-type-security";

      case "document":
        return "notification-type-document";

      default:
        return "notification-type-info";
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "Recently";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const now = new Date();

    const diff =
      Math.floor(
        (now.getTime() - date.getTime()) / 1000
      );

    if (diff < 60) {
      return "Just now";
    }

    if (diff < 3600) {
      return `${Math.floor(diff / 60)} min ago`;
    }

    if (diff < 86400) {
      return `${Math.floor(diff / 3600)} h ago`;
    }

    if (diff < 604800) {
      return `${Math.floor(diff / 86400)} d ago`;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // TOGGLE
  // =====================================================

  const toggleNotifications = () => {
    setOpen((current) => !current);
  };

  return (
    <div className="notifications-wrapper">

      {/* =================================================
          BELL BUTTON
      ================================================= */}

      <button
        type="button"
        className={`notification-button ${
          open ? "notification-button-active" : ""
        }`}
        onClick={toggleNotifications}
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* =================================================
          DROPDOWN
      ================================================= */}

      {open && (
        <>
          <div
            className="notification-overlay"
            onClick={() => setOpen(false)}
          />

          <div className="notification-panel">

            {/* HEADER */}

            <div className="notification-header">

              <div className="notification-heading">

                <div className="notification-heading-icon">
                  <Bell size={17} />
                </div>

                <div>
                  <h3>
                    Notifications
                  </h3>

                  <span>
                    {unreadCount === 0
                      ? "You're all caught up"
                      : `${unreadCount} unread notification${
                          unreadCount > 1 ? "s" : ""
                        }`}
                  </span>
                </div>

              </div>

              <div className="notification-header-actions">

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notification-action"
                    onClick={markAllAsRead}
                    disabled={markingAll}
                    title="Mark all as read"
                  >
                    {markingAll ? (
                      <Loader2
                        size={16}
                        className="notification-spin"
                      />
                    ) : (
                      <CheckCheck size={16} />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  className="notification-action"
                  onClick={() => setOpen(false)}
                  title="Close"
                >
                  <X size={17} />
                </button>

              </div>

            </div>

            {/* BODY */}

            <div className="notification-list">

              {loading ? (
                <div className="notification-state">

                  <div className="notification-state-icon loading">
                    <Loader2
                      size={24}
                      className="notification-spin"
                    />
                  </div>

                  <strong>
                    Loading notifications
                  </strong>

                  <span>
                    Please wait...
                  </span>

                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-state">

                  <div className="notification-state-icon empty">
                    <Bell size={24} />
                  </div>

                  <strong>
                    You're all caught up
                  </strong>

                  <span>
                    No notifications at the moment.
                  </span>

                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    type="button"
                    key={notification.id}
                    className={`notification-item ${
                      notification.read
                        ? ""
                        : "notification-item-unread"
                    }`}
                    onClick={() =>
                      markAsRead(notification)
                    }
                  >

                    {/* ICON */}

                    <div
                      className={`notification-icon ${getTypeClass(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="notification-content">

                      <div className="notification-title-row">

                        <strong>
                          {notification.title}
                        </strong>

                        {!notification.read && (
                          <span className="notification-unread-dot" />
                        )}

                      </div>

                      <p>
                        {notification.message}
                      </p>

                      <small>
                        {formatDate(
                          notification.createdAt
                        )}
                      </small>

                    </div>

                  </button>
                ))
              )}

            </div>

            {/* FOOTER */}

            <div className="notification-footer">

              <button
                type="button"
                onClick={markAllAsRead}
                disabled={
                  unreadCount === 0 ||
                  markingAll
                }
              >
                <CheckCheck size={15} />

                {markingAll
                  ? "Marking..."
                  : "Mark all as read"}
              </button>

            </div>

          </div>
        </>
      )}

    </div>
  );
}