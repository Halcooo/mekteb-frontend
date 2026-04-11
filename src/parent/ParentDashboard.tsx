import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Table,
  Badge,
  Spinner,
  InputGroup,
  Modal,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { parentApi } from "../api/parentApi";
import type {
  ConnectedStudent as ApiConnectedStudent,
  ParentAttendanceRecord,
  ParentAttendanceStats,
} from "../api/parentApi";
import { validateParentKey } from "../utils/parentKeyUtils";
import { formatBosnianDate } from "../utils/dateFormatter";
import StudentComments from "../components/StudentComments";
import "./ParentDashboard.scss";

// Local interface that extends the API interface
interface ConnectedStudent extends ApiConnectedStudent {
  connectionDate?: string;
}

const ParentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [studentKey, setStudentKey] = useState("");
  const [connectedStudents, setConnectedStudents] = useState<
    ConnectedStudent[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<ConnectedStudent | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<
    ParentAttendanceRecord[]
  >([]);
  const [attendanceStats, setAttendanceStats] =
    useState<ParentAttendanceStats | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const fetchConnectedStudents = useCallback(async () => {
    setLoading(true);
    try {
      const students = await parentApi.getConnectedStudents();
      setConnectedStudents(
        students.map((student) => ({
          ...student,
          connectionDate:
            student.connectedAt?.split("T")[0] ||
            student.createdAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
        })),
      );
    } catch (error) {
      console.error("Error fetching connected students:", error);
      setError(t("parentDashboard.errorLoadingStudents"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load connected students on component mount
  useEffect(() => {
    fetchConnectedStudents();
  }, [fetchConnectedStudents]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openComments = params.get("openComments") === "1";
    const dateFromQuery = params.get("date");
    const studentIdFromQuery = parseInt(params.get("studentId") || "", 10);

    if (!openComments || Number.isNaN(studentIdFromQuery)) {
      return;
    }

    if (dateFromQuery) {
      setSelectedDate(dateFromQuery);
    }

    const student = connectedStudents.find((s) => s.id === studentIdFromQuery);
    if (student) {
      setSelectedStudent(student);
      setShowComments(true);
    }
  }, [location.search, connectedStudents]);

  const handleConnectStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentKey.trim()) return;

    // Validate parent key format
    if (!validateParentKey(studentKey.trim())) {
      setError(t("parentDashboard.invalidKeyFormat"));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await parentApi.connectStudent(studentKey.trim());

      if (response.success && response.student) {
        // Check if student is already connected
        const alreadyConnected = connectedStudents.some(
          (s) => s.id === response.student!.id,
        );

        if (alreadyConnected) {
          setError(t("parentDashboard.studentAlreadyConnected"));
          return;
        }

        // Refresh the connected students list
        await fetchConnectedStudents();

        setSuccess(
          t("parentDashboard.studentConnectedSuccess", {
            name: response.student.firstName,
          }),
        );
        setStudentKey("");

        // Scroll to the connected students section to show the new addition
        setTimeout(() => {
          const connectedSection = document.querySelector(
            ".connected-students-section",
          );
          if (connectedSection) {
            connectedSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 100);
      } else {
        setError(response.message || t("parentDashboard.invalidKey"));
      }
    } catch (error: unknown) {
      console.error("Error connecting student:", error);
      setError(t("parentDashboard.networkError"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = async (student: ConnectedStudent) => {
    setSelectedStudent(student);
    setShowAttendanceModal(true);

    setAttendanceLoading(true);
    setAttendanceError(null);
    setAttendanceRecords([]);
    setAttendanceStats(null);

    try {
      const [records, stats] = await Promise.all([
        parentApi.getStudentAttendance(student.id, 10),
        parentApi.getStudentAttendanceStats(student.id),
      ]);

      setAttendanceRecords(records);
      setAttendanceStats(stats);
    } catch (error) {
      console.error("Error loading attendance details:", error);
      setAttendanceError(t("parentDashboard.errorLoadingAttendanceDetails"));
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleViewComments = (student: ConnectedStudent) => {
    setSelectedStudent(student);
    setShowComments(true);
  };

  const handleDisconnectStudent = async (student: ConnectedStudent) => {
    if (
      !window.confirm(
        t("parentDashboard.confirmDisconnect", {
          name: `${student.firstName} ${student.lastName}`,
        }),
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await parentApi.disconnectStudent(student.id);

      // Remove student from local state
      setConnectedStudents((prev) => prev.filter((s) => s.id !== student.id));

      setSuccess(
        t("parentDashboard.studentDisconnectedSuccess", {
          name: student.firstName,
        }),
      );
    } catch (error) {
      console.error("Error disconnecting student:", error);
      setError(t("parentDashboard.disconnectError"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (rate: number) => {
    if (rate >= 90) return "success";
    if (rate >= 75) return "warning";
    return "danger";
  };

  const getAttendanceStatusBadgeVariant = (status: string) => {
    const normalizedStatus = status.toUpperCase();

    if (normalizedStatus === "PRESENT") return "success";
    if (normalizedStatus === "LATE") return "warning";
    if (normalizedStatus === "ABSENT") return "danger";
    return "info";
  };

  const getAttendanceNote = (status: string) => {
    const normalizedStatus = status.toUpperCase();

    if (normalizedStatus === "PRESENT") return t("parentDashboard.onTime");
    if (normalizedStatus === "LATE") {
      return t("parentDashboard.arrivedLate", { minutes: "-" });
    }
    if (normalizedStatus === "ABSENT") return t("parentDashboard.sickLeave");
    return t("parentDashboard.medicalAppointment");
  };

  return (
    <PageLayout
      title={
        <span>
          <i className="fas fa-family"></i>
          {t("parentDashboard.title")}
        </span>
      }
      className="parent-dashboard"
    >
      {/* Connect New Student Section */}
      <Row className="mb-4">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-link me-2"></i>
                {t("parentDashboard.connectStudent")}
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleConnectStudent}>
                <InputGroup className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder={t("parentDashboard.enterStudentKey")}
                    value={studentKey}
                    onChange={(e) => setStudentKey(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || !studentKey.trim()}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {t("common.connecting")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus me-2"></i>
                        {t("parentDashboard.connect")}
                      </>
                    )}
                  </Button>
                </InputGroup>
              </Form>

              <div className="help-text">
                <small className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  {t("parentDashboard.keyHelp")}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error/Success Messages */}
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {success && (
        <Row className="mb-3">
          <Col>
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Connected Students */}
      <Row className="connected-students-section">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>
                {t("parentDashboard.myChildren")} ({connectedStudents.length})
              </h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={fetchConnectedStudents}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-1"></i>
                {t("common.refresh")}
              </Button>
            </Card.Header>
            <Card.Body>
              {loading && connectedStudents.length === 0 ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2 text-muted">{t("common.loading")}</p>
                </div>
              ) : connectedStudents.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-user-plus fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">
                    {t("parentDashboard.noStudentsConnected")}
                  </h6>
                  <p className="text-muted">
                    {t("parentDashboard.connectFirstStudent")}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>{t("firstName")}</th>
                        <th>{t("lastName")}</th>
                        <th>{t("gradeLevel")}</th>
                        <th>{t("parentDashboard.attendanceRate")}</th>
                        <th>{t("parentDashboard.connectedSince")}</th>
                        <th>{t("actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {connectedStudents.map((student) => (
                        <tr key={student.id}>
                          <td>
                            <strong>{student.firstName}</strong>
                          </td>
                          <td>{student.lastName}</td>
                          <td>
                            <Badge bg="info">{student.gradeLevel}</Badge>
                          </td>
                          <td>
                            <Badge
                              bg={getStatusBadgeVariant(
                                student.attendanceRate || 0,
                              )}
                            >
                              {(student.attendanceRate || 0).toFixed(1)}%
                            </Badge>
                          </td>
                          <td>
                            {student.connectionDate
                              ? new Date(
                                  student.connectionDate,
                                ).toLocaleDateString()
                              : t("common.unknown")}
                          </td>
                          <td>
                            <div className="d-flex gap-2 flex-wrap">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewAttendance(student)}
                              >
                                <i className="fas fa-calendar-alt me-1"></i>
                                {t("parentDashboard.viewAttendance")}
                              </Button>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleViewComments(student)}
                              >
                                <i className="fas fa-comments me-1"></i>
                                {t("parentDashboard.viewComments")}
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDisconnectStudent(student)}
                                disabled={loading}
                              >
                                <i className="fas fa-unlink me-1"></i>
                                {t("parentDashboard.disconnect")}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Attendance Detail Modal */}
      <Modal
        show={showAttendanceModal}
        onHide={() => setShowAttendanceModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-calendar-check me-2"></i>
            {t("parentDashboard.attendanceDetails")} -{" "}
            {selectedStudent?.firstName} {selectedStudent?.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <div className="attendance-details">
              {attendanceLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                  <p className="mt-2 text-muted">
                    {t("parentDashboard.loadingAttendanceDetails")}
                  </p>
                </div>
              ) : attendanceError ? (
                <Alert variant="danger" className="mb-0">
                  {attendanceError}
                </Alert>
              ) : (
                <>
                  <div className="attendance-summary mb-4">
                    <Row>
                      <Col md={4}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4 className="text-success">
                              {(attendanceStats?.attendanceRate || 0).toFixed(
                                1,
                              )}
                              %
                            </h4>
                            <small className="text-muted">
                              {t("parentDashboard.overallAttendance")}
                            </small>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4 className="text-primary">
                              {(attendanceStats?.presentDays || 0) +
                                (attendanceStats?.lateDays || 0)}
                            </h4>
                            <small className="text-muted">
                              {t("parentDashboard.presentDays")}
                            </small>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="text-center">
                          <Card.Body>
                            <h4 className="text-warning">
                              {attendanceStats?.absentDays || 0}
                            </h4>
                            <small className="text-muted">
                              {t("parentDashboard.absentDays")}
                            </small>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </div>

                  <h6 className="mb-3">
                    {t("parentDashboard.recentAttendance")}
                  </h6>

                  {attendanceRecords.length === 0 ? (
                    <Alert variant="info" className="mb-0">
                      {t("parentDashboard.noAttendanceRecords")}
                    </Alert>
                  ) : (
                    <Table striped size="sm">
                      <thead>
                        <tr>
                          <th>{t("parentDashboard.date")}</th>
                          <th>{t("parentDashboard.status")}</th>
                          <th>{t("parentDashboard.notes")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((record) => (
                          <tr key={record.id}>
                            <td>{formatBosnianDate(record.date)}</td>
                            <td>
                              <Badge
                                bg={getAttendanceStatusBadgeVariant(
                                  record.status,
                                )}
                              >
                                {t(
                                  `parentDashboard.statusValues.${record.status.toLowerCase()}`,
                                )}
                              </Badge>
                            </td>
                            <td>
                              <small className="text-muted">
                                {getAttendanceNote(record.status)}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAttendanceModal(false)}
          >
            {t("common.close")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Comments Modal */}
      <Modal
        show={showComments}
        onHide={() => setShowComments(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-comments me-2"></i>
            {t("comments.title")} - {selectedStudent?.firstName}{" "}
            {selectedStudent?.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <Form.Group>
              <Form.Label>{t("comments.selectDate", "Select Date")}</Form.Label>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </Form.Group>
          </div>

          {selectedStudent && (
            <StudentComments
              studentId={selectedStudent.id}
              studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
              selectedDate={selectedDate}
              isParent={true}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowComments(false)}>
            {t("common.close")}
          </Button>
        </Modal.Footer>
      </Modal>
    </PageLayout>
  );
};

export default ParentDashboard;
