import { useEffect, useState } from "react";
import { Badge, Button, ListGroup, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  notificationsApi,
  type NotificationItem,
} from "../api/notificationsApi";
import { useAuth } from "../hooks/useAuth";

function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const items = await notificationsApi.getAll({ limit: 50 });
      setNotifications(items);
    } finally {
      setLoading(false);
    }
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
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  };

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
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Button variant="outline-secondary" size="sm" onClick={handleOpen}>
        <i className="bi bi-bell me-1"></i>
        {t("notifications.title", "Notifications")}
        {unreadCount > 0 && (
          <Badge bg="danger" className="ms-2">
            {unreadCount}
          </Badge>
        )}
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t("notifications.title", "Notifications")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-end mb-2">
            <Button variant="link" size="sm" onClick={handleMarkAllAsRead}>
              {t("notifications.markAllAsRead", "Mark all as read")}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              {t("notifications.loading", "Loading notifications...")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-muted text-center py-3">
              {t("notifications.empty", "No notifications")}
            </div>
          ) : (
            <ListGroup>
              {notifications.map((notification) => (
                <ListGroup.Item
                  key={notification.id}
                  action
                  onClick={() => handleNotificationClick(notification)}
                  className={notification.isRead ? "" : "fw-semibold"}
                >
                  <div className="d-flex justify-content-between">
                    <span>{notification.title}</span>
                    {!notification.isRead && (
                      <Badge bg="primary">
                        {t("notifications.new", "New")}
                      </Badge>
                    )}
                  </div>
                  <small className="text-muted d-block">
                    {notification.message}
                  </small>
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
