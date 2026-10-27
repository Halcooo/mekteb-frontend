import React from "react";
import { Modal, Button, Badge, Carousel } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { NewsItem } from "../types/index";
import { formatDate } from "../utils/dateUtils";
import "./PreviewNewsModal.scss";
const apiBase=(import.meta.env.VITE_API_URL??'').replace(/\/api\/?$/,'');

interface PreviewNewsModalProps {
  show: boolean;
  selectedNews: NewsItem | null;
  onHide: () => void;
}

const PreviewNewsModal: React.FC<PreviewNewsModalProps> = ({
  show,
  selectedNews,
  onHide,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="preview-news-modal"
    >
      <Modal.Header closeButton closeLabel={t("close")}>
        <Modal.Title className="d-flex align-items-center">
          <i className="bi bi-newspaper me-2"></i>
          {selectedNews?.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedNews && (
          <>
            {/* News Content */}
            <div className="mb-4">
              <p className="text-muted small mb-2">
                <i className="bi bi-person me-1"></i>
                {t("by", "By")}{" "}
                {selectedNews.authorUsername || t("unknown", "Unknown")}
                {selectedNews.createdAt && (
                  <>
                    {" • "}
                    <i className="bi bi-calendar me-1"></i>
                    {formatDate(selectedNews.createdAt,'short',i18n.language)}
                  </>
                )}
              </p>
              <div className="news-content">
                {selectedNews.text.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-3">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Image Gallery */}
            {selectedNews.images && selectedNews.images.length > 0 && (
              <div className="mb-3">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-images me-2"></i>
                  <h6 className="mb-0">{t("images", "Images")}</h6>
                  <Badge bg="secondary" className="ms-2">
                    {selectedNews.images.length}
                  </Badge>
                </div>

                {selectedNews.images.length === 1 ? (
                  <div className="text-center preview-image-frame">
                    <img
                      src={`${apiBase}${
                        selectedNews.images[0].url ||
                        `/api/images/${selectedNews.images[0].imagePath
                          ?.split("/")
                          .pop()}`
                      }`}
                      alt={selectedNews.title}
                      className="gallery-image preview-modal-image"
                    />
                  </div>
                ) : (
                  <Carousel prevLabel={t('previousImage')} nextLabel={t('nextImage')}>
                    {selectedNews.images.map((image, index) => (
                      <Carousel.Item key={image.id}>
                        <div className="text-center preview-image-frame">
                          <img
                            src={`${apiBase}${
                              image.url ||
                              `/api/images/${image.imagePath?.split("/").pop()}`
                            }`}
                            alt={`${selectedNews.title} ${index + 1}`}
                            className="preview-modal-image"
                          />
                        </div>
                        <Carousel.Caption className="bg-dark bg-opacity-75 rounded">
                          <p className="mb-0">
                            {t("imageNumber", "Image {{number}} of {{total}}", {
                              number: index + 1,
                              total: selectedNews.images?.length || 0,
                            })}
                          </p>
                        </Carousel.Caption>
                      </Carousel.Item>
                    ))}
                  </Carousel>
                )}
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="bi bi-x-circle me-2"></i>
          {t("close", "Close")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PreviewNewsModal;
