import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, ListGroup, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  notificationsApi,
  type NotificationItem,
} from "../api/notificationsApi";
import { useAuth } from "../hooks/useAuth";
import { formatDateForInput } from "../utils/dateFormatter";
import "./NotificationBell.scss";

function NotificationBell() {
  const { t } = useTranslation();
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const showModalRef = useRef(false);
  const unreadOnlyRef = useRef(false);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  useEffect(() => {
    unreadOnlyRef.current = unreadOnly;
  }, [unreadOnly]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Keep the current value on transient failures.
    }
  }, []);

  const loadNotifications = useCallback(async (onlyUnread: boolean) => {
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
  }, []);

  const getNotificationsWsUrl = useCallback(() => {
    try {
      if (!accessToken || !import.meta.env.VITE_API_URL) {
        return null;
      }

      const apiUrl = new URL(import.meta.env.VITE_API_URL as string);
      const wsProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${apiUrl.host}/backend/ws/notifications?token=${encodeURIComponent(accessToken)}`;
    } catch {
      return null;
    }
  }, [accessToken]);

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
  }, [user, loadUnreadCount]);

  useEffect(() => {
    if (!user || !accessToken) {
      return;
    }

    const wsUrl = getNotificationsWsUrl();
    if (!wsUrl) {
      return;
    }

    let active = true;

    const connect = () => {
      if (!active) {
        return;
      }

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as {
            type?: string;
            recipientUserId?: number;
          };

          if (
            typeof payload.recipientUserId === "number" &&
            user?.id &&
            payload.recipientUserId !== user.id
          ) {
            return;
          }

          if (payload.type === "notification:new") {
            // Instant visual feedback, then sync from API.
            setUnreadCount((prev) => prev + 1);
            void loadUnreadCount();
            if (showModalRef.current) {
              void loadNotifications(unreadOnlyRef.current);
            }
            return;
          }

          if (payload.type === "notification:update") {
            void loadUnreadCount();
            if (showModalRef.current) {
              void loadNotifications(unreadOnlyRef.current);
            }
          }
        } catch {
          // Ignore malformed websocket payloads
        }
      };

      socket.onclose = () => {
        if (!active) {
          return;
        }

        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [
    user,
    accessToken,
    getNotificationsWsUrl,
    loadNotifications,
    loadUnreadCount,
  ]);

  const handleOpen = async () => {
    setShowModal(true);
    await Promise.all([loadNotifications(unreadOnly), loadUnreadCount()]);
  };

  useEffect(() => {
    if (!showModal) {
      return;
    }

    loadNotifications(unreadOnly);
  }, [showModal, unreadOnly, loadNotifications]);

  const isReplyNotification = (notification: NotificationItem) => {
    const type = String(notification.type || "").toUpperCase();
    if (type.includes("REPLIED")) {
      return true;
    }

    const title = String(notification.title || "");
    const message = String(notification.message || "");
    return /replied|reply/i.test(title) || /replied|reply/i.test(message);
  };

  const isAddedNotification = (notification: NotificationItem) => {
    const type = String(notification.type || "").toUpperCase();
    if (type.includes("ADDED")) {
      return true;
    }

    const title = String(notification.title || "");
    const message = String(notification.message || "");
    return (
      /new attendance comment|new comment|comment added/i.test(title) ||
      /new attendance comment|new comment|comment added/i.test(message)
    );
  };

  const getNotificationTitle = (notification: NotificationItem) => {
    if (isAddedNotification(notification)) {
      return t("notifications.commentAddedTitle", "New comment");
    }
    if (isReplyNotification(notification)) {
      return t("notifications.commentRepliedTitle", "New reply");
    }
    return notification.title;
  };

  const getNotificationMessage = (notification: NotificationItem) => {
    const studentLabel =
      notification.studentName || t("common.unknown", "Unknown");

    if (isAddedNotification(notification)) {
      return t("notifications.commentAddedMessage", {
        student: studentLabel,
        defaultValue: "A new comment was added for {{student}}.",
      });
    }

    if (isReplyNotification(notification)) {
      return t("notifications.commentRepliedMessage", {
        student: studentLabel,
        defaultValue: "A new reply was added in {{student}} comments.",
      });
    }

    return notification.message;
  };

  const getNotificationActionHint = (notification: NotificationItem) => {
    const hasStudent = Boolean(notification.studentId);
    const hasCommentDate = Boolean(notification.commentDate);

    if ((user?.role === "parent" || user?.role === "user") && hasStudent) {
      return t(
        "notifications.openParentCommentsHint",
        "Click to open student comments",
      );
    }

    if (hasStudent || hasCommentDate) {
      return t(
        "notifications.openAttendanceCommentsHint",
        "Click to open attendance comments",
      );
    }

    return "";
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
      } catch {
        // Continue navigation even if mark-as-read fails
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: 1 } : n)),
      );
    }

    await loadUnreadCount();
    if (showModalRef.current) {
      await loadNotifications(unreadOnlyRef.current);
    }

    setShowModal(false);

    const navTimestamp = String(Date.now());
    const normalizedCommentDate = notification.commentDate
      ? formatDateForInput(notification.commentDate)
      : null;
    const hasStudent = Boolean(notification.studentId);

    if ((user?.role === "parent" || user?.role === "user") && hasStudent) {
      const params = new URLSearchParams({
        openComments: "1",
        studentId: String(notification.studentId),
        notificationId: String(notification.id),
        ts: navTimestamp,
      });
      if (normalizedCommentDate) {
        params.set("date", normalizedCommentDate);
      }
      navigate(`/parent-dashboard?${params.toString()}`);
      return;
    }

    if (normalizedCommentDate || hasStudent) {
      const params = new URLSearchParams({
        notificationId: String(notification.id),
        ts: navTimestamp,
      });
      if (normalizedCommentDate) {
        params.set("commentsDate", normalizedCommentDate);
      }
      if (hasStudent) {
        params.set("studentId", String(notification.studentId));
        params.set("openComments", "1");
      }
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
                          {getNotificationTitle(notification)}
                        </span>
                        {notification.studentName && (
                          <small className="text-muted ms-2">
                            <i className="bi bi-person-vcard me-1"></i>
                            {notification.studentName}
                          </small>
                        )}
                      </div>
                      <small className="text-muted d-block notification-message">
                        {getNotificationMessage(notification)}
                      </small>
                      {getNotificationActionHint(notification) && (
                        <small className="notification-action-hint d-inline-flex align-items-center mt-1">
                          <i className="bi bi-cursor-fill me-1"></i>
                          {getNotificationActionHint(notification)}
                        </small>
                      )}
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
