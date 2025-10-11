import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Badge,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import {
  attendanceApi,
  type AttendanceStatus,
  type BulkAttendanceData,
  getStatusColor,
  getStatusIcon,
  formatDate,
  formatDateForInput,
} from "./attendanceApi";
import { studentApi } from "../students/studentApi";

function AttendanceTracker() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(
    formatDateForInput(new Date())
  );
  const [attendanceData, setAttendanceData] = useState<
    Record<number, AttendanceStatus>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(20);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    gradeLevel: "",
    email: "",
  });
  const [savingStudents, setSavingStudents] = useState<Set<number>>(new Set());

  // Fetch all students
  const {
    data: studentsResponse,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
    queryKey: ["students", "all"],
    queryFn: () =>
      studentApi.getAll({
        page: 1,
        limit: 100, // Get all students
        search: "",
      }),
  });

  // Fetch attendance for selected date
  const {
    data: attendanceResponse,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ["attendance", selectedDate],
    queryFn: () => attendanceApi.getByDate(selectedDate),
    enabled: !!selectedDate,
  });

  // Fetch attendance summary
  const { data: summaryResponse } = useQuery({
    queryKey: ["attendance-summary", selectedDate],
    queryFn: () => attendanceApi.getSummaryByDate(selectedDate),
    enabled: !!selectedDate,
  });

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    const allStudents = studentsResponse?.data || [];
    if (!searchTerm.trim()) return allStudents;

    return allStudents.filter(
      (student) =>
        `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [studentsResponse?.data, searchTerm]);

  // Paginate filtered students
  const students = useMemo(() => {
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage, studentsPerPage]);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const existingAttendance = useMemo(
    () => attendanceResponse?.data || [],
    [attendanceResponse?.data]
  );
  const summary = summaryResponse?.data || {
    totalStudents: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    presentRate: 0,
  };

  // Initialize attendance data when existing attendance loads
  useEffect(() => {
    const newAttendanceData: Record<number, AttendanceStatus> = {};

    // Set existing attendance
    existingAttendance.forEach((record) => {
      newAttendanceData[record.student_id] = record.status;
    });

    // Set default status for students without attendance record
    students.forEach((student) => {
      if (!newAttendanceData[student.id]) {
        newAttendanceData[student.id] = "PRESENT"; // Default to present
      }
    });

    setAttendanceData(newAttendanceData);
  }, [existingAttendance, students]);

  // Bulk save mutation
  const saveMutation = useMutation({
    mutationFn: (bulkData: BulkAttendanceData) =>
      attendanceApi.createBulk(bulkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      refetchAttendance();
    },
  });

  // Individual attendance auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async ({
      studentId,
      status,
    }: {
      studentId: number;
      status: AttendanceStatus;
    }) => {
      // Add to saving students set
      setSavingStudents((prev) => new Set(prev).add(studentId));

      // Check if attendance record already exists for this student and date
      const existingRecord = existingAttendance.find(
        (record) => record.student_id === studentId
      );

      if (existingRecord) {
        // Update existing record
        return attendanceApi.update(existingRecord.id, { status });
      } else {
        // Create new record
        return attendanceApi.create({
          student_id: studentId,
          date: selectedDate,
          status,
        });
      }
    },
    onSuccess: (_, variables) => {
      // Remove from saving students set
      setSavingStudents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variables.studentId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
    },
    onError: (_, variables) => {
      // Remove from saving students set on error too
      setSavingStudents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variables.studentId);
        return newSet;
      });
    },
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setShowAddStudent(false);
      setNewStudent({
        firstName: "",
        lastName: "",
        studentId: "",
        gradeLevel: "",
        email: "",
      });
    },
  });

  const handleCreateStudent = () => {
    if (
      !newStudent.firstName ||
      !newStudent.lastName ||
      !newStudent.gradeLevel
    ) {
      return;
    }
    createStudentMutation.mutate(newStudent);
  };

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    // Update local state immediately for instant feedback
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));

    // Auto-save the attendance change
    autoSaveMutation.mutate({ studentId, status });
  };

  const handleSaveAttendance = () => {
    const attendanceRecords = students.map((student) => ({
      student_id: student.id,
      date: selectedDate,
      status: attendanceData[student.id] || "PRESENT",
    }));

    const bulkData: BulkAttendanceData = {
      attendanceList: attendanceRecords,
    };

    saveMutation.mutate(bulkData);
  };

  const getStatusBadge = (status: AttendanceStatus) => (
    <Badge bg={getStatusColor(status)} className="d-flex align-items-center">
      <i className={`${getStatusIcon(status)} me-1`}></i>
      {t(`attendanceTracker.status.${status.toLowerCase()}`)}
    </Badge>
  );

  if (studentsLoading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" className="me-2" />
          Loading students...
        </div>
      </Container>
    );
  }

  if (studentsError) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Error loading students. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <h2 className="mb-4">
            <i className="bi bi-calendar-check me-2 text-primary"></i>
            {t("attendanceTracker.title", "Attendance Tracker")}
          </h2>
        </Col>
      </Row>

      {/* Date Selection and Summary */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>
                {t("attendanceTracker.selectDate", "Select Date")}
              </Card.Title>
              <Form.Group>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-control-lg"
                />
              </Form.Group>
              <div className="mt-3">
                <small className="text-muted">
                  {t("attendanceTracker.selectedDate", "Selected")}:{" "}
                  {formatDate(selectedDate)}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {summaryResponse?.data && (
          <Col md={6}>
            <Card>
              <Card.Body>
                <Card.Title>
                  {t("attendanceTracker.summary", "Daily Summary")}
                </Card.Title>
                <Row className="text-center">
                  <Col xs={6} sm={3}>
                    <div className="text-success">
                      <h4>{summary.presentCount || 0}</h4>
                      <small>
                        {t("attendanceTracker.status.present", "Present")}
                      </small>
                    </div>
                  </Col>
                  <Col xs={6} sm={3}>
                    <div className="text-danger">
                      <h4>{summary.absentCount || 0}</h4>
                      <small>
                        {t("attendanceTracker.status.absent", "Absent")}
                      </small>
                    </div>
                  </Col>
                  <Col xs={6} sm={3}>
                    <div className="text-warning">
                      <h4>{summary.lateCount || 0}</h4>
                      <small>
                        {t("attendanceTracker.status.late", "Late")}
                      </small>
                    </div>
                  </Col>
                  <Col xs={6} sm={3}>
                    <div className="text-info">
                      <h4>{summary.excusedCount || 0}</h4>
                      <small>
                        {t("attendanceTracker.status.excused", "Excused")}
                      </small>
                    </div>
                  </Col>
                </Row>
                <div className="mt-3 text-center">
                  <strong>
                    {t("attendanceTracker.presentRate", "Present Rate")}:{" "}
                    {(summary.presentRate || 0).toFixed(1)}%
                  </strong>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Auto-save Status and Actions */}
      <Row className="mb-3">
        <Col md={8}>
          <Alert variant="info" className="mb-2 py-2">
            <div className="d-flex align-items-center">
              <i className="bi bi-cloud-check me-2"></i>
              <small>
                {t(
                  "attendanceTracker.autoSaveEnabled",
                  "Auto-save enabled - changes are saved automatically"
                )}
                {savingStudents.size > 0 && (
                  <>
                    {" • "}
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-1"
                      style={{ width: "12px", height: "12px" }}
                    />
                    {t("attendanceTracker.savingChanges", "Saving changes...")}
                  </>
                )}
              </small>
            </div>
          </Alert>
        </Col>
        <Col md={4} className="text-end">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => refetchAttendance()}
            disabled={attendanceLoading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            {t("attendanceTracker.refresh", "Refresh")}
          </Button>

          <Button
            variant="outline-success"
            size="sm"
            onClick={handleSaveAttendance}
            disabled={saveMutation.isPending || attendanceLoading}
            className="ms-2"
            title={t(
              "attendanceTracker.bulkSaveTooltip",
              "Save all current attendance at once"
            )}
          >
            {saveMutation.isPending ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-1"
                  style={{ width: "12px", height: "12px" }}
                />
                {t("attendanceTracker.saving", "Saving...")}
              </>
            ) : (
              <>
                <i className="bi bi-download me-1"></i>
                {t("attendanceTracker.bulkSave", "Bulk Save")}
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* Student Attendance Table */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col md={4}>
                  <h5 className="mb-0">
                    {t("attendanceTracker.studentList", "Student Attendance")} -{" "}
                    {formatDate(selectedDate)}
                  </h5>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-0">
                    <Form.Control
                      type="text"
                      placeholder={t(
                        "students.searchPlaceholder",
                        "Search students by name or ID..."
                      )}
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page when searching
                      }}
                      className="form-control-sm"
                    />
                  </Form.Group>
                </Col>
                <Col md={2} className="text-end">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setShowAddStudent(true)}
                  >
                    <i className="bi bi-person-plus me-1"></i>
                    {t("students.addStudent", "Add Student")}
                  </Button>
                </Col>
              </Row>
              {searchTerm && (
                <div className="mt-2">
                  <small className="text-muted">
                    {t("common.showing", "Showing")} {filteredStudents.length}{" "}
                    {t("common.of", "of")} {studentsResponse?.data?.length || 0}{" "}
                    {t("students.students", "students")}
                    {filteredStudents.length > studentsPerPage && (
                      <>
                        {" "}
                        - {t("common.page", "Page")} {currentPage}{" "}
                        {t("common.of", "of")} {totalPages}
                      </>
                    )}
                  </small>
                </div>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              {attendanceLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>{t("students.name", "Name")}</th>
                        <th>{t("students.gradeLevel", "Grade")}</th>
                        <th className="text-center">
                          {t("attendanceTracker.status.present", "Present")}
                        </th>
                        <th className="text-center">
                          {t("attendanceTracker.status.absent", "Absent")}
                        </th>
                        <th className="text-center">
                          {t("attendanceTracker.status.late", "Late")}
                        </th>
                        <th className="text-center">
                          {t("attendanceTracker.status.excused", "Excused")}
                        </th>
                        <th>
                          {t("attendanceTracker.currentStatus", "Status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const currentStatus =
                          attendanceData[student.id] || "PRESENT";
                        return (
                          <tr key={student.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <strong>
                                  {student.firstName} {student.lastName}
                                </strong>
                                {savingStudents.has(student.id) && (
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    className="ms-2 text-primary"
                                    style={{ width: "16px", height: "16px" }}
                                  />
                                )}
                              </div>
                            </td>
                            <td>
                              <Badge bg="secondary">{student.gradeLevel}</Badge>
                            </td>
                            <td className="text-center p-2">
                              <Form.Check
                                type="radio"
                                name={`attendance-${student.id}`}
                                checked={currentStatus === "PRESENT"}
                                onChange={() =>
                                  handleStatusChange(student.id, "PRESENT")
                                }
                                className="text-success form-check-lg"
                                style={{ transform: "scale(1.2)" }}
                              />
                            </td>
                            <td className="text-center p-2">
                              <Form.Check
                                type="radio"
                                name={`attendance-${student.id}`}
                                checked={currentStatus === "ABSENT"}
                                onChange={() =>
                                  handleStatusChange(student.id, "ABSENT")
                                }
                                className="text-danger form-check-lg"
                                style={{ transform: "scale(1.2)" }}
                              />
                            </td>
                            <td className="text-center p-2">
                              <Form.Check
                                type="radio"
                                name={`attendance-${student.id}`}
                                checked={currentStatus === "LATE"}
                                onChange={() =>
                                  handleStatusChange(student.id, "LATE")
                                }
                                className="text-warning form-check-lg"
                                style={{ transform: "scale(1.2)" }}
                              />
                            </td>
                            <td className="text-center p-2">
                              <Form.Check
                                type="radio"
                                name={`attendance-${student.id}`}
                                checked={currentStatus === "EXCUSED"}
                                onChange={() =>
                                  handleStatusChange(student.id, "EXCUSED")
                                }
                                className="text-info form-check-lg"
                                style={{ transform: "scale(1.2)" }}
                              />
                            </td>
                            <td>{getStatusBadge(currentStatus)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <div>
                    <small className="text-muted">
                      {t("common.showing", "Showing")}{" "}
                      {(currentPage - 1) * studentsPerPage + 1} -{" "}
                      {Math.min(
                        currentPage * studentsPerPage,
                        filteredStudents.length
                      )}{" "}
                      {t("common.of", "of")} {filteredStudents.length}{" "}
                      {t("students.students", "students")}
                    </small>
                  </div>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </Button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                        i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === currentPage
                              ? "primary"
                              : "outline-secondary"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Success/Error Messages */}
      {saveMutation.isSuccess && (
        <Alert variant="success" className="mt-3">
          <i className="bi bi-check-circle me-2"></i>
          {t("attendanceTracker.saveSuccess", "Attendance saved successfully!")}
        </Alert>
      )}

      {saveMutation.isError && (
        <Alert variant="danger" className="mt-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {t(
            "attendanceTracker.saveError",
            "Error saving attendance. Please try again."
          )}
        </Alert>
      )}

      {/* Add Student Modal */}
      <Modal show={showAddStudent} onHide={() => setShowAddStudent(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {t("students.addStudent", "Add New Student")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {t("students.firstName", "First Name")} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={newStudent.firstName}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        firstName: e.target.value,
                      })
                    }
                    placeholder={t(
                      "students.enterFirstName",
                      "Enter first name"
                    )}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {t("students.lastName", "Last Name")} *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={newStudent.lastName}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, lastName: e.target.value })
                    }
                    placeholder={t("students.enterLastName", "Enter last name")}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {t("students.studentId", "Student ID")}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={newStudent.studentId}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        studentId: e.target.value,
                      })
                    }
                    placeholder={t(
                      "students.enterStudentId",
                      "Enter student ID"
                    )}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {t("students.gradeLevel", "Grade Level")} *
                  </Form.Label>
                  <Form.Select
                    value={newStudent.gradeLevel}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        gradeLevel: e.target.value,
                      })
                    }
                  >
                    <option value="">
                      {t("students.selectGrade", "Select grade")}
                    </option>
                    <option value="1">1st Grade</option>
                    <option value="2">2nd Grade</option>
                    <option value="3">3rd Grade</option>
                    <option value="4">4th Grade</option>
                    <option value="5">5th Grade</option>
                    <option value="6">6th Grade</option>
                    <option value="7">7th Grade</option>
                    <option value="8">8th Grade</option>
                    <option value="9">9th Grade</option>
                    <option value="10">10th Grade</option>
                    <option value="11">11th Grade</option>
                    <option value="12">12th Grade</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>{t("students.email", "Email")}</Form.Label>
              <Form.Control
                type="email"
                value={newStudent.email}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, email: e.target.value })
                }
                placeholder={t("students.enterEmail", "Enter email address")}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddStudent(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateStudent}
            disabled={
              createStudentMutation.isPending ||
              !newStudent.firstName ||
              !newStudent.lastName ||
              !newStudent.gradeLevel
            }
          >
            {createStudentMutation.isPending ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2"
                />
                {t("common.creating", "Creating...")}
              </>
            ) : (
              <>
                <i className="bi bi-person-plus me-2"></i>
                {t("students.createStudent", "Create Student")}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AttendanceTracker;
