import React, { useState, useEffect } from "react";
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
import Loader from "./Loader";

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
    const [loading, setLoading] = useState(false);

    // Apply background image when component mounts
    useEffect(() => {
        document.body.className = "signup-page";
        // Cleanup function to reset when component unmounts
        return () => {
            document.body.className = "";
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarSelect = (avatar) => {
        setFormData({ ...formData, avatar });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
        }

        if (!formData.avatar) {
            setError("Please select an avatar!");
            setLoading(false);
            return;
        }

        const auth = getAuth();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await sendEmailVerification(user);

            // Create user document in the 'users' collection, using uid as document ID
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                avatar: formData.avatar,
                email: formData.email, // Optionally store email in the user document
            });

            setLoading(false);
            setShowModal(true);
            setTimeout(() => {
                setShowModal(false);
                navigate("/signin");
            }, 5000);
        } catch (error) {
            console.error("Error signing up:", error.message);
            setError(error.message);
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        navigate("/signin");
    };

    return (
        <div className="auth-container">
            {loading && <Loader />}
            <h2>Create Account</h2>
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

                <h3 className="avatar-heading">Choose Avatar</h3>
                <div className="avatar-grid">
                    {avatars.map((avt, index) => (
                        <img
                            key={index}
                            src={avt}
                            alt={`Avatar ${index + 1}`}
                            className={`avatar-option ${formData.avatar === avt ? "selected" : ""}`}
                            onClick={() => handleAvatarSelect(avt)}
                        />
                    ))}
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" className="auth-button">Create Account</button>
                <p>
                    <a className="auth-link" href="/signin">Already Have an Account? Sign In</a>
                </p>
            </form>

            {/* Email verification popup overlay */}
            {showModal && (
                <div className="popup-overlay">
                    <div className="popup-box">
                        <h3>Email Verification Sent!</h3>
                        <p className="verification-text">
                            Please check your email to verify your account. You'll need to verify
                            your email before you can sign in.
                        </p>
                        <p className="verification-note">
                            If you don't see the email, check your spam folder.
                        </p>
                        <div className="popup-buttons">
                            <button className="cancel" onClick={closeModal}>Continue to Sign In</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignUp;