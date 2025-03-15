import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../auth/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import SignOut from "./SignOut";
import Poems from "./Poems";
import { Link, useNavigate } from "react-router-dom";
import defaultAvatar from "../images/avatar.png";
import "./Profile.css";
import Loader from "./Loader";
import App from "../App";
import PoemModal from "./PoemModal"; // Import PoemModal

const Profile = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ firstName: "", lastName: "", avatar: "", email: "" });
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const poemsRef = useRef(null);
    const [isPoemModalOpen, setIsPoemModalOpen] = useState(false);
    const [poemToEditFromProfile, setPoemToEditFromProfile] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setUserData(userSnap.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setUser(null);
                setUserData({ firstName: "", lastName: "", avatar: "", email: "" });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

    const goToBackupPage = () => {
        navigate("/backup");
    };

    const handleOpenPoemModal = () => {
        setPoemToEditFromProfile(null); // Reset for adding new
        setIsPoemModalOpen(true);
    };

    const handleClosePoemModal = () => {
        setIsPoemModalOpen(false);
        setPoemToEditFromProfile(null);
    };

    const handleEditPoemFromChild = (poem) => {
        setPoemToEditFromProfile(poem);
        setIsPoemModalOpen(true);
    };

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return <App />;
    }

    return (
        <div className="profile-container">
            <nav className="glass-nav">
                <div className="nav-content">
                    <button className="profile-pic-btn" onClick={toggleProfileMenu}>
                        <img src={userData.avatar || defaultAvatar} alt="Profile" className="profile-pic" />
                    </button>
                    <button className="add-new-btn" onClick={handleOpenPoemModal}>
                        +
                    </button>
                </div>
            </nav>

            {showProfileMenu && (
                <div className="profile-menu-overlay" onClick={toggleProfileMenu}>
                    <div className="glass-profile-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="menu-header">
                            <img
                                src={userData.avatar || defaultAvatar}
                                alt="Profile"
                                className="menu-profile-pic"
                            />
                            <h3 className="menu-name">
                                {userData.firstName && userData.lastName
                                    ? `${userData.firstName} ${userData.lastName}`
                                    : "User"}
                            </h3>
                            <p className="menu-email">{userData.email}</p>
                        </div>

                        <div className="menu-actions">
                            <Link to="/change-password" className="menu-item">
                                Change Password
                            </Link>
                            <Link to="/edit-profile" className="menu-item">
                                Edit Profile
                            </Link>
                            <button className="backup-btn" onClick={goToBackupPage}>
                                Backup & Restore
                            </button>
                            <SignOut className="menu-item" />
                            <button className="close-menu" onClick={toggleProfileMenu}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="greeting-message">
                <h2>
                    {userData.firstName ? `Hi, ${userData.firstName}!` : "Welcome to your profile!"}
                </h2>
            </div>

            <Poems user={user} onOpenModal={handleOpenPoemModal} onEditPoem={handleEditPoemFromChild} />

            <PoemModal
                isOpen={isPoemModalOpen}
                onClose={handleClosePoemModal}
                poemToEdit={poemToEditFromProfile}
                user={user}
            />
        </div>
    );
};

export default Profile;