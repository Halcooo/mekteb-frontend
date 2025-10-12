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
import PageLayout from "../components/PageLayout";
import { useNewsOperations } from "./useNewsOperations";
import "./Home.scss";

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
      <PageLayout
        title={
          <span>
            <i className="bi bi-newspaper"></i>
            {t("news")}
          </span>
        }
        subtitle={t("latestUpdates", "Najnovije vijesti i obavještenja")}
        className="home-container"
      >
        {isAdmin && (
          <div className="d-flex justify-content-end mb-4">
            <Button
              variant="primary"
              onClick={handleAddNews}
              className="home-add-btn"
            >
              <i className="bi bi-plus-circle me-2"></i>
              <span className="d-none d-sm-inline">
                {t("addNews", "Add News")}
              </span>
              <span className="d-inline d-sm-none">{t("add", "Add")}</span>
            </Button>
          </div>
        )}

        <Row className="home-news-grid">
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
              <div className="home-empty-state">
                <div>
                  <i className="bi bi-newspaper empty-icon"></i>
                </div>
                <h4 className="empty-title">
                  {t("noNewsAvailable", "No news available.")}
                </h4>
                <p className="empty-description">
                  {t(
                    "noNewsDescription",
                    "Trenutno nema objavljenih vijesti. Provjerite kasnije."
                  )}
                </p>
                {isAdmin && (
                  <Button
                    variant="primary"
                    onClick={handleAddNews}
                    className="empty-add-btn"
                  >
                    <i className="bi bi-plus-circle icon"></i>
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
      </PageLayout>

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
