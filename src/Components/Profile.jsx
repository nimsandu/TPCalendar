import React, { useEffect, useState } from "react";
import { auth, db } from "../auth/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import SignOut from "./SignOut";
import Poems from "./Poems";
import { Link } from "react-router-dom";
import defaultAvatar from "../images/avatar.png";
import "./Profile.css";
import Loader from "./Loader";


import App from "../App";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ firstName: "", lastName: "", avatar: "" });
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [loading, setLoading] = useState(true);

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
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

    const exportPoems = async () => {
        if (user) {
            try {
                const poemsCollection = collection(db, "poems");
                const poemsQuery = query(poemsCollection, where("userId", "==", user.uid)); // Filter by userId
                const poemsSnapshot = await getDocs(poemsQuery);
    
                if (poemsSnapshot.empty) {
                    console.warn("No poems found for this user.");
                    return;
                }
    
                const poemsData = poemsSnapshot.docs.map((doc) => doc.data());
    
                const jsonData = JSON.stringify(poemsData, null, 2);
                const blob = new Blob([jsonData], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "poems_backup.json";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Error exporting poems:", error);
            }
        }
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
                    
                    <button className="add-new-btn" onClick={() => document.querySelector('.add-button').click()}>
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
                            <p className="menu-email">{user.email}</p>
                        </div>

                        <div className="menu-actions">
                            <Link to="/change-password" className="menu-item">
                                Change Password
                            </Link>
                            <Link to="/edit-profile" className="menu-item">
                                Edit Profile
                            </Link>
                            <button className="backup-btn" onClick={exportPoems}>
                        Export Backup
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
                    {userData.firstName
                        ? `Hi, ${userData.firstName}!`
                        : "Welcome to your profile!"}
                </h2>
            </div>

            <Poems /> 
        </div>
    );
};

export default Profile;