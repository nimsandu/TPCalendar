import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Modal from "react-modal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../auth/firebaseConfig";
import "./AuthStyles.css";
import Loader from "./Loader";

Modal.setAppElement("#root");

const SignIn = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    // Apply background image when component mounts
    useEffect(() => {
        document.body.className = "signin-page";
        // Cleanup function to reset when component unmounts
        return () => {
            document.body.className = "";
        };
    }, []);

    const handleSignIn = async () => {
        const auth = getAuth();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setLoading(true);

        try {
            await handleSignIn();
            setLoading(false);
        } catch (error) {
            setLoading(false);
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
            {loading && <Loader />}
            <h2>Welcome Back</h2>
            <div className="auth-content">
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
                <button className="auth-button" onClick={handleSubmit}>
                    Sign In
                </button>

                <div className="auth-links">
                    <Link className="auth-link" to="/forgot-password">
                        Forgot Password?
                    </Link>
                    <span className="auth-divider">|</span>
                    <Link className="auth-link" to="/signup">
                        Create Account
                    </Link>
                </div>
            </div>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onRequestClose={() => setShowSuccessModal(false)}
                className="glass-modal"
                overlayClassName="modal-overlay"
            >
                <div className="modal-content">
                    <h3>🎉 Success!</h3>
                    <p>{successMessage}</p>
                    <button
                        className="modal-close-btn"
                        onClick={() => setShowSuccessModal(false)}
                    >
                        Continue
                    </button>
                </div>
            </Modal>

            {/* Error Modal */}
            <Modal
                isOpen={showErrorModal}
                onRequestClose={() => setShowErrorModal(false)}
                className="glass-modal"
                overlayClassName="modal-overlay"
            >
                <div className="modal-content">
                    <h3>⚠️ Error</h3>
                    <p>{errorMessage}</p>
                    <button
                        className="modal-close-btn error"
                        onClick={() => setShowErrorModal(false)}
                    >
                        Try Again
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default SignIn;