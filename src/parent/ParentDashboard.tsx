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
import PageLayout from "../components/PageLayout";
import { parentApi } from "../api/parentApi";
import type { ConnectedStudent as ApiConnectedStudent } from "../api/parentApi";
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

  const handleConnectStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentKey.trim()) return;

    // Validate parent key format
    if (!validateParentKey(studentKey.trim())) {
      setError(
        t(
          "parentDashboard.invalidKeyFormat",
          "Invalid key format. Key should be in format YYYY-MMDD-XXXX",
        ),
      );
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
          setError(
            t(
              "parentDashboard.studentAlreadyConnected",
              "Student is already connected to your account",
            ),
          );
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
        setError(
          response.message ||
            t(
              "parentDashboard.invalidKey",
              "Invalid student key. Please check the key and try again.",
            ),
        );
      }
    } catch (error: unknown) {
      console.error("Error connecting student:", error);
      setError(
        t("parentDashboard.networkError", "Network error. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = (student: ConnectedStudent) => {
    setSelectedStudent(student);
    setShowAttendanceModal(true);
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
          defaultValue: `Are you sure you want to disconnect from ${student.firstName} ${student.lastName}?`,
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
          defaultValue: `Successfully disconnected from ${student.firstName}`,
        }),
      );
    } catch (error) {
      console.error("Error disconnecting student:", error);
      setError(
        t(
          "parentDashboard.disconnectError",
          "Failed to disconnect from student. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (rate: number) => {
    if (rate >= 90) return "success";
    if (rate >= 75) return "warning";
    return "danger";
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
                        <th>{t("students.firstName")}</th>
                        <th>{t("students.lastName")}</th>
                        <th>{t("students.gradeLevel")}</th>
                        <th>{t("parentDashboard.attendanceRate")}</th>
                        <th>{t("parentDashboard.connectedSince")}</th>
                        <th>{t("common.actions")}</th>
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
                              : t("common.unknown", "Unknown")}
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
              <div className="attendance-summary mb-4">
                <Row>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <h4 className="text-success">
                          {(selectedStudent.attendanceRate || 0).toFixed(1)}%
                        </h4>
                        <small className="text-muted">Overall Attendance</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <h4 className="text-primary">18</h4>
                        <small className="text-muted">Present Days</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <h4 className="text-warning">2</h4>
                        <small className="text-muted">Absent Days</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              <h6 className="mb-3">
                {t("recentAttendance", "Recent Attendance (Last 10 Days)")}
              </h6>
              <Table striped size="sm">
                <thead>
                  <tr>
                    <th>{t("date", "Date")}</th>
                    <th>{t("status", "Status")}</th>
                    <th>{t("notes", "Notes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      date: "2025-10-12",
                      status: "present",
                      notes: t("onTime", "On time"),
                    },
                    {
                      date: "2025-10-11",
                      status: "present",
                      notes: t("onTime", "On time"),
                    },
                    {
                      date: "2025-10-10",
                      status: "late",
                      notes: t("arrivedLate", "Arrived {{minutes}} mins late", {
                        minutes: 10,
                      }),
                    },
                    {
                      date: "2025-10-09",
                      status: "present",
                      notes: t("onTime", "On time"),
                    },
                    {
                      date: "2025-10-08",
                      status: "absent",
                      notes: t("sickLeave", "Sick leave"),
                    },
                    {
                      date: "2025-10-07",
                      status: "present",
                      notes: t("onTime", "On time"),
                    },
                    {
                      date: "2025-10-06",
                      status: "present",
                      notes: t("onTime", "On time"),
                    },
                    {
                      date: "2025-10-05",
                      status: "present",
                      notes: t("onTime", "On time"),
                    },
                    {
                      date: "2025-10-04",
                      status: "present",
                      notes: t("onTime", "On time"),
                    },
                    {
                      date: "2025-10-03",
                      status: "excused",
                      notes: t("medicalAppointment", "Medical appointment"),
                    },
                  ].map((record, index) => (
                    <tr key={index}>
                      <td>{formatBosnianDate(record.date)}</td>
                      <td>
                        <Badge
                          bg={
                            record.status === "present"
                              ? "success"
                              : record.status === "late"
                                ? "warning"
                                : record.status === "absent"
                                  ? "danger"
                                  : "info"
                          }
                        >
                          {record.status.charAt(0).toUpperCase() +
                            record.status.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        <small className="text-muted">{record.notes}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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
