import React, { useState, useCallback } from "react";
import {
  Table,
  Form,
  Button,
  ButtonGroup,
  Spinner,
  Alert,
  Modal,
  Card,
  Row,
  Col,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import DatePicker from "../components/DatePicker";
import "./EditableGrid.scss";
import type {
  Student,
  UpdateStudentData,
  CreateStudentData,
} from "./studentApi";
import { formatDate, calculateAge } from "../utils/dateUtils";

interface EditableGridProps {
  students: Student[];
  onUpdate: (id: number, data: UpdateStudentData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreate: (data: CreateStudentData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

interface EditableRow {
  [key: string]: {
    value: string | number | null;
    isEditing: boolean;
    originalValue: string | number | null;
  };
}

interface ParentKeyDisplayProps {
  parentKey: string | null | undefined;
  studentName: string;
}

const ParentKeyDisplay: React.FC<ParentKeyDisplayProps> = ({ parentKey }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      if (parentKey) {
        await navigator.clipboard.writeText(parentKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!parentKey) {
    return (
      <span className="text-muted">
        <i className="fas fa-key me-1"></i>
        {t("parentKey.notGenerated", "Not generated")}
      </span>
    );
  }

  return (
    <OverlayTrigger
      placement="top"
      overlay={
        <Tooltip id={`tooltip-${parentKey}`}>
          {copied
            ? t("parentKey.copied", "Copied!")
            : t("parentKey.clickToCopy", "Click to copy parent key")}
        </Tooltip>
      }
    >
      <Button
        variant="outline-primary"
        size="sm"
        onClick={copyToClipboard}
        className={`parent-key-btn ${copied ? "copied" : ""}`}
      >
        <code className="parent-key-code">{parentKey}</code>
        <i className={`fas ${copied ? "fa-check" : "fa-copy"} ms-1`}></i>
      </Button>
    </OverlayTrigger>
  );
};

const EditableGrid: React.FC<EditableGridProps> = ({
  students,
  onUpdate,
  onDelete,
  onCreate,
  loading = false,
  error = null,
}) => {
  const { t } = useTranslation();
  const [editingRows, setEditingRows] = useState<{
    [key: number]: EditableRow;
  }>({});
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState<CreateStudentData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gradeLevel: "",
    parentId: null,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Initialize editing state for a row
  const startEditing = useCallback((student: Student) => {
    setEditingRows((prev) => ({
      ...prev,
      [student.id]: {
        firstName: {
          value: student.firstName,
          isEditing: true,
          originalValue: student.firstName,
        },
        lastName: {
          value: student.lastName,
          isEditing: true,
          originalValue: student.lastName,
        },
        dateOfBirth: {
          value: student.dateOfBirth,
          isEditing: true,
          originalValue: student.dateOfBirth,
        },
        gradeLevel: {
          value: student.gradeLevel,
          isEditing: true,
          originalValue: student.gradeLevel,
        },
        parentId: {
          value: student.parentId,
          isEditing: true,
          originalValue: student.parentId,
        },
      },
    }));
  }, []);

  // Cancel editing and restore original values
  const cancelEditing = useCallback((studentId: number) => {
    setEditingRows((prev) => {
      const newState = { ...prev };
      delete newState[studentId];
      return newState;
    });
  }, []);

  // Update field value
  const updateField = useCallback(
    (studentId: number, field: string, value: string | number | null) => {
      setEditingRows((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [field]: {
            ...prev[studentId][field],
            value,
          },
        },
      }));
    },
    []
  );

  // Save changes
  const saveChanges = useCallback(
    async (studentId: number) => {
      const editingRow = editingRows[studentId];
      if (!editingRow) return;

      setSavingRows((prev) => new Set(prev).add(studentId));

      try {
        const updateData: UpdateStudentData = {};

        // Only include changed fields
        Object.keys(editingRow).forEach((field) => {
          const fieldData = editingRow[field];
          if (fieldData.value !== fieldData.originalValue) {
            if (field === "parentId") {
              updateData[field] = Number(fieldData.value);
            } else {
              // Type-safe field assignment
              if (field === "firstName")
                updateData.firstName = String(fieldData.value);
              else if (field === "lastName")
                updateData.lastName = String(fieldData.value);
              else if (field === "dateOfBirth")
                updateData.dateOfBirth = String(fieldData.value);
              else if (field === "gradeLevel")
                updateData.gradeLevel = String(fieldData.value);
            }
          }
        });

        // Only make API call if there are actual changes
        if (Object.keys(updateData).length > 0) {
          await onUpdate(studentId, updateData);
        }

        // Remove from editing state
        cancelEditing(studentId);
      } catch (error) {
        console.error("Failed to save changes:", error);
        // Keep in editing state on error
      } finally {
        setSavingRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(studentId);
          return newSet;
        });
      }
    },
    [editingRows, onUpdate, cancelEditing]
  );

  // Handle delete with confirmation
  const handleDelete = useCallback(
    async (studentId: number, studentName: string) => {
      if (
        window.confirm(
          `Are you sure you want to delete ${studentName}? This action cannot be undone.`
        )
      ) {
        try {
          await onDelete(studentId);
        } catch (error) {
          console.error("Failed to delete student:", error);
        }
      }
    },
    [onDelete]
  );

  // Handle new student creation
  const handleCreateStudent = useCallback(async () => {
    setIsCreating(true);
    try {
      await onCreate(newStudentData);
      setNewStudentData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gradeLevel: "",
        parentId: null,
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Failed to create student. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }, [onCreate, newStudentData]);

  // Handle input change for new student form
  const handleNewStudentChange = useCallback(
    (field: keyof CreateStudentData, value: string | number | null) => {
      setNewStudentData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Render editable cell
  const renderEditableCell = (
    student: Student,
    field: keyof Student,
    type: "text" | "date" | "number" = "text"
  ) => {
    const isEditing = editingRows[student.id]?.[field]?.isEditing;
    const currentValue = isEditing
      ? editingRows[student.id][field].value
      : (student[field] as string | number | null);

    if (isEditing) {
      return (
        <Form.Control
          type={type}
          size="sm"
          value={currentValue ?? ""}
          onChange={(e) => {
            const value =
              type === "number"
                ? e.target.value
                  ? Number(e.target.value)
                  : null
                : e.target.value;
            updateField(student.id, field, value);
          }}
          className="editable-input"
        />
      );
    }

    return <span>{currentValue ?? "N/A"}</span>;
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      {/* Header with Add Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button
          variant="success"
          onClick={() => setShowAddModal(true)}
          size="sm"
          className="d-flex align-items-center"
        >
          <i className="bi bi-plus-circle me-2"></i>
          <span className="d-none d-md-inline">
            {t("addStudent", "Add New Student")}
          </span>
          <span className="d-md-none">{t("add", "Add")}</span>
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="d-none d-lg-block">
        <div className="table-responsive">
          <Table striped bordered hover size="sm">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>{t("firstName", "First Name")}</th>
                <th>{t("lastName", "Last Name")}</th>
                <th>{t("dateOfBirth", "Date of Birth")}</th>
                <th>{t("grade", "Grade Level")}</th>
                <th>{t("parentKey", "Parent Key")}</th>
                <th>Parent ID</th>
                <th>{t("parentName", "Parent Name")}</th>
                <th>{t("actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const isEditing = editingRows[student.id];
                const isSaving = savingRows.has(student.id);

                return (
                  <tr
                    key={student.id}
                    className={isEditing ? "table-warning" : ""}
                  >
                    <td>{student.id}</td>
                    <td>{renderEditableCell(student, "firstName")}</td>
                    <td>{renderEditableCell(student, "lastName")}</td>
                    <td>
                      {renderEditableCell(student, "dateOfBirth", "date")}
                    </td>
                    <td>{renderEditableCell(student, "gradeLevel")}</td>
                    <td>
                      <ParentKeyDisplay
                        parentKey={student.parentKey}
                        studentName={`${student.firstName} ${student.lastName}`}
                      />
                    </td>
                    <td>{renderEditableCell(student, "parentId", "number")}</td>
                    <td>{student.parentName || "N/A"}</td>
                    <td>
                      <ButtonGroup size="sm">
                        {isEditing ? (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => saveChanges(student.id)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <i className="bi bi-check-lg"></i>
                              )}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => cancelEditing(student.id)}
                              disabled={isSaving}
                            >
                              <i className="bi bi-x-lg"></i>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => startEditing(student)}
                            >
                              <i className="bi bi-pencil-square me-1"></i>
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleDelete(
                                  student.id,
                                  `${student.firstName} ${student.lastName}`
                                )
                              }
                            >
                              <i className="bi bi-trash3 me-1"></i>
                              Delete
                            </Button>
                          </>
                        )}
                      </ButtonGroup>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {students.length === 0 && (
          <div className="text-center p-4">
            <Alert variant="info">
              {t("noStudentsFound", "No students found.")}
            </Alert>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="d-lg-none">
        {students.length === 0 ? (
          <Card className="text-center">
            <Card.Body className="py-5">
              <i className="bi bi-people display-1 text-muted mb-3"></i>
              <h5 className="text-muted">
                {t("noStudentsFound", "No students found.")}
              </h5>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-3">
            {students.map((student) => {
              const isEditing = editingRows[student.id];
              const isSaving = savingRows.has(student.id);
              const age = calculateAge(student.dateOfBirth);

              return (
                <Col xs={12} key={student.id}>
                  <Card
                    className={`h-100 ${isEditing ? "border-warning" : ""}`}
                  >
                    <Card.Body className="p-3">
                      <Row className="align-items-start">
                        <Col xs={8}>
                          <div className="d-flex align-items-center mb-2">
                            <Badge bg="primary" className="me-2">
                              #{student.id}
                            </Badge>
                            <h6 className="mb-0 text-truncate">
                              {renderEditableCell(student, "firstName")}{" "}
                              {renderEditableCell(student, "lastName")}
                            </h6>
                          </div>

                          <div className="small text-muted mb-2">
                            <div className="d-flex justify-content-between">
                              <span>
                                <i className="bi bi-calendar3 me-1"></i>
                                {formatDate(student.dateOfBirth)}
                                {age && (
                                  <span className="ms-1">
                                    (
                                    <Badge bg="secondary" text="white">
                                      {age}y
                                    </Badge>
                                    )
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <span>
                                <i className="bi bi-mortarboard me-1"></i>
                                {renderEditableCell(student, "gradeLevel")}
                              </span>
                            </div>
                            {student.parentName && (
                              <div className="mt-1">
                                <i className="bi bi-person me-1"></i>
                                {student.parentName}
                              </div>
                            )}
                          </div>
                        </Col>

                        <Col xs={4} className="text-end">
                          <ButtonGroup size="sm" vertical className="w-100">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => saveChanges(student.id)}
                                  disabled={isSaving}
                                  className="mb-1"
                                >
                                  {isSaving ? (
                                    <Spinner animation="border" size="sm" />
                                  ) : (
                                    <i className="bi bi-check"></i>
                                  )}
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => cancelEditing(student.id)}
                                  disabled={isSaving}
                                >
                                  <i className="bi bi-x"></i>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => startEditing(student)}
                                  className="mb-1"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(
                                      student.id,
                                      `${student.firstName} ${student.lastName}`
                                    )
                                  }
                                >
                                  <i className="bi bi-trash3"></i>
                                </Button>
                              </>
                            )}
                          </ButtonGroup>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Add New Student Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-plus me-2"></i>
            Add New Student
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newStudentData.firstName}
                  onChange={(e) =>
                    handleNewStudentChange("firstName", e.target.value)
                  }
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newStudentData.lastName}
                  onChange={(e) =>
                    handleNewStudentChange("lastName", e.target.value)
                  }
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <DatePicker
                  value={newStudentData.dateOfBirth}
                  onChange={(value) =>
                    handleNewStudentChange("dateOfBirth", value)
                  }
                  label={t("dateOfBirth", "Date of Birth")}
                  placeholder={t("datePicker.selectDate", "Select date")}
                  required
                  maxDate={new Date().toISOString().split("T")[0]} // Can't be in the future
                />
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Grade Level</Form.Label>
                <Form.Control
                  type="text"
                  value={newStudentData.gradeLevel}
                  onChange={(e) =>
                    handleNewStudentChange("gradeLevel", e.target.value)
                  }
                  placeholder="Enter grade level"
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <Form.Label>Parent ID (Optional)</Form.Label>
              <Form.Control
                type="number"
                value={newStudentData.parentId ?? ""}
                onChange={(e) =>
                  handleNewStudentChange(
                    "parentId",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="Enter parent ID (leave empty if no parent)"
              />
              <Form.Text className="text-muted">
                Leave empty if the student doesn't have a parent account yet.
              </Form.Text>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAddModal(false)}
            disabled={isCreating}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleCreateStudent}
            disabled={
              isCreating ||
              !newStudentData.firstName ||
              !newStudentData.lastName ||
              !newStudentData.dateOfBirth ||
              !newStudentData.gradeLevel
            }
          >
            {isCreating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Create Student
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EditableGrid;
