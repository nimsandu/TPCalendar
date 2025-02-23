import React, { useEffect, useState } from "react";
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

const App = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [background, setBackground] = useState("");
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > 850);

    useEffect(() => {
        const handleResize = () => {
            setIsLandscape(window.innerWidth > 850);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const backgrounds = {
            0: `url(${janImg})`,
            1: `url(${febImg})`,
            2: `url(${marImg})`,
            3: `url(${aprImg})`,
            4: `url(${mayImg})`,
            5: `url(${junImg})`,
            6: `url(${julImg})`,
            7: `url(${augImg})`,
            8: `url(${sepImg})`,
            9: `url(${octImg})`,
            10: `url(${novImg})`,
            11: `url(${decImg})`,
        };

        setBackground(backgrounds[selectedMonth]);
    }, [selectedMonth]);

    return (
        <div className="wrapper">
            {/* Separate div for the background */}
            <div 
  className={`background ${isLandscape ? 'landscape-blur' : ''}`} 
  style={{ 
    backgroundImage: background, 
    transition: 'background-image 2s ease-in-out' // Add transition property
  }}
></div>

            {/* The main app content */}
            <div className="content">
                <CalendarApp selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
            </div>
        </div>
    );
};

export default App;
