import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Modal from "react-modal";

Modal.setAppElement("#root");

const SignIn = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // For popups
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSignIn = async () => {
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Check if user is verified
      if (!userCredential.user.emailVerified) {
        // Show error popup telling them to verify email
        setErrorMessage("Please verify your email before signing in.");
        setShowErrorModal(true);
        setSuccessMessage(null);
        setShowSuccessModal(false);
      } else {
        // Show success popup or just navigate
        setSuccessMessage("Signed in successfully!");
        setShowSuccessModal(true);
        setErrorMessage(null);
        setShowErrorModal(false);

        // Optionally auto-redirect after a short delay
        // setTimeout(() => navigate("/profile"), 2000);
      }

      // Clear fields
      setEmail("");
      setPassword("");
    } catch (error) {
      setSuccessMessage(null);
      setShowSuccessModal(false);
      setErrorMessage(handleFirebaseError(error.code));
      setShowErrorModal(true);
    }
  };

  const handleFirebaseError = (code) => {
    switch (code) {
      case "auth/wrong-password":
        return "Invalid password.";
      case "auth/user-not-found":
        return "No user found with that email.";
      case "auth/invalid-email":
        return "Invalid email format.";
      default:
        return "Something went wrong: " + code;
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage(null);
    // Navigate to profile on success
    navigate("/profile");
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage(null);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Sign In</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /><br/><br/>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br/><br/>
      <button onClick={handleSignIn}>Login</button>

      <p>
        <Link to="/forgot-password">Forgot Password?</Link>
      </p>

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

export default SignIn;
