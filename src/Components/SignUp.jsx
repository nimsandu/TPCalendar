import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import Modal from "react-modal";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../auth/firebaseConfig";
import "./AuthStyles.css";
import { useNavigate } from "react-router-dom";
import avatar1 from "../images/avatar1.png";
import avatar2 from "../images/avatar2.png";
import avatar3 from "../images/avatar3.png";
import avatar4 from "../images/avatar4.png";
import avatar5 from "../images/avatar5.png";
import Loader from "./Loader"; // Import Loader

const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: "",
  });
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (avatar) => {
    setFormData({ ...formData, avatar });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Start loading

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false); // Stop loading if passwords don't match
      return;
    }

    const auth = getAuth();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);

      const userDocRef = doc(db, "users", formData.email);
      await setDoc(userDocRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        avatar: formData.avatar,
        email: formData.email,
      });

      setLoading(false); // Stop loading
      setShowModal(true);
      setTimeout(() => {
        setShowModal(false);
        navigate("/signin");
      }, 3000);
    } catch (error) {
      console.error("Error signing up:", error.message);
      setError(error.message);
      setLoading(false); // Stop loading on error
    }
  };

  return (
    <div className="auth-container">
      {loading && <Loader />} {/* Show loader when loading */}
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          className="auth-input"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          className="auth-input"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="auth-input"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="auth-input"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          className="auth-input"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        <h3 style={{ color: "white", marginTop: "10px" }}>Choose Avatar</h3>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          {avatars.map((avt, index) => (
            <img
              key={index}
              src={avt}
              alt={`Avatar ${index + 1}`}
              style={{
                width: "50px",
                height: "50px",
                cursor: "pointer",
                border:
                  formData.avatar === avt
                    ? "3px solid #ff9a9e"
                    : "3px solid transparent",
                borderRadius: "50%",
                transition: "0.3s",
              }}
              onClick={() => handleAvatarSelect(avt)}
            />
          ))}
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" className="auth-button">
          Sign Up
        </button>
        <p>
          <a className="auth-link" href="/signin">
            Already Have an Account? Sign In
          </a>
        </p>
      </form>

      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        className="modalcard modal-center" // added modal-center
      >
        <h2>Email Verification Sent!</h2>
        <p>Please check your email to verify your account.</p>
        <button onClick={() => setShowModal(false)}>OK</button>
      </Modal>
    </div>
  );
};

export default SignUp;