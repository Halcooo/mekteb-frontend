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
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { commentsApi } from "../api/commentsApi";
import type { StudentComment } from "../api/commentsApi";
import { formatBosnianDate } from "../utils/dateFormatter";
import "./StudentComments.scss";

interface StudentCommentsProps {
  studentId: number;
  studentName: string;
  selectedDate?: string;
  isParent?: boolean;
  allowReplies?: boolean;
}

const StudentComments: React.FC<StudentCommentsProps> = ({
  studentId,
  studentName,
  selectedDate,
  isParent = false,
  allowReplies = false,
}) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState<StudentComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load comments
  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedComments = await commentsApi.getStudentComments(
        studentId,
        selectedDate,
      );
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
      setError(t("comments.errorLoading", "Failed to load comments"));
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedDate, t]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Handle reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;

    setSubmitting(true);
    setError(null);

    try {
      const newReply = await commentsApi.createComment({
        studentId,
        content: replyText.trim(),
        date: selectedDate || new Date().toISOString().split("T")[0],
        parentCommentId: replyingTo,
      });

      // Add the new reply to the comments list
      setComments((prev) => [...prev, newReply]);

      // Reset form
      setReplyText("");
      setReplyingTo(null);
      setShowReplyModal(false);

      // Optionally reload to get updated reply counts
      await loadComments();
    } catch (error) {
      console.error("Error submitting reply:", error);
      setError(t("comments.replyError", "Failed to submit reply"));
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return formatBosnianDate(dateString);
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const canReply = isParent || allowReplies;

  // Group comments by thread root and include depth for nested chat rendering
  const organizeThreads = (allComments: StudentComment[]) => {
    const byId = new Map<number, StudentComment>();
    allComments.forEach((c) => byId.set(c.id, c));

    const getRootId = (comment: StudentComment): number => {
      let current = comment;
      const seen = new Set<number>();

      while (current.parentCommentId && byId.has(current.parentCommentId)) {
        if (seen.has(current.id)) break;
        seen.add(current.id);
        current = byId.get(current.parentCommentId)!;
      }

      return current.id;
    };

    const getDepth = (comment: StudentComment): number => {
      let depth = 0;
      let current = comment;
      const seen = new Set<number>();

      while (current.parentCommentId && byId.has(current.parentCommentId)) {
        if (seen.has(current.id)) break;
        seen.add(current.id);
        depth += 1;
        current = byId.get(current.parentCommentId)!;
      }

      return Math.min(depth, 4);
    };

    const threads = new Map<
      number,
      Array<{ comment: StudentComment; depth: number }>
    >();

    allComments.forEach((comment) => {
      const rootId = getRootId(comment);
      const depth = getDepth(comment);
      const thread = threads.get(rootId) || [];
      thread.push({ comment, depth });
      threads.set(rootId, thread);
    });

    return Array.from(threads.values())
      .map((thread) =>
        thread.sort(
          (a, b) =>
            new Date(a.comment.createdAt).getTime() -
            new Date(b.comment.createdAt).getTime(),
        ),
      )
      .sort((a, b) => {
        const aTime = new Date(a[0].comment.createdAt).getTime();
        const bTime = new Date(b[0].comment.createdAt).getTime();
        return bTime - aTime;
      });
  };

  const commentThreads = organizeThreads(comments);

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

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          {t("comments.loading", "Loading comments...")}
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="student-comments">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <i className="fas fa-comments me-2"></i>
              {t("comments.title", "Daily Comments")} - {studentName}
            </h6>
            {selectedDate && (
              <Badge bg="info">{formatDate(selectedDate)}</Badge>
            )}
          </div>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {commentThreads.length === 0 ? (
            <div className="text-center text-muted py-3">
              <i className="fas fa-comment-slash fa-2x mb-2"></i>
              <p>{t("comments.noComments", "No comments for this date")}</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {commentThreads.map((thread) => (
                <ListGroup.Item
                  key={thread[0].comment.id}
                  className="comment-thread"
                >
                  {thread.map(({ comment, depth }) => (
                    <div
                      key={comment.id}
                      className={
                        depth === 0
                          ? "comment parent-comment"
                          : "comment reply-comment"
                      }
                      style={{ marginLeft: `${depth * 14}px` }}
                    >
                      <div className="comment-header d-flex justify-content-between align-items-start">
                        <div>
                          <Badge
                            bg={roleVariant(comment.authorRole)}
                            className="me-2"
                          >
                            {roleLabel(comment.authorRole)}
                          </Badge>
                          <span className="author-name fw-bold">
                            {comment.authorName}
                          </span>
                          <small className="text-muted ms-2">
                            {formatTime(comment.createdAt)}
                          </small>
                        </div>
                      </div>

                      <div className="comment-content mt-2">
                        {comment.content}
                      </div>

                      {canReply && (
                        <div className="comment-actions mt-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(comment.id);
                              setShowReplyModal(true);
                            }}
                          >
                            <i className="fas fa-reply me-1"></i>
                            {t("comments.reply", "Reply")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Reply Modal */}
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {t("comments.replyToComment", "Reply to Comment")}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleReplySubmit}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>{t("comments.yourReply", "Your Reply")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t(
                  "comments.replyPlaceholder",
                  "Type your reply here...",
                )}
                required
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowReplyModal(false)}
              disabled={submitting}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting || !replyText.trim()}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {t("comments.submitting", "Submitting...")}
                </>
              ) : (
                t("comments.submitReply", "Submit Reply")
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentComments;
