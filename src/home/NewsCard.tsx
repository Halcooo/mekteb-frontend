import React, { useState } from "react";
import { Card, Button, OverlayTrigger, Tooltip, Modal } from "react-bootstrap";
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
  onEdit: (item: NewsItem) => void;
  onDelete: (item: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({
  item,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageCount = item.images?.length || 0;
  const canOpenGallery = imageCount > 0 || item.text.trim().length > 0;

  const handlePreviewClick = () => {
    if (!canOpenGallery) {
      return;
    }

    setCurrentImageIndex(0);
    setShowGallery(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (item.images?.length || 1) - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (item.images?.length || 1) - 1 ? 0 : prev + 1,
    );
  };

  return (
    <>
      <Card
        className="news-card"
        onClick={handlePreviewClick}
        style={{ cursor: canOpenGallery ? "pointer" : "default" }}
      >
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
            <Card.Title className="news-card-title">{item.title}</Card.Title>
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

          {/* Timestamp - always at bottom */}
          <div className="news-card-footer">
            <div className="footer-content">
              {item.createdAt && (
                <small className="timestamp">
                  <i className="bi bi-clock news-card-icon me-1"></i>
                  {formatBosnianRelativeTime(item.createdAt)}
                </small>
              )}
              {(item.authorName || item.authorUsername) && (
                <small className="author">
                  <i className="bi bi-person news-card-icon me-1"></i>
                  {item.authorName || item.authorUsername}
                </small>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Image Gallery Modal */}
      <Modal
        show={showGallery}
        onHide={() => setShowGallery(false)}
        size="lg"
        scrollable
        centered
        className="news-gallery-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{item.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="news-gallery-body">
          {item.images && item.images[currentImageIndex] && (
            <>
              <img
                src={`${API_BASE_URL}${item.images[currentImageIndex].url}`}
                alt={`${item.title} - ${currentImageIndex + 1}`}
                className="gallery-image"
              />
              <div className="gallery-controls">
                <Button
                  variant="secondary"
                  onClick={handlePrevImage}
                  className="gallery-btn-prev"
                  disabled={imageCount <= 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </Button>
                <span className="gallery-counter">
                  {currentImageIndex + 1} / {imageCount}
                </span>
                <Button
                  variant="secondary"
                  onClick={handleNextImage}
                  className="gallery-btn-next"
                  disabled={imageCount <= 1}
                >
                  <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </>
          )}

          {item.text.trim().length > 0 && (
            <div className="gallery-text-block mt-1">
              {item.text.split("\n").map((paragraph, index) => (
                <p key={`${item.id}-text-${index}`}>{paragraph}</p>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default NewsCard;
