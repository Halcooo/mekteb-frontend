import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Form,
  Alert,
  Badge,
  Spinner,
  Modal,
  ListGroup,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { commentsApi } from "../api/commentsApi";
import { studentApi } from "../students/studentApi";
import type { StudentComment } from "../api/commentsApi";
import type { Student } from "../students/studentApi";
import "./DailyCommentsAdmin.scss";

const DailyCommentsAdmin: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [comments, setComments] = useState<StudentComment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  // Load students
  const loadStudents = useCallback(async () => {
    try {
      const response = await studentApi.getAll({ limit: 1000 }); // Get all students
      setStudents(response.data);
    } catch (error) {
      console.error("Error loading students:", error);
      setError(t("comments.errorLoadingStudents", "Failed to load students"));
    }
  }, [t]);

  // Load comments for the selected date
  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedComments = await commentsApi.getDailyComments(selectedDate);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error loading daily comments:", error);
      setError(t("comments.errorLoading", "Failed to load comments"));
    } finally {
      setLoading(false);
    }
  }, [selectedDate, t]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Handle adding a new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !commentText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const newComment = await commentsApi.createComment({
        studentId: selectedStudent.id,
        content: commentText.trim(),
        date: selectedDate,
      });

      // Add the new comment to the list
      setComments((prev) => [...prev, newComment]);

      // Reset form
      setCommentText("");
      setSelectedStudent(null);
      setShowAddModal(false);

      setSuccess(t("comments.commentSuccess", "Comment added successfully"));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding comment:", error);
      setError(t("comments.commentError", "Failed to add comment"));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter students based on search and grade
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchTerm === "" ||
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      student.gradeLevel.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade =
      selectedGrade === "" || student.gradeLevel === selectedGrade;

    return matchesSearch && matchesGrade;
  });

  // Get unique grades for filter
  const availableGrades = [
    ...new Set(students.map((s) => s.gradeLevel)),
  ].sort();

  // Group comments by student
  const commentsByStudent = comments.reduce((acc, comment) => {
    const key = comment.studentId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(comment);
    return acc;
  }, {} as Record<number, StudentComment[]>);

  // Get students who already have comments for this date
  const studentsWithComments = students.filter(
    (student) => commentsByStudent[student.id]?.length > 0
  );

  // Get students without comments for this date
  const studentsWithoutComments = filteredStudents.filter(
    (student) => !commentsByStudent[student.id]?.length
  );

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="daily-comments-admin">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-comments me-2"></i>
                  {t("comments.dailyManagement", "Daily Comments Management")}
                </h5>
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                  <i className="fas fa-plus me-2"></i>
                  {t("comments.addComment", "Add Comment")}
                </Button>
              </div>
            </Card.Header>

            <Card.Body>
              {/* Date Selection */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      {t("comments.selectDate", "Select Date")}
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-end">
                    <Badge bg="info" className="fs-6">
                      {studentsWithComments.length}{" "}
                      {t(
                        "comments.studentsWithComments",
                        "students with comments"
                      )}
                    </Badge>
                  </div>
                </Col>
              </Row>

              {/* Error/Success Messages */}
              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              {success && (
                <Alert
                  variant="success"
                  dismissible
                  onClose={() => setSuccess(null)}
                >
                  {success}
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" className="me-2" />
                  {t("comments.loading", "Loading comments...")}
                </div>
              ) : (
                <>
                  {/* Comments List */}
                  {studentsWithComments.length > 0 ? (
                    <ListGroup variant="flush">
                      {studentsWithComments.map((student) => (
                        <ListGroup.Item
                          key={student.id}
                          className="comment-item"
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">
                                {student.firstName} {student.lastName}
                                <Badge bg="secondary" className="ms-2">
                                  {student.gradeLevel}
                                </Badge>
                              </h6>

                              {commentsByStudent[student.id]?.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="comment-content mb-2"
                                >
                                  <div className="d-flex justify-content-between align-items-start">
                                    <p className="mb-1">{comment.content}</p>
                                    <small className="text-muted">
                                      {comment.authorName} -{" "}
                                      {formatTime(comment.createdAt)}
                                    </small>
                                  </div>

                                  {/* Show replies count if any */}
                                  {comment.repliesCount &&
                                    comment.repliesCount > 0 && (
                                      <small className="text-success">
                                        <i className="fas fa-reply me-1"></i>
                                        {comment.repliesCount}{" "}
                                        {t("comments.replies", "replies")}
                                      </small>
                                    )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="fas fa-comment-slash fa-2x mb-2"></i>
                      <p>
                        {t(
                          "comments.noCommentsForDate",
                          "No comments for this date"
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Comment Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("comments.addComment", "Add Comment")}</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleAddComment}>
          <Modal.Body>
            {/* Student Selection */}
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {t("comments.searchStudent", "Search Student")}
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="fas fa-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder={t(
                        "comments.searchPlaceholder",
                        "Search by name or grade..."
                      )}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {t("comments.filterGrade", "Filter by Grade")}
                  </Form.Label>
                  <Form.Select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="">
                      {t("comments.allGrades", "All Grades")}
                    </option>
                    {availableGrades.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Student List */}
            <Form.Group className="mb-3">
              <Form.Label>
                {t("comments.selectStudent", "Select Student")}
              </Form.Label>
              <div
                className="student-list"
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {studentsWithoutComments.length === 0 ? (
                  <div className="text-center text-muted py-3">
                    {searchTerm || selectedGrade
                      ? t(
                          "comments.noMatchingStudents",
                          "No matching students found"
                        )
                      : t(
                          "comments.allStudentsHaveComments",
                          "All students have comments for this date"
                        )}
                  </div>
                ) : (
                  studentsWithoutComments.map((student) => (
                    <div
                      key={student.id}
                      className={`student-item p-2 border rounded mb-2 cursor-pointer ${
                        selectedStudent?.id === student.id
                          ? "bg-primary text-white"
                          : "bg-light"
                      }`}
                      onClick={() => setSelectedStudent(student)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex justify-content-between">
                        <span>
                          {student.firstName} {student.lastName}
                        </span>
                        <Badge
                          bg={
                            selectedStudent?.id === student.id
                              ? "light"
                              : "secondary"
                          }
                        >
                          {student.gradeLevel}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Form.Group>

            {/* Comment Text */}
            <Form.Group>
              <Form.Label>
                {t("comments.commentContent", "Comment Content")}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t(
                  "comments.commentPlaceholder",
                  "Type your comment here..."
                )}
                required
                disabled={!selectedStudent}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              disabled={submitting}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting || !selectedStudent || !commentText.trim()}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {t("comments.submitting", "Submitting...")}
                </>
              ) : (
                t("comments.submitComment", "Submit Comment")
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyCommentsAdmin;
