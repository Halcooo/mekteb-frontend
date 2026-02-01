import React from "react";
import { Card, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { NewsItem } from "../types/index";
import { formatBosnianRelativeTime } from "../utils/dateFormatter";
import "./NewsCard.scss";

// Extract base URL (remove /api from the end if present)
const VITE_API_URL = import.meta.env.VITE_API_URL || "";
const API_BASE_URL = VITE_API_URL.endsWith("/api")
  ? VITE_API_URL.slice(0, -4)
  : VITE_API_URL;

interface NewsCardProps {
  item: NewsItem;
  isAdmin: boolean;
  onPreview: (item: NewsItem) => void;
  onEdit: (item: NewsItem) => void;
  onDelete: (item: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({
  item,
  isAdmin,
  onPreview,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  const handlePreviewClick = () => {
    onPreview(item);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item);
  };

  return (
    <Card className="news-card">
      {/* Image Display */}
      <div className="news-card-image-container">
        {item.images && item.images.length > 0 ? (
          <>
            <Card.Img
              variant="top"
              src={`${API_BASE_URL}${item.images[0].url}`}
              alt={item.title}
              className="news-card-image"
            />
            {item.images.length > 1 && (
              <div className="news-card-image-badge">
                <i className="bi bi-images news-card-icon me-1"></i>+
                {item.images.length - 1}
              </div>
            )}
          </>
        ) : (
          <div className="news-card-placeholder">
            <div>
              <i className="bi bi-newspaper icon"></i>
              <div className="text">{t("news", "News")}</div>
            </div>
          </div>
        )}
      </div>

      <Card.Body className="news-card-body">
        <div className="news-card-header">
          <Card.Title onClick={handlePreviewClick} className="news-card-title">
            {item.title}
          </Card.Title>
          {isAdmin && (
            <div className="news-card-admin-buttons">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{t("editNews", "Edit News")}</Tooltip>}
              >
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="news-card-admin-btn edit"
                  onClick={handleEditClick}
                >
                  <i className="bi bi-pencil-square"></i>
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{t("deleteNews", "Delete News")}</Tooltip>}
              >
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="news-card-admin-btn delete"
                  onClick={handleDeleteClick}
                >
                  <i className="bi bi-trash3"></i>
                </Button>
              </OverlayTrigger>
            </div>
          )}
        </div>

        <Card.Text className="news-card-text">
          {item.text.length > 120
            ? `${item.text.substring(0, 120)}...`
            : item.text}
        </Card.Text>

        {item.text.length > 120 && (
          <div className="news-card-read-more">
            <button
              className="news-card-read-more-btn"
              onClick={handlePreviewClick}
            >
              <i className="bi bi-arrow-right news-card-icon me-2"></i>
              {t("readMore", "Read more")}
            </button>
          </div>
        )}

        {/* Timestamp - always at bottom */}
        <div className="news-card-footer">
          <div className="footer-content">
            {item.createdAt && (
              <small className="timestamp">
                <i className="bi bi-clock news-card-icon me-1"></i>
                {formatBosnianRelativeTime(item.createdAt)}
              </small>
            )}
            {item.authorUsername && (
              <small className="author">
                <i className="bi bi-person news-card-icon me-1"></i>
                {item.authorUsername}
              </small>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default NewsCard;
