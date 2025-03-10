  import React, { useState } from "react";
  import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
  import Modal from "react-modal";
  import "./ChangePassword.css"; // Import the CSS file
  
  Modal.setAppElement("#root");
  
  const ChangePassword = () => {
    const auth = getAuth();
    const user = auth.currentUser;
  
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
  
    // Popups state
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
  
    const handleChangePassword = async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        showError("⚠️ All fields are required.");
        return;
      }
      if (newPassword.length < 6) {
        showError("⚠️ Password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        showError("⚠️ New passwords do not match.");
        return;
      }
  
      try {
        // Reauthenticate the user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
  
        // Update password
        await updatePassword(user, newPassword);
        showSuccess("✅ Password successfully changed!");
  
        // Clear fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (error) {
        showError(handleFirebaseError(error.code));
      }
    };
  
    // Handle Firebase errors
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
  
    // Popup functions
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
  
    return (
      <div className="change-password-container">
        <h2>Change Password</h2>
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-field"
        />
        <button onClick={handleChangePassword} className="change-button">Update Password</button>
  
        {/* SUCCESS MODAL */}
        <Modal
          isOpen={showSuccessModal}
          onRequestClose={closeSuccessModal}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <h2 className="success-title">Success 🎉</h2>
          <p>{successMessage}</p>
          <button onClick={closeSuccessModal} className="close-button">OK</button>
        </Modal>
  
        {/* ERROR MODAL */}
        <Modal
          isOpen={showErrorModal}
          onRequestClose={closeErrorModal}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <h2 className="error-title">Error ❌</h2>
          <p>{errorMessage}</p>
          <button onClick={closeErrorModal} className="close-button">Close</button>
        </Modal>
      </div>
    );
  };
  
  export default ChangePassword;
  
