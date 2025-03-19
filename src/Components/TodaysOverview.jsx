import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TodaysOverview.css";

// Import your monthly portrait images
import janImg from "../images/jan_mob.jpeg";
import febImg from "../images/feb_mob.jpeg";
import marImg from "../images/mar_mob.jpeg";
import aprImg from "../images/apr_mob.jpeg";
import mayImg from "../images/may_mob.jpeg";
import junImg from "../images/jun_mob.jpeg";
import julImg from "../images/jul_mob.jpeg";
import augImg from "../images/aug_mob.jpeg";
import sepImg from "../images/sep_mob.jpeg";
import octImg from "../images/oct_mob.jpeg";
import novImg from "../images/nov_mob.jpeg";
import decImg from "../images/dec_mob.jpeg";

const TodaysOverview = () => {
  // Map each month index to the imported portrait image
  const monthImages = {
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

  const monthsOfYear = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // States for background & month name
  const [cardBg, setCardBg] = useState("");
  const [monthName, setMonthName] = useState("");

  // State for random advice from adviceslip.com
  const [advice, setAdvice] = useState(null);
  const [adviceError, setAdviceError] = useState(null);

  // Current date/time
  const today = new Date();
  const realMonth = today.getMonth();
  const dayName = today.toLocaleString("en-US", { weekday: "long" });
  const dateNum = today.getDate();
  const yearNum = today.getFullYear();

  // On mount, set the background & month name
  useEffect(() => {
    setCardBg(monthImages[realMonth]);
    setMonthName(monthsOfYear[realMonth]);
  }, [realMonth, monthImages]);

  // Fetch a random advice from adviceslip.com
  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const res = await axios.get("https://api.adviceslip.com/advice");
        setAdvice(res.data.slip.advice);
      } catch (err) {
        console.error(err);
        setAdviceError("Failed to fetch advice. Please try again later.");
      }
    };
    fetchAdvice();
  }, []);

  // Render logic
  if (adviceError) {
    return (
      <div className="today-portrait-card" style={{ backgroundImage: cardBg }}>
        <p className="error-msg">{adviceError}</p>
      </div>
    );
  }

  return (
    <div
      className="today-portrait-card"
      style={{
        backgroundImage: cardBg,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Month banner at the top */}
      <div className="top-section">
        {/* You can add month name here if desired */}
      </div>

      {/* Date info in the middle */}
      <div className="date-info">
        <h1 className="big-date">{dateNum}</h1>
        <div className="dayt">
          <p>{dayName}</p>
          <p className="yeart">{yearNum}</p>
        </div>
      </div>

      {/* Advice section at the bottom */}
      <div className="quote-section">
        {advice ? (
          <p className="quote-text">"{advice}"</p>
        ) : (
          <p>Loading advice...</p>
        )}
      </div>
    </div>
  );
};

export default TodaysOverview;