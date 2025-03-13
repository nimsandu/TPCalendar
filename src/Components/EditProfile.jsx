import React, { useState, useEffect } from "react";
import { auth, db } from "../auth/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import avatar1 from "../images/avatar1.png";
import avatar2 from "../images/avatar2.png";
import avatar3 from "../images/avatar3.png";
import avatar4 from "../images/avatar4.png";
import avatar5 from "../images/avatar5.png";
import Loader from "./Loader"; // Import Loader
import "./EditProfile.css";

const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

const EditProfile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ firstName: "", lastName: "", avatar: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true); // Add loading state

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRef = doc(db, "users", auth.currentUser.email);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            } finally {
                setLoading(false); // Stop loading after fetch
            }
        };

        fetchUserData();
    }, []);

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleAvatarSelect = (avatar) => {
        setUserData({ ...userData, avatar });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true); // Start loading before update

        try {
            const userRef = doc(db, "users", auth.currentUser.email);
            await updateDoc(userRef, {
                firstName: userData.firstName,
                lastName: userData.lastName,
                avatar: userData.avatar,
            });
            navigate("/profile");
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.message);
        } finally {
            setLoading(false); // Stop loading after update
        }
    };

    return (
        <div className="auth-container">
            {loading && <Loader />} {/* Show loader when loading */}
            <button className="apple-back-button" onClick={() => navigate(-1)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="auth-input"
                    value={userData.firstName}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className="auth-input"
                    value={userData.lastName}
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
                                    userData.avatar === avt ? "3px solid #ff9a9e" : "3px solid transparent",
                                borderRadius: "50%",
                                transition: "0.3s",
                            }}
                            onClick={() => handleAvatarSelect(avt)}
                        />
                    ))}
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit" className="auth-button">Save Changes</button>
            </form>
        </div>
    );
};

export default EditProfile;