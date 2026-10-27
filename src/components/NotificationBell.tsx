import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, ListGroup, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  notificationsApi,
  type NotificationItem,
} from "../api/notificationsApi";
import { useAuth } from "../hooks/useAuth";

import "./NotificationBell.scss";
import { formatDate, formatRelativeTime } from '../utils/dateUtils';

function NotificationBell() {
  const { t, i18n } = useTranslation();
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const showModalRef = useRef(false);
  const unreadOnlyRef = useRef(false);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
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
    setLoadError(false);
    try {
      const items = await notificationsApi.getAll({
        limit: 50,
        unreadOnly: onlyUnread,
      });
      setNotifications(items);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const getNotificationsWsUrl = useCallback(() => {
    try {
      if (!accessToken || !import.meta.env.VITE_API_URL) {
        return null;
      }

      const apiUrl = new URL(import.meta.env.VITE_API_URL as string,window.location.origin);
      const wsProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${apiUrl.host}/backend/ws/notifications`;
    } catch {
      return null;
    }
  }, [accessToken]);

  useEffect(() => {
    if (!user) {
      return;
    }

    loadUnreadCount();
    const onChange = () => { void loadUnreadCount(); if (showModalRef.current) void loadNotifications(unreadOnlyRef.current); };
    window.addEventListener("mekteb:notifications", onChange);
    const interval = window.setInterval(loadUnreadCount, 20000);

    return () => { window.clearInterval(interval); window.removeEventListener("mekteb:notifications", onChange); };
  }, [user, loadUnreadCount, loadNotifications]);

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
      socket.onopen = () => { reconnectAttempts.current=0; socket.send(JSON.stringify({type:'authenticate',accessToken})); };

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

          if (payload.type === 'ready') { void loadUnreadCount(); return; }
          if (payload.type === "notification:new") {
            window.dispatchEvent(new Event('mekteb:chat'));
            // Instant visual feedback, then sync from API.

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

        const delay=Math.min(30_000,1000*2**reconnectAttempts.current++)+Math.random()*500;
        reconnectTimeoutRef.current = window.setTimeout(connect, delay);
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
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: 1 } : n)),
        );
      } catch {
        // Continue navigation even if mark-as-read fails
      }
    }

    await loadUnreadCount();
    if (showModalRef.current) {
      await loadNotifications(unreadOnlyRef.current);
    }

    setShowModal(false);

    navigate(`/messages?notificationId=${notification.id}`);
  };
  const handleMarkAllAsRead = async () => {
    try {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
    setUnreadCount(0);
    if (unreadOnly) {
      setNotifications([]);
    }
    } catch { setLoadError(true); }
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
        aria-label={unreadCount>0?`${t('notifications.title')}: ${t('chat.unreadCount',{count:unreadCount})}`:t('notifications.title')}
        title={t('notifications.title')}
      >
        <i className="bi bi-bell" aria-hidden="true"></i>
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
        <Modal.Header closeButton closeLabel={t("close")}>
          <Modal.Title>{t("notifications.title", "Notifications")}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="notifications-modal-body">
          {loadError&&<Alert variant="warning">{t('chat.loadError')} <Button variant="link" onClick={()=>void loadNotifications(unreadOnly)}>{t('chat.retry')}</Button></Alert>}
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
                  <div className="notification-item-layout">
                    <div className="notification-item-content">
                      <div className="notification-header-row">
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
                        <small className="text-muted nb-time-label" title={formatDate(notification.createdAt,'dateTime',i18n.language)}>
                          <i className="bi bi-clock me-1"></i>
                          {formatRelativeTime(notification.createdAt,i18n.language)}
                        </small>
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
                    </div>
                    {!notification.isRead && (
                      <Badge
                        bg="primary"
                        pill
                        className="notification-new-badge"
                      >
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
