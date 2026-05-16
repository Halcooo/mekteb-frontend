import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Form,
  Alert,
  Badge,
  Spinner,
  ListGroup,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { commentsApi } from "../api/commentsApi";
import type { StudentComment } from "../api/commentsApi";
import { formatDateForInput } from "../utils/dateFormatter";
import DateBox from "./DateBox";
import "./StudentComments.scss";

interface StudentCommentsProps {
  studentId: number;
  studentName: string;
  selectedDate?: string;
  isParent?: boolean;
  allowReplies?: boolean;
  focusCommentId?: number | null;
}

const StudentComments: React.FC<StudentCommentsProps> = ({
  studentId,
  studentName,
  selectedDate,
  isParent = false,
  allowReplies = false,
  focusCommentId = null,
}) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState<StudentComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (
      !focusCommentId ||
      comments.length === 0 ||
      !commentsContainerRef.current
    ) {
      return;
    }

    const scrollToTarget = () => {
      const target = commentsContainerRef.current?.querySelector(
        `[data-comment-id="${focusCommentId}"]`,
      ) as HTMLElement | null;

      if (!target) {
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    scrollToTarget();
    const retryTimeout = window.setTimeout(scrollToTarget, 180);
    return () => window.clearTimeout(retryTimeout);
  }, [focusCommentId, comments]);

  // Handle reply submission
  const handleReplySubmit = async (
    e: React.FormEvent,
    parentCommentId: number,
  ) => {
    e.preventDefault();
    const replyText = (replyTexts[parentCommentId] || "").trim();
    if (!replyText) return;

    setSubmitting(true);
    setError(null);

    try {
      const newReply = await commentsApi.createComment({
        studentId,
        content: replyText,
        date: selectedDate || formatDateForInput(new Date()),
        parentCommentId,
      });

      // Add the new reply to the comments list
      setComments((prev) => [...prev, newReply]);

      // Reset form
      setReplyTexts((prev) => ({ ...prev, [parentCommentId]: "" }));
      setActiveReplyId(null);

      // Optionally reload to get updated reply counts
      await loadComments();
    } catch (error) {
      console.error("Error submitting reply:", error);
      setError(t("comments.replyError", "Failed to submit reply"));
    } finally {
      setSubmitting(false);
    }
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
      <Card className="comments-card comments-loading-card">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          {t("comments.loading", "Loading comments...")}
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="student-comments" ref={commentsContainerRef}>
      <Card className="comments-card">
        <Card.Header className="comments-card-header">
          <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <h6 className="mb-0 comments-title">
              <i className="bi bi-chat-left-text me-2"></i>
              {t("comments.title", "Daily Comments")} - {studentName}
            </h6>
            {selectedDate && (
              <Badge bg="info" className="comments-date-badge">
                <DateBox value={selectedDate} mode="date" />
              </Badge>
            )}
          </div>
        </Card.Header>

        <Card.Body className="comments-card-body">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {commentThreads.length === 0 ? (
            <div className="comments-empty-state text-center text-muted py-3">
              <i className="bi bi-chat-square-text display-6 mb-2"></i>
              <p>{t("comments.noComments", "No comments for this date")}</p>
            </div>
          ) : (
            <ListGroup variant="flush" className="comment-thread-list">
              {commentThreads.map((thread) => (
                <ListGroup.Item
                  key={thread[0].comment.id}
                  className="comment-thread"
                >
                  {thread.map(({ comment, depth }) => (
                    <div
                      key={comment.id}
                      className={`comment ${
                        depth === 0 ? "parent-comment" : "reply-comment"
                      } depth-${depth} ${
                        focusCommentId === comment.id ? "focused-comment" : ""
                      }`}
                      data-comment-id={comment.id}
                    >
                      <div className="comment-header d-flex justify-content-between align-items-start gap-2">
                        <div className="comment-meta">
                          <Badge
                            bg={roleVariant(comment.authorRole)}
                            className="me-2 comment-role-badge"
                          >
                            {roleLabel(comment.authorRole)}
                          </Badge>
                          <span className="author-name fw-bold">
                            {comment.authorName}
                          </span>
                          <small className="text-muted ms-2">
                            <i className="bi bi-clock me-1"></i>
                            <DateBox value={comment.createdAt} mode="time" />
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
                            className="comment-reply-btn"
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

                      {canReply && activeReplyId === comment.id && (
                        <Form
                          className="mt-2"
                          onSubmit={(e) => handleReplySubmit(e, comment.id)}
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
                              onClick={() => setActiveReplyId(null)}
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
                                !(replyTexts[comment.id] || "").trim()
                              }
                            >
                              {submitting
                                ? t("comments.submitting", "Submitting...")
                                : t("comments.submitReply", "Submit Reply")}
                            </Button>
                          </div>
                        </Form>
                      )}
                    </div>
                  ))}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default StudentComments;
