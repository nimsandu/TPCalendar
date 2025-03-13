import React, { useState } from "react";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import Modal from "react-modal";
import "./ChangePassword.css";
import Loader from "./Loader";
import { useNavigate } from "react-router-dom";

Modal.setAppElement("#root");

const ChangePassword = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    const handleChangePassword = async () => {
        setLoading(true);
        if (!currentPassword || !newPassword || !confirmPassword) {
            showError("⚠️ All fields are required.");
            setLoading(false);
            return;
        }
        if (newPassword.length < 6) {
            showError("⚠️ Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            showError("⚠️ New passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);
            showSuccess("✅ Password successfully changed!");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setLoading(false);

            setTimeout(() => {
                navigate("/profile");
            }, 2000);
        } catch (error) {
            showError(handleFirebaseError(error.code));
            setLoading(false);
        }
    };

    const handleFirebaseError = (code) => {
        switch (code) {
            case "auth/wrong-password":
                return "⚠️ Incorrect current password.";
            case "auth/weak-password":
                return "⚠️ New password is too weak.";
            case "auth/too-many-requests":
                return "⚠️ Too many attempts. Try again later.";
            default:
                return "⚠️ Something went wrong. Please try again.";
        }
    };

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setShowSuccessModal(true);
        setErrorMessage(null);
        setShowErrorModal(false);
    };

    const showError = (message) => {
        setErrorMessage(message);
        setShowErrorModal(true);
        setSuccessMessage(null);
        setShowSuccessModal(false);
    };

    const closeSuccessModal = () => setShowSuccessModal(false);
    const closeErrorModal = () => setShowErrorModal(false);

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="change-password-page">
            <div className="change-password-card">
                {loading && <Loader />}
                <button className="modern-back-button" onClick={handleBack}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                </button>
                <h2 className="card-title">Change Password</h2>
                <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="modern-input"
                />
                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="modern-input"
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="modern-input"
                />
                <button onClick={handleChangePassword} className="modern-button">Update Password</button>

                <Modal
                    isOpen={showSuccessModal}
                    onRequestClose={closeSuccessModal}
                    className="modern-modal-content"
                    overlayClassName="modern-modal-overlay"
                >
                    <h2 className="modal-title">Success 🎉</h2>
                    <p>{successMessage}</p>
                    <button onClick={closeSuccessModal} className="modal-close-button">OK</button>
                </Modal>

                <Modal
                    isOpen={showErrorModal}
                    onRequestClose={closeErrorModal}
                    className="modern-modal-content"
                    overlayClassName="modern-modal-overlay"
                >
                    <h2 className="modal-title">Error ❌</h2>
                    <p>{errorMessage}</p>
                    <button onClick={closeErrorModal} className="modal-close-button">Close</button>
                </Modal>
            </div>
        </div>
    );
};

export default ChangePassword;