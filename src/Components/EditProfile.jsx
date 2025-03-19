import React, { useState, useEffect } from "react";
import { auth, db } from "../auth/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import avatar1 from "../images/avatar1.png";
import avatar2 from "../images/avatar2.png";
import avatar3 from "../images/avatar3.png";
import avatar4 from "../images/avatar4.png";
import avatar5 from "../images/avatar5.png";
import Loader from "./Loader";
import "./EditProfile.css";

const avatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

const EditProfile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ firstName: "", lastName: "", avatar: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // Apply background image when component mounts
    useEffect(() => {
        document.body.className = "editprofile-page";
        // Cleanup function to reset when component unmounts
        return () => {
            document.body.className = "";
        };
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRef = doc(db, "users", auth.currentUser.uid); // Use auth.currentUser.uid
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            } finally {
                setLoading(false);
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
        setLoading(true);

        try {
            const userRef = doc(db, "users", auth.currentUser.uid); // Use auth.currentUser.uid
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
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {loading && <Loader />}
            <button className="responsive-back-button" onClick={() => navigate(-1)}>
            <svg width="195px" height="195px" viewBox="0 0 1024.00 1024.00" fill="#ffffff" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" stroke-width="79.872"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M669.6 849.6c8.8 8 22.4 7.2 30.4-1.6s7.2-22.4-1.6-30.4l-309.6-280c-8-7.2-8-17.6 0-24.8l309.6-270.4c8.8-8 9.6-21.6 2.4-30.4-8-8.8-21.6-9.6-30.4-2.4L360.8 480.8c-27.2 24-28 64-0.8 88.8l309.6 280z" fill=""></path></g></svg>
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