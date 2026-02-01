import React, { useState, useEffect } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import PageLayout from "../components/PageLayout";
import { profileApi } from "../api/profileApi";

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });

  // Fetch user profile
  const {
    data: profileData,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getCurrentProfile(),
  });

  // Debug logging
  useEffect(() => {
    console.log("Profile component loaded");
    console.log("isLoading:", isLoading);
    console.log("queryError:", queryError);
    console.log("profileData:", profileData);
  }, [isLoading, queryError, profileData]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string }) =>
      profileApi.updateProfile(user?.id ?? 0, data),
    onSuccess: () => {
      setSuccess(
        t("profileSettings.updateSuccess", "Profile updated successfully!"),
      );
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: unknown) => {
      const apiError = error as {
        response?: { data?: { error?: string } };
      };
      setError(
        apiError?.response?.data?.error ||
          t("profileSettings.updateError", "Failed to update profile"),
      );
    },
  });

  // Update form data when profile data is loaded
  useEffect(() => {
    console.log("useEffect triggered - profileData:", profileData);
    if (profileData) {
      console.log("Setting formData with:", {
        firstName: profileData.first_name,
        lastName: profileData.last_name,
      });
      setFormData({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
      });
    }
  }, [profileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError(
        t(
          "profileSettings.nameLengthError",
          "First and last name are required",
        ),
      );
      return;
    }

    setError(null);
    setSuccess(null);

    updateMutation.mutate({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
    });
  };

  const handleCancel = () => {
    setFormData({
      firstName: profileData?.first_name || "",
      lastName: profileData?.last_name || "",
    });
    setError(null);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <Container className="py-5 text-center">
          <Spinner animation="border" role="status" />
          <p className="mt-3">{t("common.loading", "Loading...")}</p>
        </Container>
      </PageLayout>
    );
  }

  if (queryError) {
    return (
      <PageLayout>
        <Container className="py-5">
          <Alert variant="danger">
            {t("profileSettings.updateError", "Failed to load profile")}
            <br />
            <small>{String(queryError)}</small>
          </Alert>
        </Container>
      </PageLayout>
    );
  }

  if (!profileData) {
    return (
      <PageLayout>
        <Container className="py-5">
          <Alert variant="warning">No profile data available</Alert>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container className="py-4" style={{ maxWidth: "600px" }}>
        <h2 className="mb-4">{t("profile", "Profile")}</h2>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        <Form>
          {/* First Name */}
          <Form.Group className="mb-3">
            <Form.Label>{t("firstName", "First Name")}</Form.Label>
            <Form.Control
              type="text"
              name="firstName"
              value={formData.firstName || profileData?.first_name || ""}
              onChange={handleInputChange}
              disabled={updateMutation.isPending}
            />
          </Form.Group>

          {/* Last Name */}
          <Form.Group className="mb-3">
            <Form.Label>{t("lastName", "Last Name")}</Form.Label>
            <Form.Control
              type="text"
              name="lastName"
              value={formData.lastName || profileData?.last_name || ""}
              onChange={handleInputChange}
              disabled={updateMutation.isPending}
            />
          </Form.Group>

          {/* Email (Read-only) */}
          <Form.Group className="mb-3">
            <Form.Label>{t("email", "Email")}</Form.Label>
            <Form.Control
              type="email"
              value={profileData?.email || ""}
              disabled
              className="bg-light"
            />
          </Form.Group>

          {/* Username (Read-only) */}
          <Form.Group className="mb-3">
            <Form.Label>{t("username", "Username")}</Form.Label>
            <Form.Control
              type="text"
              value={profileData?.username || ""}
              disabled
              className="bg-light"
            />
          </Form.Group>

          {/* Role (Read-only) */}
          <Form.Group className="mb-4">
            <Form.Label>{t("role", "Role")}</Form.Label>
            <Form.Control
              type="text"
              value={profileData?.role || ""}
              disabled
              className="bg-light"
            />
          </Form.Group>

          {/* Buttons */}
          <div className="d-flex gap-2">
            <Button
              variant="success"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {t("saving", "Saving...")}
                </>
              ) : (
                t("save", "Save")
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              {t("cancel", "Cancel")}
            </Button>
          </div>
        </Form>
      </Container>
    </PageLayout>
  );
};

export default Profile;
