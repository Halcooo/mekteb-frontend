import { Container, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../hooks/useAuth";
// Import extracted components
import NewsCard from "./NewsCard";
import AddEditNewsModal from "./AddEditNewsModal";
import DeleteNewsModal from "./DeleteNewsModal";
import PreviewNewsModal from "./PreviewNewsModal";
import { useNewsOperations } from "./useNewsOperations";

function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Use the custom hook for all news operations
  const {
    // Modal states
    showAddModal,
    showEditModal,
    showDeleteModal,
    showPreviewModal,

    // Data states
    selectedNews,
    formData,
    imagePreviewUrls,

    // Mutation states
    isAddingNews,
    isEditingNews,
    isDeletingNews,

    // Handlers
    handleSubmit,
    handleInputChange,
    handleImageSelect,
    removeSelectedImage,
    handleDeleteImage,
    handleAddNews,
    handleEditNews,
    handleDeleteNews,
    handlePreviewNews,
    handleAddEditModalClose,
    handleDeleteModalClose,
    handlePreviewModalClose,
    handleConfirmDelete,
  } = useNewsOperations();

  // Fetch news with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["news"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get(`/news?page=${pageParam}&limit=10`);
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.data.length < 10) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const news = data?.pages.flatMap((page) => page.data) || [];

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (isLoading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t("loading")}</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {t("errorLoadingNews", "Error loading news. Please try again later.")}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container fluid className="px-2 px-md-3 mt-2 mt-md-4">
        {/* Mobile-responsive header */}
        <Row className="align-items-center mb-3 mb-md-5">
          <Col xs={12} md={8}>
            <h1
              className="mb-1 h2 h1-md"
              style={{ fontWeight: "700", color: "#2c3e50" }}
            >
              {t("news")}
            </h1>
            <p
              className="text-muted mb-2 mb-md-0 small"
              style={{ fontSize: "0.95rem" }}
            >
              {t("latestUpdates", "Najnovije vijesti i obavještenja")}
            </p>
          </Col>
          {isAdmin && (
            <Col xs={12} md={4} className="text-start text-md-end">
              <Button
                variant="primary"
                onClick={handleAddNews}
                className="d-flex d-md-inline-flex align-items-center px-3 px-md-4 py-2 shadow-sm w-100 w-md-auto"
                style={{
                  borderRadius: "0.5rem",
                  fontWeight: "500",
                  fontSize: "0.9rem",
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                <span className="d-none d-md-inline">
                  {t("addNews", "Add News")}
                </span>
                <span className="d-md-none">
                  {t("add", "Add")} {t("news", "News")}
                </span>
              </Button>
            </Col>
          )}
        </Row>

        <Row className="g-3 g-md-4">
          {news && news.length > 0 ? (
            news.map((item) => (
              <Col key={item.id} xs={12} sm={6} lg={4} className="d-flex">
                <NewsCard
                  item={item}
                  isAdmin={isAdmin}
                  onPreview={handlePreviewNews}
                  onEdit={handleEditNews}
                  onDelete={handleDeleteNews}
                />
              </Col>
            ))
          ) : (
            <Col xs={12}>
              <div className="text-center py-5 my-5">
                <div className="mb-4">
                  <i
                    className="bi bi-newspaper"
                    style={{ fontSize: "4rem", color: "#6c757d" }}
                  ></i>
                </div>
                <h4 className="text-muted mb-3">
                  {t("noNewsAvailable", "No news available.")}
                </h4>
                <p className="text-muted" style={{ fontSize: "1.1rem" }}>
                  {t(
                    "noNewsDescription",
                    "Trenutno nema objavljenih vijesti. Provjerite kasnije."
                  )}
                </p>
                {isAdmin && (
                  <Button
                    variant="primary"
                    onClick={handleAddNews}
                    className="mt-3 px-4 py-2"
                    style={{ borderRadius: "0.5rem" }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    {t("addFirstNews", "Dodaj prvu vijest")}
                  </Button>
                )}
              </div>
            </Col>
          )}
        </Row>

        {/* Loading indicator for infinite scroll */}
        {isFetchingNextPage && (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">{t("loading")}</span>
            </Spinner>
          </div>
        )}
      </Container>

      {/* Add/Edit News Modal */}
      <AddEditNewsModal
        show={showAddModal || showEditModal}
        isEditMode={showEditModal}
        selectedNews={selectedNews}
        formData={formData}
        imagePreviewUrls={imagePreviewUrls}
        isLoading={isAddingNews || isEditingNews}
        onHide={handleAddEditModalClose}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        onImageSelect={handleImageSelect}
        onRemoveSelectedImage={removeSelectedImage}
        onDeleteExistingImage={handleDeleteImage}
      />

      {/* Delete Confirmation Modal */}
      <DeleteNewsModal
        show={showDeleteModal}
        selectedNews={selectedNews}
        isLoading={isDeletingNews}
        onHide={handleDeleteModalClose}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* News Preview Modal */}
      <PreviewNewsModal
        show={showPreviewModal}
        selectedNews={selectedNews}
        onHide={handlePreviewModalClose}
      />
    </>
  );
}

export default Home;
