import { useEffect, useState } from "react";
import { Badge, Button, ListGroup, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  notificationsApi,
  type NotificationItem,
} from "../api/notificationsApi";
import { useAuth } from "../hooks/useAuth";
import "./NotificationBell.scss";

function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  };

  const loadNotifications = async (onlyUnread = unreadOnly) => {
    setLoading(true);
    try {
      const items = await notificationsApi.getAll({
        limit: 50,
        unreadOnly: onlyUnread,
      });
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (value: string) => {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return t("notifications.justNow", "Just now");
    if (minutes < 60) {
      return t("notifications.minutesAgo", "{{count}}m ago", {
        count: minutes,
      });
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return t("notifications.hoursAgo", "{{count}}h ago", {
        count: hours,
      });
    }

    const days = Math.floor(hours / 24);
    return t("notifications.daysAgo", "{{count}}d ago", { count: days });
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    loadUnreadCount();
    const interval = window.setInterval(loadUnreadCount, 20000);

    return () => window.clearInterval(interval);
  }, [user]);

  const handleOpen = async () => {
    setShowModal(true);
    await Promise.all([loadNotifications(unreadOnly), loadUnreadCount()]);
  };

  useEffect(() => {
    if (!showModal) {
      return;
    }

    loadNotifications(unreadOnly);
  }, [showModal, unreadOnly]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await notificationsApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: 1 } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setShowModal(false);

    if (
      (user?.role === "parent" || user?.role === "user") &&
      notification.studentId &&
      notification.commentDate
    ) {
      const params = new URLSearchParams({
        openComments: "1",
        studentId: String(notification.studentId),
        date: notification.commentDate,
      });
      navigate(`/parent-dashboard?${params.toString()}`);
      return;
    }

    if (notification.commentDate) {
      const params = new URLSearchParams({
        commentsDate: notification.commentDate,
      });
      navigate(`/attendance?${params.toString()}`);
      return;
    }

    navigate("/");
  };

  const handleMarkAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
    setUnreadCount(0);
    if (unreadOnly) {
      setNotifications([]);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={handleOpen}
        className="notification-bell-btn"
      >
        <i className="bi bi-bell me-1"></i>
        {t("notifications.title", "Notifications")}
        {unreadCount > 0 && (
          <Badge bg="danger" className="ms-2 notification-count-badge">
            {unreadCount}
          </Badge>
        )}
      </Button>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        className="notifications-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("notifications.title", "Notifications")}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="notifications-modal-body">
          <div className="notifications-toolbar mb-3">
            <div className="d-flex align-items-center gap-2">
              <Badge bg="secondary" pill>
                {unreadCount} {t("notifications.unread", "Unread")}
              </Badge>
              <Button
                variant={unreadOnly ? "primary" : "outline-secondary"}
                size="sm"
                onClick={() => setUnreadOnly((prev) => !prev)}
              >
                {unreadOnly
                  ? t("notifications.showAll", "Show all")
                  : t("notifications.showUnread", "Show unread")}
              </Button>
            </div>

            <Button
              variant="link"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              {t("notifications.markAllAsRead", "Mark all as read")}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              {t("notifications.loading", "Loading notifications...")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-muted text-center py-4 notifications-empty-state">
              <i className="bi bi-bell-slash d-block mb-2"></i>
              {t("notifications.empty", "No notifications")}
            </div>
          ) : (
            <ListGroup className="notifications-list" variant="flush">
              {notifications.map((notification) => (
                <ListGroup.Item
                  key={notification.id}
                  action
                  onClick={() => handleNotificationClick(notification)}
                  className={`notification-item ${
                    notification.isRead ? "is-read" : "is-unread"
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="notification-item-content">
                      <div className="notification-title-row">
                        <span className="notification-title">
                          {notification.title}
                        </span>
                        {notification.studentName && (
                          <small className="text-muted ms-2">
                            <i className="bi bi-person-vcard me-1"></i>
                            {notification.studentName}
                          </small>
                        )}
                      </div>
                      <small className="text-muted d-block notification-message">
                        {notification.message}
                      </small>
                      <small className="text-muted d-block mt-1">
                        <i className="bi bi-clock me-1"></i>
                        {formatRelativeTime(notification.createdAt)}
                      </small>
                    </div>
                    {!notification.isRead && (
                      <Badge bg="primary" pill>
                        {t("notifications.new", "New")}
                      </Badge>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default NotificationBell;
