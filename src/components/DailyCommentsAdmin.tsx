import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { formatDateForInput } from "../utils/dateFormatter";
import DateBox from "./DateBox";
import "./DailyCommentsAdmin.scss";

interface DailyCommentsAdminProps {
  initialDate?: string;
  initialStudentId?: number;
  autoOpenAddModal?: boolean;
}

const DailyCommentsAdmin: React.FC<DailyCommentsAdminProps> = ({
  initialDate,
  initialStudentId,
  autoOpenAddModal = false,
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(
    initialDate || formatDateForInput(new Date()),
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
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const lastAutoOpenKeyRef = useRef<string>("");

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

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (!autoOpenAddModal || !initialStudentId || students.length === 0) {
      return;
    }

    const key = `${initialDate || ""}-${initialStudentId}-${autoOpenAddModal}`;
    if (lastAutoOpenKeyRef.current === key) {
      return;
    }

    const matchedStudent = students.find((s) => s.id === initialStudentId);
    if (!matchedStudent) {
      return;
    }

    setSelectedStudent(matchedStudent);
    setShowAddModal(true);
    lastAutoOpenKeyRef.current = key;
  }, [autoOpenAddModal, initialStudentId, students, initialDate]);

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

  const handleReplyComment = async (
    e: React.FormEvent,
    parentComment: StudentComment,
  ) => {
    e.preventDefault();
    const replyText = (replyTexts[parentComment.id] || "").trim();
    if (!replyText) return;

    setSubmitting(true);
    setError(null);

    try {
      const newReply = await commentsApi.createComment({
        studentId: parentComment.studentId,
        content: replyText,
        date: selectedDate,
        parentCommentId: parentComment.id,
      });

      setComments((prev) => [...prev, newReply]);
      setReplyTexts((prev) => ({ ...prev, [parentComment.id]: "" }));
      setActiveReplyId(null);
      setSuccess(t("comments.replySuccess", "Reply added successfully"));

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Error replying to comment:", error);
      setError(t("comments.replyError", "Failed to submit reply"));
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
  const commentsByStudent = comments.reduce(
    (acc, comment) => {
      const key = comment.studentId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(comment);
      return acc;
    },
    {} as Record<number, StudentComment[]>,
  );

  // Get students who already have comments for this date
  const studentsWithComments = students.filter(
    (student) => commentsByStudent[student.id]?.length > 0,
  );

  // Get students without comments for this date
  const studentsWithoutComments = filteredStudents.filter(
    (student) => !commentsByStudent[student.id]?.length,
  );

  const roleVariant = (role: StudentComment["authorRole"]) => {
    if (role === "admin") return "primary";
    if (role === "teacher") return "secondary";
    return "success";
  };

  const roleLabel = (role: StudentComment["authorRole"]) => {
    if (role === "admin") return t("comments.admin", "Admin");
    if (role === "teacher") return t("comments.teacher", "Teacher");
    return t("comments.parent", "Parent");
  };

  return (
    <div className="daily-comments-admin">
      <Row>
        <Col>
          <Card className="daily-comments-card">
            <Card.Header className="daily-comments-header">
              <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <h5 className="mb-0">
                  <i className="bi bi-chat-left-text me-2"></i>
                  {t("comments.dailyManagement", "Daily Comments Management")}
                </h5>
                <Button
                  variant="primary"
                  onClick={() => setShowAddModal(true)}
                  className="add-comment-btn"
                >
                  <i className="bi bi-plus-lg me-2"></i>
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
                      max={formatDateForInput(new Date())}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-end justify-content-md-end h-100">
                    <Badge bg="info" className="fs-6 student-count-pill">
                      {studentsWithComments.length}{" "}
                      {t(
                        "comments.studentsWithComments",
                        "students with comments",
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
                          className="comment-item student-comments-row"
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="flex-grow-1">
                              <h6 className="mb-2 student-comments-name">
                                {student.firstName} {student.lastName}
                                <Badge
                                  bg="secondary"
                                  className="ms-2 grade-badge"
                                >
                                  {student.gradeLevel}
                                </Badge>
                              </h6>

                              {commentsByStudent[student.id]?.map((comment) => (
                                <div
                                  key={comment.id}
                                  className={`comment-content admin-comment-bubble mb-2 ${
                                    comment.parentCommentId
                                      ? "admin-reply-bubble"
                                      : "admin-parent-bubble"
                                  }`}
                                >
                                  <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-1">
                                    <div className="comment-author-meta">
                                      <Badge
                                        bg={roleVariant(comment.authorRole)}
                                        className="me-2"
                                      >
                                        {roleLabel(comment.authorRole)}
                                      </Badge>
                                      <span className="fw-semibold">
                                        {comment.authorName}
                                      </span>
                                    </div>
                                    <small className="text-muted comment-time">
                                      <i className="bi bi-clock me-1"></i>
                                      <DateBox
                                        value={comment.createdAt}
                                        mode="time"
                                      />
                                    </small>
                                  </div>

                                  <p className="mb-1">{comment.content}</p>

                                  {/* Show replies count if any */}
                                  {comment.repliesCount &&
                                    comment.repliesCount > 0 && (
                                      <small className="text-success d-inline-flex align-items-center">
                                        <i className="bi bi-reply me-1"></i>
                                        {comment.repliesCount}{" "}
                                        {t("comments.replies", "replies")}
                                      </small>
                                    )}

                                  {!comment.parentCommentId && (
                                    <div className="mt-2">
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="reply-btn"
                                        onClick={() => {
                                          setActiveReplyId(
                                            activeReplyId === comment.id
                                              ? null
                                              : comment.id,
                                          );
                                        }}
                                      >
                                        <i className="bi bi-reply me-1"></i>
                                        {t("comments.reply", "Reply")}
                                      </Button>
                                    </div>
                                  )}

                                  {!comment.parentCommentId &&
                                    activeReplyId === comment.id && (
                                      <Form
                                        className="mt-2"
                                        onSubmit={(e) =>
                                          handleReplyComment(e, comment)
                                        }
                                      >
                                        <Form.Group>
                                          <Form.Control
                                            as="textarea"
                                            rows={2}
                                            value={replyTexts[comment.id] || ""}
                                            onChange={(e) =>
                                              setReplyTexts((prev) => ({
                                                ...prev,
                                                [comment.id]: e.target.value,
                                              }))
                                            }
                                            placeholder={t(
                                              "comments.replyPlaceholder",
                                              "Type your reply here...",
                                            )}
                                            required
                                          />
                                        </Form.Group>
                                        <div className="d-flex justify-content-end gap-2 mt-2">
                                          <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() =>
                                              setActiveReplyId(null)
                                            }
                                            disabled={submitting}
                                          >
                                            {t("common.cancel", "Cancel")}
                                          </Button>
                                          <Button
                                            variant="primary"
                                            size="sm"
                                            type="submit"
                                            disabled={
                                              submitting ||
                                              !(
                                                replyTexts[comment.id] || ""
                                              ).trim()
                                            }
                                          >
                                            {submitting
                                              ? t(
                                                  "comments.submitting",
                                                  "Submitting...",
                                                )
                                              : t(
                                                  "comments.submitReply",
                                                  "Submit Reply",
                                                )}
                                          </Button>
                                        </div>
                                      </Form>
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
                      <i className="bi bi-chat-square-text display-6 mb-2"></i>
                      <p>
                        {t(
                          "comments.noCommentsForDate",
                          "No comments for this date",
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
        className="daily-comments-modal"
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
                        "Search by name or grade...",
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
              <div className="student-list">
                {studentsWithoutComments.length === 0 ? (
                  <div className="text-center text-muted py-3">
                    {searchTerm || selectedGrade
                      ? t(
                          "comments.noMatchingStudents",
                          "No matching students found",
                        )
                      : t(
                          "comments.allStudentsHaveComments",
                          "All students have comments for this date",
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
                      <div className="d-flex justify-content-between align-items-center gap-2">
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
                  "Type your comment here...",
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
