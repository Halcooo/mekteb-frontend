import React, { useState, useEffect } from "react";
import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import PageLayout from "../components/PageLayout";
import { profileApi } from "../api/profileApi";
import PushSettings from '../notifications/PushSettings';
import './Profile.scss';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user, logoutAll } = useAuth();
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
    queryKey: ["profile", user?.id],
    queryFn: () => profileApi.getCurrentProfile(),
    enabled: Boolean(user),
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string }) =>
      profileApi.updateProfile(user?.id ?? 0, data),
    onSuccess: () => {
      setSuccess(
        t("profileSettings.updateSuccess", "Profile updated successfully!"),
      );
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: () => {
      setError(t('profileSettings.updateError'));
    },
  });

  // Update form data when profile data is loaded
  useEffect(() => {
    if (profileData) {
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
            {t('profileSettings.loadError')}
          </Alert>
        </Container>
      </PageLayout>
    );
  }

  if (!profileData) {
    return (
      <PageLayout>
        <Container className="py-5">
          <Alert variant="warning">
            {t("profileSettings.noData", "No profile data available")}
          </Alert>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={t('profileSettings.myProfile')} subtitle={t('profileSettings.description')} className="profile-settings" maxWidth="lg">
      <Container className="profile-settings-content">

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible closeLabel={t("close")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible closeLabel={t("close")}>
            {success}
          </Alert>
        )}

        <Form className="profile-details" onSubmit={event=>{event.preventDefault();handleSave();}}>
          <h2>{t('profileSettings.edit')}</h2>
          {/* First Name */}
          <Form.Group className="mb-3" controlId="profile-first-name">
            <Form.Label>{t("firstName", "First Name")}</Form.Label>
            <Form.Control
              type="text"
              name="firstName"
              value={formData.firstName}
              autoComplete="given-name"
              maxLength={100}
              onChange={handleInputChange}
              disabled={updateMutation.isPending}
            />
          </Form.Group>

          {/* Last Name */}
          <Form.Group className="mb-3" controlId="profile-last-name">
            <Form.Label>{t("lastName", "Last Name")}</Form.Label>
            <Form.Control
              type="text"
              name="lastName"
              value={formData.lastName}
              autoComplete="family-name"
              maxLength={100}
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
              value={t(`comments.${profileData?.role==='user'?'parent':profileData?.role}`)}
              disabled
              className="bg-light"
            />
          </Form.Group>

          {/* Buttons */}
          <div className="d-flex gap-2">
            <Button
              variant="success"
              type="submit"
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
          <div className="border-top mt-4 pt-3">
            <h5>{t("authSession.devicesTitle", "Signed-in devices")}</h5>
            <p className="text-muted">{t("authSession.logoutAllDescription")}</p>
            <Button variant="outline-danger" onClick={() => {
              void logoutAll().catch(() => { /* AuthProvider keeps the retryable failure visible. */ });
            }}>
              {t("authSession.logoutAll", "Sign out on all devices")}
            </Button>
          </div>
        </Form>
        <PushSettings />
      </Container>
    </PageLayout>
  );
};

export default Profile;
