import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

interface RegisterFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "teacher" | "admin";
}

interface RegisterErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  submit?: string;
}

const RegisterJWT: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Helper function to translate backend errors
  const getTranslatedError = (backendError: string): string => {
    const errorMap: Record<string, string> = {
      "User with this email already exists": "userWithEmailExists",
      "User with this username already exists": "userWithUsernameExists",
      "First name, last name, username, email and password are required":
        "firstNameRequired",
      "Invalid email or password": "invalidEmailOrPassword",
      "Registration failed": "registrationFailed",
    };

    return errorMap[backendError] ? t(errorMap[backendError]) : backendError;
  };

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [errors, setErrors] = useState<RegisterErrors>({});

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterFormData, "confirmPassword">) => {
      const response = await authApi.register(data);
      return response;
    },
    onSuccess: (data) => {
      console.log("Registration successful:", data);

      // Automatically log in the user after successful registration
      if (data.accessToken && data.refreshToken && data.user) {
        login(data.accessToken, data.refreshToken, data.user);
        navigate("/", { replace: true });
      }
    },
    onError: (error: unknown) => {
      console.error("Registration error:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: { error?: string; errors?: Record<string, string> };
          };
        };
        if (axiosError.response?.data?.errors) {
          // Handle validation errors from backend
          setErrors(axiosError.response.data.errors);
        } else if (axiosError.response?.data?.error) {
          const translatedError = getTranslatedError(
            axiosError.response.data.error
          );
          setErrors({ submit: translatedError });
        } else {
          setErrors({ submit: t("registrationFailed") });
        }
      } else {
        setErrors({ submit: t("registrationFailed") });
      }
    },
  });

  const validateForm = (): boolean => {
    const newErrors: RegisterErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("firstNameRequired");
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("lastNameRequired");
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = t("usernameRequired");
    } else if (formData.username.length < 3) {
      newErrors.username = t("usernameMinLength");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t("emailRequired");
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t("emailInvalid");
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t("passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("passwordMinLength");
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("passwordsMustMatch");
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = t("roleRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (errors[name as keyof RegisterErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Remove confirmPassword before sending to API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = formData;
    registerMutation.mutate(registerData);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2>{t("createAccount")}</h2>
                <p className="text-muted">{t("joinOurSystem")}</p>
              </div>

              {errors.submit && (
                <Alert variant="danger" className="mb-3">
                  {errors.submit}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t("firstName")}</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        isInvalid={!!errors.firstName}
                        placeholder={t("enterFirstName")}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.firstName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t("lastName")}</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        isInvalid={!!errors.lastName}
                        placeholder={t("enterLastName")}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.lastName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>{t("username")}</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    isInvalid={!!errors.username}
                    placeholder={t("chooseUsername")}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t("email")}</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!errors.email}
                    placeholder={t("enterEmail")}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t("role")}</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    isInvalid={!!errors.role}
                  >
                    <option value="student">{t("student")}</option>
                    <option value="teacher">{t("teacher")}</option>
                    <option value="admin">{t("admin")}</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.role}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t("password")}</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        isInvalid={!!errors.password}
                        placeholder={t("enterPassword")}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t("confirmPassword")}</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        isInvalid={!!errors.confirmPassword}
                        placeholder={t("confirmYourPassword")}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        {t("creatingAccount")}
                      </>
                    ) : (
                      t("createAccount")
                    )}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-3">
                <p className="mb-0">
                  {t("alreadyHaveAccount")}{" "}
                  <Link to="/login" className="text-decoration-none">
                    {t("signInHere")}
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterJWT;
