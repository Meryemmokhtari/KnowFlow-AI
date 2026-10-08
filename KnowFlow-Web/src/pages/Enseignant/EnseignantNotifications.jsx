import React, { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  Sparkles,
  Search,
  Upload,
  BrainCircuit,
  Info,
  Clock3,
  Trash2,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import "./EnseignantNotifications.css";

const initialNotifications = [
  {
    id: 1,
    type: "ai",
    title: "AI knowledge insight ready",
    message:
      "Your recent teaching documents were analyzed. New semantic relationships were detected between your resources.",
    time: "12 min ago",
    unread: true,
    icon: Sparkles,
  },
  {
    id: 2,
    type: "document",
    title: "Document indexed successfully",
    message:
      "Your teaching material has been processed and is now available through Knowledge Search.",
    time: "38 min ago",
    unread: true,
    icon: FileText,
  },
  {
    id: 3,
    type: "upload",
    title: "Upload completed",
    message:
      "Your teaching resource was uploaded successfully and is ready for intelligent processing.",
    time: "1 hour ago",
    unread: true,
    icon: Upload,
  },
  {
    id: 4,
    type: "search",
    title: "Knowledge Search updated",
    message:
      "The semantic index has been refreshed with your latest knowledge resources.",
    time: "3 hours ago",
    unread: false,
    icon: Search,
  },
  {
    id: 5,
    type: "ai",
    title: "New AI suggestion",
    message:
      "AI identified related concepts that may help you connect your teaching materials.",
    time: "Yesterday",
    unread: false,
    icon: BrainCircuit,
  },
  {
    id: 6,
    type: "system",
    title: "KnowFlow AI is up to date",
    message:
      "All knowledge services are currently operational.",
    time: "Yesterday",
    unread: false,
    icon: Info,
  },
];

const filters = [
  { id: "all", label: "All notifications" },
  { id: "unread", label: "Unread" },
  { id: "ai", label: "AI & Intelligence" },
  { id: "document", label: "Documents" },
  { id: "system", label: "System" },
];

function EnseignantNotifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState("all");

  const unreadCount = notifications.filter((item) => item.unread).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "unread") return item.unread;
      return item.type === activeFilter;
    });
  }, [notifications, activeFilter]);

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        unread: false,
      }))
    );
  };

  const removeNotification = (id) => {
    setNotifications((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const getTypeClass = (type) => {
    switch (type) {
      case "ai":
        return "en-notification-ai";
      case "document":
        return "en-notification-document";
      case "upload":
        return "en-notification-upload";
      case "search":
        return "en-notification-search";
      default:
        return "en-notification-system";
    }
  };

  return (
    <div className="enseignant-notifications">
      <div className="en-notifications-bg en-bg-one" />
      <div className="en-notifications-bg en-bg-two" />
      <div className="en-notifications-grid" />

      <main className="en-notifications-container">
        {/* HEADER */}
        <header className="en-notifications-header">
          <div className="en-notifications-heading">
            <div className="en-notifications-icon">
              <Bell size={23} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="en-notifications-icon-badge">
                  {unreadCount}
                </span>
              )}
            </div>

            <div>
              <div className="en-notifications-eyebrow">
                TEACHING INTELLIGENCE
              </div>

              <h1>Notifications</h1>

              <p>
                Stay informed about your teaching knowledge, AI insights,
                documents and platform activity.
              </p>
            </div>
          </div>

          <button
            className="en-mark-all"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={17} />
            Mark all as read
          </button>
        </header>

        {/* INSIGHT BAR */}
        <section className="en-notification-insight">
          <div className="en-insight-symbol">
            <Sparkles size={19} />
          </div>

          <div className="en-insight-content">
            <span>AI KNOWLEDGE CENTER</span>
            <strong>Your teaching workspace is intelligently connected.</strong>
            <p>
              New document activity and AI-generated insights will appear here.
            </p>
          </div>

          <div className="en-insight-status">
            <span className="en-live-dot" />
            AI Engine Online
          </div>
        </section>

        {/* FILTERS */}
        <div className="en-notifications-toolbar">
          <div className="en-filter-label">
            <SlidersHorizontal size={16} />
            Filter activity
          </div>

          <div className="en-notification-filters">
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={
                  activeFilter === filter.id
                    ? "en-filter active"
                    : "en-filter"
                }
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}

                {filter.id === "unread" && unreadCount > 0 && (
                  <span className="en-filter-count">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <section className="en-notifications-section">
          <div className="en-section-title-row">
            <div>
              <span>RECENT ACTIVITY</span>
              <h2>Your knowledge activity</h2>
            </div>

            <div className="en-total-count">
              {filteredNotifications.length}{" "}
              {filteredNotifications.length === 1
                ? "notification"
                : "notifications"}
            </div>
          </div>

          {filteredNotifications.length > 0 ? (
            <div className="en-notification-list">
              {filteredNotifications.map((notification) => {
                const Icon = notification.icon;

                return (
                  <article
                    key={notification.id}
                    className={`en-notification-card ${
                      notification.unread ? "unread" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {notification.unread && (
                      <span className="en-unread-indicator" />
                    )}

                    <div
                      className={`en-notification-type ${getTypeClass(
                        notification.type
                      )}`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="en-notification-main">
                      <div className="en-notification-top">
                        <div>
                          <h3>{notification.title}</h3>

                          {notification.unread && (
                            <span className="en-new-label">NEW</span>
                          )}
                        </div>

                        <span className="en-notification-time">
                          <Clock3 size={13} />
                          {notification.time}
                        </span>
                      </div>

                      <p>{notification.message}</p>

                      <div className="en-notification-actions">
                        {notification.unread ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check size={14} />
                            Mark as read
                          </button>
                        ) : (
                          <span className="en-read-status">
                            <Check size={13} />
                            Read
                          </span>
                        )}

                        <button
                          className="en-delete-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          title="Remove notification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <ArrowRight
                      className="en-notification-arrow"
                      size={18}
                    />
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="en-empty-notifications">
              <div className="en-empty-icon">
                <Bell size={26} />
              </div>

              <h3>No notifications here</h3>

              <p>
                You're all caught up. New teaching and AI activity will appear
                in this space.
              </p>

              <button onClick={() => setActiveFilter("all")}>
                View all activity
              </button>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="en-notifications-footer">
          <div>
            <span className="en-footer-dot" />
            KnowFlow AI · Teaching Intelligence
          </div>

          <span>
            Notifications help you stay connected to your knowledge workspace.
          </span>
        </footer>
      </main>
    </div>
  );
}

export default EnseignantNotifications;