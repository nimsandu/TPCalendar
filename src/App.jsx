import React, { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AppFAB from "./Components/AppFAB";
import FloatingActionButton from "./Components/FloatingActionButton"; // Keep this import
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import your existing Loader component
import Loader from "./Components/Loader";

// Regular imports for frequently used components
import SignIn from "./Components/SignIn";
import Profile from "./Components/Profile";

// Lazy load components that aren't needed for initial render
const SignUp = lazy(() => import("./Components/SignUp"));
const ForgotPassword = lazy(() => import("./Components/ForgotPassword"));
const ChangePassword = lazy(() => import("./Components/ChangePassword"));
const EditProfile = lazy(() => import("./Components/EditProfile"));
const Backup = lazy(() => import("./Components/Backup"));

// Import your calendar stuff
import CalendarApp from "./Components/CalendarApp";
import "./index.css";
import "./Components/CalendarApp.css";

// Import background images
import janImg from "./images/jan_mob.jpeg";
import febImg from "./images/feb_mob.jpeg";
import marImg from "./images/mar_mob.jpeg";
import aprImg from "./images/apr_mob.jpeg";
import mayImg from "./images/may_mob.jpeg";
import junImg from "./images/jun_mob.jpeg";
import julImg from "./images/jul_mob.jpeg";
import augImg from "./images/aug_mob.jpeg";
import sepImg from "./images/sep_mob.jpeg";
import octImg from "./images/oct_mob.jpeg";
import novImg from "./images/nov_mob.jpeg";
import decImg from "./images/dec_mob.jpeg";

// Import a default background image
import defaultBg from "./images/bg2.gif";

const App = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [background, setBackground] = useState(defaultBg); // Set default background
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > 850);
    const [loadingBackground, setLoadingBackground] = useState(true);

    // Function to handle image loading errors
    const handleImageLoadError = () => {
        console.error("Failed to load month background image, using default.");
        setBackground(defaultBg);
        setLoadingBackground(false);
    };

    // Handle screen resizing for landscape blur
    useEffect(() => {
        const handleResize = () => {
            setIsLandscape(window.innerWidth > 850);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Update background based on selectedMonth
    useEffect(() => {
        setLoadingBackground(true);
        const backgrounds = {
            0: janImg,
            1: febImg,
            2: marImg,
            3: aprImg,
            4: mayImg,
            5: junImg,
            6: julImg,
            7: augImg,
            8: sepImg,
            9: octImg,
            10: novImg,
            11: decImg,
        };
        const selectedBg = backgrounds[selectedMonth];

        // Preload the image to handle loading and errors
        const img = new Image();
        img.onload = () => {
            setBackground(`url(${selectedBg})`);
            setLoadingBackground(false);
        };
        img.onerror = handleImageLoadError;
        img.src = selectedBg;

        // If there's no image for the month, use the default immediately
        if (!selectedBg) {
            setBackground(defaultBg);
            setLoadingBackground(false);
        }
    }, [selectedMonth]);

    return (
        <Router>
            <FloatingActionButton /> {/* Keep this for navigation */}
            <AppFAB /> {/* Keep this for update notifications */}
            <ToastContainer position="bottom-right" autoClose={5000} transition={Slide} theme="dark" />
            <Routes>
                {/* Root path ("/") -> Show calendar */}
                <Route
                    path="/"
                    element={
                        <div className="wrapper">
                            {/* Separate div for the background */}
                            <div
                                className={`background ${isLandscape ? "landscape-blur" : ""}`}
                                style={{
                                    backgroundImage: background,
                                    transition: "background-image 2s ease-in-out",
                                }}
                            ></div>

                            {/* Main app content (Calendar) */}
                            <div className="content">
                                <CalendarApp
                                    selectedMonth={selectedMonth}
                                    setSelectedMonth={setSelectedMonth}
                                />
                            </div>
                        </div>
                    }
                />

                {/* Sign In - not lazy loaded as it's frequently accessed */}
                <Route path="/signin" element={<SignIn />} />
                
                {/* Lazy loaded routes with your custom Loader component */}
                <Route path="/signup" element={
                    <Suspense fallback={<Loader />}>
                        <SignUp />
                    </Suspense>
                } />
                
                <Route path="/forgot-password" element={
                    <Suspense fallback={<Loader />}>
                        <ForgotPassword />
                    </Suspense>
                } />
                
                {/* Profile is kept as regular import as it might be frequently accessed */}
                <Route path="/profile" element={<Profile />} />
                
                <Route path="/change-password" element={
                    <Suspense fallback={<Loader />}>
                        <ChangePassword />
                    </Suspense>
                } />
                
                <Route path="/edit-profile" element={
                    <Suspense fallback={<Loader />}>
                        <EditProfile />
                    </Suspense>
                } />
                
                <Route path="/backup" element={
                    <Suspense fallback={<Loader />}>
                        <Backup />
                    </Suspense>
                } />
            </Routes>
        </Router>
    );
};

export default App;