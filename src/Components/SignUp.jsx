import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import Modal from "react-modal";
import "./AuthStyles.css"; // Importing styles
import { useNavigate } from "react-router-dom";

Modal.setAppElement("#root");

const SignUp = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Popups
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSignUp = async () => {
    // 1. Basic checks before calling Firebase
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    try {
      const auth = getAuth();
      // 2. Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 3. Send email verification
      await sendEmailVerification(userCredential.user);

      // 4. Show success popup
      setSuccessMessage("Account created! Check your email to verify.");
      setShowSuccessModal(true);

      // Clear fields
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      showError(handleFirebaseError(error.code));
    }
  };

  // Simple helper to interpret Firebase error codes
  const handleFirebaseError = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "That email is already in use.";
      case "auth/weak-password":
        return "Your password is too weak. Please choose a stronger one.";
      case "auth/invalid-email":
        return "Invalid email format.";
      default:
        return "Something went wrong: " + code;
    }
  };

  // Show an error popup
  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
    setSuccessMessage(null);
    setShowSuccessModal(false);
  };

  // Close success modal
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage(null);
    // Optionally navigate to sign in page:
    // navigate("/signin");
  };

  // Close error modal
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage(null);
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      
      <input
        type="email"
        className="auth-input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="auth-input"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        className="auth-input"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button className="auth-button" onClick={handleSignUp}>Register</button>

      {/* SUCCESS MODAL */}
      <Modal
        isOpen={showSuccessModal}
        onRequestClose={closeSuccessModal}
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Success</h2>
        <p>{successMessage}</p>
        <button onClick={closeSuccessModal}>OK</button>
      </Modal>

      {/* ERROR MODAL */}
      <Modal
        isOpen={showErrorModal}
        onRequestClose={closeErrorModal}
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Error</h2>
        <p>{errorMessage}</p>
        <button onClick={closeErrorModal}>Close</button>
      </Modal>
    </div>
  );
};

export default SignUp;
