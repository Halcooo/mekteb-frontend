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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import type { LoginCredentials } from "../api/authApi";

const LoginJWT: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Helper function to translate backend errors
  const getTranslatedError = (backendError: string): string => {
    // Map common backend error messages to translation keys
    const errorMap: Record<string, string> = {
      "Invalid credentials": "invalidCredentials",
      "User not found": "userNotFound",
      "Invalid password": "invalidPassword",
      "Username, email and password are required": "usernameRequired",
      "Invalid email or password": "invalidEmailOrPassword",
      "User with this email already exists": "userWithEmailExists",
      "User with this username already exists": "userWithUsernameExists",
      "Token expired": "tokenExpired",
      "Invalid token": "invalidToken",
      "Access denied": "accessDenied",
    };

    return errorMap[backendError] ? t(errorMap[backendError]) : backendError;
  };

  const [formData, setFormData] = useState<LoginCredentials>({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      // Clear any errors
      setErrors({});

      // Login user with the response data
      login(response.accessToken, response.refreshToken, response.user);

      // Redirect to the page they came from or dashboard
      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname ||
        "/";
      navigate(from, { replace: true });
    },
    onError: (error: unknown) => {
      console.error("Login error:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        if (axiosError.response?.data?.error) {
          const translatedError = getTranslatedError(
            axiosError.response.data.error
          );
          setErrors({ submit: translatedError });
        } else {
          setErrors({ submit: t("loginFailed") });
        }
      } else {
        setErrors({ submit: t("loginFailed") });
      }
    },
  });

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = t("usernameRequired");
    }

    if (!formData.password) {
      newErrors.password = t("passwordRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    loginMutation.mutate(formData);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center bg-light"
    >
      <Row className="w-100">
        <Col xs={12} sm={8} md={6} lg={4} className="mx-auto">
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">
                  {t("signInToYourAccount")}
                </h2>
                <p className="text-muted">{t("welcomeBackMessage")}</p>
              </div>

              {errors.submit && (
                <Alert variant="danger" className="mb-3">
                  {errors.submit}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>{t("username")}</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    isInvalid={!!errors.username}
                    placeholder={t("enterUsername")}
                    disabled={loginMutation.isPending}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t("password")}</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                    placeholder={t("enterPassword")}
                    disabled={loginMutation.isPending}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      {t("signingIn")}
                    </>
                  ) : (
                    t("signIn")
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  {t("dontHaveAccount")}{" "}
                  <Link
                    to="/register"
                    className="text-primary text-decoration-none fw-bold"
                  >
                    {t("signUpHere")}
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

export default LoginJWT;
