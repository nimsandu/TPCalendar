import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../auth/firebaseConfig";
import defaultAvatar from "../images/avatar.png";
import "./FloatingActionButton.css";

const FloatingActionButton = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ firstName: "", lastName: "", avatar: "" });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setUserData(userSnap.data());
                    } else {
                        console.log("No user data found in Firestore.");
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setUser(null);
                setUserData({ firstName: "", lastName: "", avatar: "" });
            }
        });
        return () => unsubscribe();
    }, []);

    const handleClick = () => {
        if (location.pathname === "/signin") {
            navigate("/"); // Navigate to the app root from the sign-in page
        } else if (user) {
            if (location.pathname === "/") {
                navigate("/profile");
            } else {
                navigate("/");
            }
        } else {
            navigate("/signin");
        }
    };

    return (
        <div className="fab-container" onClick={handleClick}>
            {location.pathname === "/" ? (
                user ? (
                    <div className="fab-logged-in">
                        <img
                            src={userData.avatar || defaultAvatar}
                            alt="User Avatar"
                            className="fab-avatar"
                        />
                        <span className="fab-text">
                            {userData.firstName && userData.lastName
                                ? `${userData.firstName}'s Vault`
                                : "Vault"}
                        </span>
                    </div>
                ) : (
                    <div className="fab-logged-out">
                        <span className="fab-text">Sign In</span>
                    </div>
                )
            ) : (
                <div className="fab-calendar">
                    <span className="fab-calendar-icon" role="img" aria-label="calendar">📅</span>
                </div>
            )}
        </div>
    );
};

export default FloatingActionButton;