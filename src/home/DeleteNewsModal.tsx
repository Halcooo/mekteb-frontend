import React from "react";
import { Modal, Button, Card, Spinner, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { NewsItem } from "../types/index";
import { formatDate } from "../utils/dateUtils";

interface DeleteNewsModalProps {
  error?:string|null;
  show: boolean;
  selectedNews: NewsItem | null;
  isLoading: boolean;
  onHide: () => void;
  onConfirmDelete: () => void;
}

const DeleteNewsModal: React.FC<DeleteNewsModalProps> = ({
  show,
  error,
  selectedNews,
  isLoading,
  onHide,
  onConfirmDelete,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton closeLabel={t("close")}>
        <Modal.Title>{t("confirmDeleteTitle")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error&&<Alert variant="danger">{error}</Alert>}
        <p>
          {t(
            "confirmDeleteNews",
            "Are you sure you want to delete this news item?"
          )}
        </p>
        {selectedNews && (
          <Card className="mt-2">
            <Card.Body>
              <Card.Title>{selectedNews.title}</Card.Title>
              <Card.Text className="text-muted">
                {selectedNews.text.length > 100
                  ? `${selectedNews.text.substring(0, 100)}...`
                  : selectedNews.text}
              </Card.Text>
              {selectedNews.createdAt && (
                <small className="text-muted">
                  <i className="bi bi-calendar me-1"></i>
                  {formatDate(selectedNews.createdAt,'short',i18n.language)}
                </small>
              )}
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="bi bi-x-circle me-2"></i>
          {t("cancel")}
        </Button>
        <Button variant="danger" onClick={onConfirmDelete} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {t("deleting", "Deleting...")}
            </>
          ) : (
            <>
              <i className="bi bi-trash me-2"></i>
              {t("delete")}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteNewsModal;
