import React from "react";
import { Card, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { NewsItem } from "../types/index";
import { formatBosnianRelativeTime } from "../utils/dateFormatter";

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

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 0.5rem 1rem rgba(0, 0, 0, 0.15)";
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)";
  };

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
    <Card
      className="h-100 shadow-sm border-0"
      style={{
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
      }}
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
    >
      {/* Image Display */}
      <div
        className="position-relative"
        style={{
          height: window.innerWidth < 768 ? "180px" : "200px",
          backgroundColor: "#f8f9fa",
        }}
      >
        {item.images && item.images.length > 0 ? (
          <>
            <Card.Img
              variant="top"
              src={`http://localhost:5000${
                item.images[0].url ||
                `/api/images/${item.images[0].imagePath?.split("/").pop()}`
              }`}
              alt={item.title}
              style={{
                height: "200px",
                objectFit: "cover",
                borderTopLeftRadius: "0.375rem",
                borderTopRightRadius: "0.375rem",
              }}
            />
            {item.images.length > 1 && (
              <div
                className="position-absolute top-0 end-0 m-3 bg-dark bg-opacity-75 text-white px-2 py-1 rounded-pill"
                style={{ fontSize: "0.75rem", fontWeight: "500" }}
              >
                <i className="bi bi-images me-1"></i>+{item.images.length - 1}
              </div>
            )}
          </>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center h-100"
            style={{
              borderTopLeftRadius: "0.375rem",
              borderTopRightRadius: "0.375rem",
            }}
          >
            <div className="text-center text-muted">
              <i className="bi bi-newspaper" style={{ fontSize: "2rem" }}></i>
              <div className="mt-2" style={{ fontSize: "0.9rem" }}>
                {t("news", "News")}
              </div>
            </div>
          </div>
        )}
      </div>

      <Card.Body className="d-flex flex-column" style={{ minHeight: "200px" }}>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <Card.Title
            style={{
              cursor: "pointer",
              fontSize: "1.1rem",
              fontWeight: "600",
              lineHeight: "1.3",
              marginBottom: "0",
              minHeight: "2.6rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            onClick={handlePreviewClick}
            className="text-primary"
          >
            {item.title}
          </Card.Title>
          {isAdmin && (
            <div className="d-flex gap-1 ms-2">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{t("editNews", "Edit News")}</Tooltip>}
              >
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="rounded-circle d-flex align-items-center justify-content-center border-0"
                  style={{
                    width: "30px",
                    height: "30px",
                    fontSize: "0.8rem",
                    backgroundColor: "rgba(13, 110, 253, 0.1)",
                  }}
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
                  className="rounded-circle d-flex align-items-center justify-content-center border-0"
                  style={{
                    width: "30px",
                    height: "30px",
                    fontSize: "0.8rem",
                    backgroundColor: "rgba(220, 53, 69, 0.1)",
                  }}
                  onClick={handleDeleteClick}
                >
                  <i className="bi bi-trash3"></i>
                </Button>
              </OverlayTrigger>
            </div>
          )}
        </div>

        <Card.Text
          className="flex-grow-1"
          style={{
            fontSize: "0.95rem",
            lineHeight: "1.5",
            minHeight: "4.5rem",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "1rem",
          }}
        >
          {item.text.length > 120
            ? `${item.text.substring(0, 120)}...`
            : item.text}
        </Card.Text>

        {item.text.length > 120 && (
          <div className="mb-3">
            <Button
              variant="outline-primary"
              size="sm"
              className="px-3"
              style={{
                fontSize: "0.85rem",
                borderRadius: "1rem",
              }}
              onClick={handlePreviewClick}
            >
              <i className="bi bi-arrow-right me-2"></i>
              {t("readMore", "Read more")}
            </Button>
          </div>
        )}

        {/* Timestamp - always at bottom */}
        <div
          className="mt-auto pt-3 border-top"
          style={{ borderColor: "#dee2e6" }}
        >
          <div className="d-flex justify-content-between align-items-center">
            {item.createdAt && (
              <small className="text-muted d-flex align-items-center">
                <i className="bi bi-clock me-1"></i>
                {formatBosnianRelativeTime(item.createdAt)}
              </small>
            )}
            {item.authorUsername && (
              <small className="text-muted d-flex align-items-center">
                <i className="bi bi-person me-1"></i>
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
