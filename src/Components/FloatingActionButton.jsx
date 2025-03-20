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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const navigate = useNavigate();
    const location = useLocation();

    // Update current date every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Monitor window width for responsive design
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    // Format date for display
    const formatDate = () => {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const day = currentDate.getDate();
        const dayName = dayNames[currentDate.getDay()];
        const month = monthNames[currentDate.getMonth()];
        
        return {
            day,
            dayName,
            month,
            fullDate: `${dayName}, ${month} ${day}`
        };
    };

    const dateInfo = formatDate();
    const isLandscape = windowWidth > 850;

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
                    <div className="fab-date-display">
                        <span className="fab-day-name">{dateInfo.dayName}</span>
                        <span className="fab-day-number">{dateInfo.day}</span>
                        <span className="fab-month">{dateInfo.month}</span>
                    </div>
                    {isLandscape && (
                        <span className="fab-full-date">Return to Calendar</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default FloatingActionButton;