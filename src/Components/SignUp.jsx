import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import Modal from "react-modal";

Modal.setAppElement("#root");

const SignUp = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // For popups
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSignUp = async () => {
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send verification email
      await sendEmailVerification(userCredential.user);

      // Show success popup
      setSuccessMessage("Account created successfully! A verification email was sent. Please check your inbox.");
      setShowSuccessModal(true);
      setErrorMessage(null);
      setShowErrorModal(false);

      // Clear fields
      setEmail("");
      setPassword("");
    } catch (error) {
      // Show error popup
      setErrorMessage(handleFirebaseError(error.code));
      setShowErrorModal(true);
      setSuccessMessage(null);
      setShowSuccessModal(false);
    }
  };

  // Handle different Firebase error codes
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

  // Called when user closes success modal
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage(null);
    // Optionally navigate to sign in page
    // navigate("/signin");
  };

  // Called when user closes error modal
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage(null);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Sign Up</h2>
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
      <button onClick={handleSignUp}>Register</button>

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
