import {
  Row,
  Col,
  Form,
  InputGroup,
  Pagination,
  Button,
  Card,
} from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  studentApi,
  type UpdateStudentData,
  type CreateStudentData,
} from "./studentApi";
import EditableGrid from "./EditableGrid";
import PageLayout from "../components/PageLayout";

function Students() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch students query with pagination and search
  const {
    data: studentsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["students", currentPage, pageSize, debouncedSearchTerm],
    queryFn: () =>
      studentApi.getAll({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm,
      }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const students = studentsResponse?.data || [];
  const pagination = studentsResponse?.pagination;

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentData }) =>
      studentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      console.error("Update student error:", error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: studentApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      console.error("Delete student error:", error);
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      console.error("Create student error:", error);
    },
  });

  // Handle update
  const handleUpdate = async (
    id: number,
    data: UpdateStudentData
  ): Promise<void> => {
    await updateMutation.mutateAsync({ id, data });
  };

  // Handle delete
  const handleDelete = async (id: number): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  };

  // Handle create
  const handleCreate = async (data: CreateStudentData): Promise<void> => {
    await createMutation.mutateAsync(data);
  };

  return (
    <PageLayout
      title={
        <span>
          <i className="bi bi-people"></i>
          {t("studentsManagement", "Students Management")}
        </span>
      }
      subtitle={t("studentsList", "Manage students information and records")}
      className="students-container"
    >
      {/* Search and Filter Section */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-3">
          <Row className="g-2 g-md-3">
            <Col xs={12} md={8} lg={9}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={t(
                    "searchStudents",
                    "Search students by name, grade..."
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x-lg"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col xs={12} md={4} lg={3} className="text-end">
              {pagination && (
                <small className="text-muted d-block">
                  <span className="d-none d-md-inline">
                    {t(
                      "showingResults",
                      "Showing {{start}} to {{end}} of {{total}} students",
                      {
                        start:
                          (pagination.currentPage - 1) *
                            pagination.itemsPerPage +
                          1,
                        end: Math.min(
                          pagination.currentPage * pagination.itemsPerPage,
                          pagination.totalItems
                        ),
                        total: pagination.totalItems,
                      }
                    )}
                  </span>
                  <span className="d-md-none">
                    {pagination.totalItems} {t("students", "students")}
                  </span>
                </small>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Editable Grid */}
      <EditableGrid
        students={students || []}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onCreate={handleCreate}
        loading={isLoading}
        error={error?.message || null}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Row className="mt-3 mt-md-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-2 p-md-3">
                {/* Mobile pagination */}
                <div className="d-md-none">
                  <Row className="align-items-center">
                    <Col xs={4}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={!pagination.hasPrevPage}
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        className="w-100"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </Button>
                    </Col>
                    <Col xs={4} className="text-center">
                      <small className="text-muted">
                        {t("page", "Page")} {currentPage} {t("of", "of")}{" "}
                        {pagination.totalPages}
                      </small>
                    </Col>
                    <Col xs={4}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={!pagination.hasNextPage}
                        onClick={() =>
                          setCurrentPage(
                            Math.min(pagination.totalPages, currentPage + 1)
                          )
                        }
                        className="w-100"
                      >
                        <i className="bi bi-chevron-right"></i>
                      </Button>
                    </Col>
                  </Row>
                </div>

                {/* Desktop pagination */}
                <div className="d-none d-md-flex justify-content-center">
                  <Pagination className="mb-0">
                    <Pagination.First
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setCurrentPage(1)}
                      title={t("firstPage", "First page")}
                    />
                    <Pagination.Prev
                      disabled={!pagination.hasPrevPage}
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      title={t("previousPage", "Previous page")}
                    />

                    {/* Page numbers */}
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const startPage = Math.max(1, currentPage - 2);
                        const pageNum = startPage + i;

                        if (pageNum > pagination.totalPages) return null;

                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      }
                    )}

                    <Pagination.Next
                      disabled={!pagination.hasNextPage}
                      onClick={() =>
                        setCurrentPage(
                          Math.min(pagination.totalPages, currentPage + 1)
                        )
                      }
                      title={t("nextPage", "Next page")}
                    />
                    <Pagination.Last
                      disabled={!pagination.hasNextPage}
                      onClick={() => setCurrentPage(pagination.totalPages)}
                      title={t("lastPage", "Last page")}
                    />
                  </Pagination>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </PageLayout>
  );
}

export default Students;
