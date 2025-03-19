import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import Modal from "react-modal";
import { Link } from "react-router-dom"; // Import Link
import Loader from "./Loader";
import "./ForgotPassword.css";

Modal.setAppElement("#root");

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handlePasswordReset = async () => {
    setLoading(true);
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("✅ Password reset email sent! Check your inbox.");
      setShowSuccessModal(true);
      setErrorMessage(null);
      setShowErrorModal(false);
      setEmail("");
    } catch (error) {
      setErrorMessage(handleFirebaseError(error.code));
      setShowErrorModal(true);
      setSuccessMessage(null);
      setShowSuccessModal(false);
    } finally {
      setLoading(false);
    }
  };

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

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage(null);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage(null);
  };

  return (
    <div className="forgot-password-page">
      <div className="auth-container">
        
        {loading && <Loader />}
        <h2>Forgot Password</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <button onClick={handlePasswordReset} className="auth-button">
          Send Reset Email
        </button>
        <Link to="/signin" className="back-button">
            Back to Login
        </Link>

        <Modal
          isOpen={showSuccessModal}
          onRequestClose={closeSuccessModal}
          className="glass-modal modal-content"
          overlayClassName="modal-overlay"
        >
          <h2 className="success-title">Success 🎉</h2>
          <p>{successMessage}</p>
          <button onClick={closeSuccessModal} className="modal-close-btn">
            OK
          </button>
        </Modal>

        <Modal
          isOpen={showErrorModal}
          onRequestClose={closeErrorModal}
          className="glass-modal modal-content"
          overlayClassName="modal-overlay"
        >
          <h2 className="error-title">Error ❌</h2>
          <p>{errorMessage}</p>
          <button onClick={closeErrorModal} className="modal-close-btn">
            Close
          </button>
        </Modal>
      </div>
    </div>
  );
};

export default ForgotPassword;