import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TodaysOverview.css";

// 1️⃣ Import your monthly portrait images
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
  // 2️⃣ Map each month index to the imported portrait image
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
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  // 3️⃣ States for background & month name
  const [cardBg, setCardBg] = useState("");
  const [monthName, setMonthName] = useState("");

  // 4️⃣ State for random quote from Quotable
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  // 5️⃣ Current date/time
  const today = new Date();
  const realMonth = today.getMonth();
  const dayName = today.toLocaleString("en-US", { weekday: "long" });
  const dateNum = today.getDate();
  const yearNum = today.getFullYear();

  // 6️⃣ On mount, set the background & month name
  useEffect(() => {
    setCardBg(monthImages[realMonth]);
    setMonthName(monthsOfYear[realMonth]);
  }, [realMonth, monthImages]);

  // 7️⃣ Fetch a random quote from Quotable
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await axios.get("http://api.quotable.io/random");
        setQuote(res.data); // { content: "...", author: "..." }
      } catch (err) {
        console.error(err);
        setQuoteError("Failed to fetch quote. Please try again later.");
      }
    };
    fetchQuote();
  }, []);

  // 8️⃣ Render logic
  if (quoteError) {
    return (
      <div className="today-portrait-card" style={{ backgroundImage: cardBg }}>
        <p className="error-msg">{quoteError}</p>
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
      {/*<h2 className="month-banner">{monthName}</h2>*/}

      {/* Date info in the middle */}
      <div className="date-info">
        <h1 className="big-date">{dateNum}</h1>
        <div className="dayt">
        <p>{dayName}</p>
        <p className="yeart">{yearNum}</p>
        </div>

      </div>

      {/* Quote section at the bottom */}
      <div className="quote-section">
        {quote ? (
          <>
            <p className="quote-text">“{quote.content}”</p>
            <p className="quote-author"> {quote.author}</p>
          </>
        ) : (
          <p>Loading quote...</p>
        )}
      </div>
    </div>
  );
};

export default TodaysOverview;
