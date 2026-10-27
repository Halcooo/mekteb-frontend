import React from "react";
import { Modal, Form, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { NewsItem } from "../types/index";
import "./AddEditNewsModal.scss";
const apiBase=(import.meta.env.VITE_API_URL??'').replace(/\/api\/?$/,'');

interface AddEditNewsModalProps {
  error?:string|null;
  show: boolean;
  isEditMode: boolean;
  selectedNews: NewsItem | null;
  formData: {
    title: string;
    text: string;
  };
  imagePreviewUrls: string[];
  isLoading: boolean;
  onHide: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSelectedImage: (index: number) => void;
  onDeleteExistingImage: (imageId: number) => void;
}

const AddEditNewsModal: React.FC<AddEditNewsModalProps> = ({
  show,
  error,
  isEditMode,
  selectedNews,
  formData,
  imagePreviewUrls,
  isLoading,
  onHide,
  onSubmit,
  onInputChange,
  onImageSelect,
  onRemoveSelectedImage,
  onDeleteExistingImage,
}) => {
  const { t } = useTranslation();

  return (
    <Modal show={show} onHide={()=>{if(!isLoading)onHide();}} backdrop={isLoading?'static':true} keyboard={!isLoading}>
      <Modal.Header closeButton closeLabel={t("close")}>
        <Modal.Title>
          {isEditMode ? t("editNews", "Edit News") : t("addNews", "Add News")}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          {error&&<Alert variant="danger" role="alert">{error}</Alert>}
          <Form.Group className="mb-3" controlId="news-title">
            <Form.Label>{t("title", "Title")}</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              placeholder={t("enterNewsTitle", "Enter news title")}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="news-content">
            <Form.Label>{t("content", "Content")}</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="text"
              value={formData.text}
              onChange={onInputChange}
              placeholder={t("enterNewsContent", "Enter news content")}
              required
            />
          </Form.Group>

          {/* Image Upload Section */}
          <Form.Group className="mb-3" controlId="news-images">
            <Form.Label>{t("images", "Images")}</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={onImageSelect}
              className="mb-2"
            />
            <Form.Text className="text-muted">
              {t("maxImagesAllowed", "Maximum 5 images allowed")} (
              {t("maxFileSize", "Max {{size}}MB each", { size: 5 })})
            </Form.Text>

            {/* Image Previews */}
            {imagePreviewUrls.length > 0 && (
              <div className="mt-3">
                <h6>{t("imagePreview", "Image Preview")}</h6>
                <Row>
                  {imagePreviewUrls.map((url, index) => (
                    <Col key={index} xs={6} md={4} className="mb-2">
                      <div className="image-preview">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="preview-image img-fluid rounded"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="remove-image-btn"
                          onClick={() => onRemoveSelectedImage(index)}
                        >
                          <i className="bi bi-x"></i>
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Form.Group>

          {/* Existing Images (for edit mode) */}
          {isEditMode &&
            selectedNews?.images &&
            selectedNews.images.length > 0 && (
              <div className="mb-3">
                <h6>{t("existingImages", "Existing Images")}</h6>
                <Row>
                  {selectedNews.images.map((image) => (
                    <Col key={image.id} xs={6} md={4} className="mb-2">
                      <div className="image-preview">
                        <img
                          src={`${apiBase}${
                            image.url ||
                            `/api/images/${image.imagePath?.split("/").pop()}`
                          }`}
                          alt={image.originalName}
                          className="preview-image img-fluid rounded"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="remove-image-btn"
                          onClick={() => onDeleteExistingImage(image.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isLoading}>
            <i className="bi bi-x-circle me-2"></i>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {t("saving", "Saving...")}
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                {t("save")}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddEditNewsModal;
