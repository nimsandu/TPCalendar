import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import Modal from "react-modal";
import "./ForgotPassword.css"; // Import the CSS file

Modal.setAppElement("#root");

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  // Popups state
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handlePasswordReset = async () => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);

      // Show success popup
      setSuccessMessage("✅ Password reset email sent! Check your inbox.");
      setShowSuccessModal(true);
      setErrorMessage(null);
      setShowErrorModal(false);

      // Clear the input field
      setEmail("");
    } catch (error) {
      // Show error popup
      setErrorMessage(handleFirebaseError(error.code));
      setShowErrorModal(true);
      setSuccessMessage(null);
      setShowSuccessModal(false);
    }
  };

  // Handle Firebase errors
  const handleFirebaseError = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "⚠️ Invalid email format. Please enter a valid email.";
      case "auth/user-not-found":
        return "⚠️ No account found with this email.";
      default:
        return "⚠️ Something went wrong. Please try again.";
    }
  };

  // Close popups
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage(null);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage(null);
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
      />
      <button onClick={handlePasswordReset} className="send-button">Send Reset Email</button>

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

export default ForgotPassword;
