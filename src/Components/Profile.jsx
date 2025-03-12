import React, { useEffect, useState } from "react";
import { auth, db } from "../auth/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import SignOut from "./SignOut";
import Poems from "./Poems";
import { Link } from "react-router-dom";
import defaultAvatar from "../images/avatar.png";
import "./Profile.css";
import Loader from "./Loader"; // Import Loader

const Profile = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ firstName: "", lastName: "", avatar: "" });
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [loading, setLoading] = useState(true); // Add loading state

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const userRef = doc(db, "users", currentUser.email);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setUserData(userSnap.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setUser(null);
                setUserData({ firstName: "", lastName: "", avatar: "" });
            }
            setLoading(false); // Set loading to false after data is fetched
        });
        return () => unsubscribe();
    }, []);

    const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

    if (loading) {
        return <Loader />; // Show loader while loading
    }

    if (!user) {
        return <p>Please sign in to view your profile.</p>;
    }

    return (
        <div className="profile-container">
            {/* Navigation Bar */}
            <nav className="glass-nav">
                <div className="nav-content">
                    <button className="profile-pic-btn" onClick={toggleProfileMenu}>
                        <img
                            src={userData.avatar || defaultAvatar}
                            alt="Profile"
                            className="profile-pic"
                        />
                    </button>
                    <button
                        className="add-new-btn"
                        onClick={() => document.querySelector('.add-button').click()}
                    >
                        + New Poem
                    </button>
                </div>
            </nav>

            {/* Profile Menu Modal */}
            {showProfileMenu && (
                <div className="profile-menu-overlay" onClick={toggleProfileMenu}>
                    <div className="glass-profile-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="menu-header">
                            <img
                                src={userData.avatar || defaultAvatar}
                                alt="Profile"
                                className="menu-profile-pic"
                            />
                            <h3>
                                {userData.firstName && userData.lastName
                                    ? `${userData.firstName} ${userData.lastName}`
                                    : "User"}
                            </h3>
                            <p className="menu-email">{user.email}</p>
                        </div>

                        <div className="menu-actions">
                            <Link to="/change-password" className="menu-item">
                                Change Password
                            </Link>
                            <Link to="/edit-profile" className="menu-item">
                                Edit Profile
                            </Link>
                            <SignOut className="menu-item" />
                            <button className="close-menu" onClick={toggleProfileMenu}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Poems />
        </div>
    );
};

export default Profile;