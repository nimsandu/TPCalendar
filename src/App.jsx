import React, { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Lazy load components for better performance
const SignIn = lazy(() => import("./Components/SignIn"));
const SignUp = lazy(() => import("./Components/SignUp"));
const Profile = lazy(() => import("./Components/Profile"));
const ForgotPassword = lazy(() => import("./Components/ForgotPassword"));
const ChangePassword = lazy(() => import("./Components/ChangePassword"));
const EditProfile = lazy(() => import("./Components/EditProfile"));
const CalendarApp = lazy(() => import("./Components/CalendarApp"));
const FloatingActionButton = lazy(() => import("./Components/FloatingActionButton"));

import "./index.css";
import "./Components/CalendarApp.css";

// Background images (store in /public/images/ instead of importing in JS)
const backgrounds = {
  0: "/images/jan_mob.jpeg",
  1: "/images/feb_mob.jpeg",
  2: "/images/mar_mob.jpeg",
  3: "/images/apr_mob.jpeg",
  4: "/images/may_mob.jpeg",
  5: "/images/jun_mob.jpeg",
  6: "/images/jul_mob.jpeg",
  7: "/images/aug_mob.jpeg",
  8: "/images/sep_mob.jpeg",
  9: "/images/oct_mob.jpeg",
  10: "/images/nov_mob.jpeg",
  11: "/images/dec_mob.jpeg",
};

const App = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [background, setBackground] = useState("");
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > 850);

  // Handle screen resizing
  useEffect(() => {
    const handleResize = () => setIsLandscape(window.innerWidth > 850);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update background based on selectedMonth
  useEffect(() => {
    setBackground(`url(${backgrounds[selectedMonth]})`);
  }, [selectedMonth]);

  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <FloatingActionButton />
        <Routes>
          <Route
            path="/"
            element={
              <div className="wrapper">
                <div
                  className={`background ${isLandscape ? "landscape-blur" : ""}`}
                  style={{
                    backgroundImage: background,
                    transition: "background-image 2s ease-in-out",
                  }}
                ></div>
                <div className="content">
                  <CalendarApp selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
                </div>
              </div>
            }
          />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
