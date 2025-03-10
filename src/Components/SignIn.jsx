import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Modal from "react-modal";
import "./AuthStyles.css"; // Importing styles

Modal.setAppElement("#root");

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSignIn = async () => {
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        setErrorMessage("Please verify your email before signing in.");
        setShowErrorModal(true);
      } else {
        setSuccessMessage("Signed in successfully!");
        setShowSuccessModal(true);
        setTimeout(() => navigate("/profile"), 2000);
      }

      setEmail("");
      setPassword("");
    } catch (error) {
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
      default:
        return "Something went wrong: " + code;
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign In</h2>
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
      <button className="auth-button" onClick={handleSignIn}>Login</button>
      <p>
        <Link className="auth-link" to="/forgot-password">Forgot Password?</Link>
      </p>

      <Modal isOpen={showSuccessModal} onRequestClose={() => setShowSuccessModal(false)} className="modal">
        <h2>Success</h2>
        <p>{successMessage}</p>
        <button onClick={() => setShowSuccessModal(false)}>OK</button>
      </Modal>

      <Modal isOpen={showErrorModal} onRequestClose={() => setShowErrorModal(false)} className="modal">
        <h2>Error</h2>
        <p>{errorMessage}</p>
        <button onClick={() => setShowErrorModal(false)}>Close</button>
      </Modal>
    </div>
  );
};

export default SignIn;
