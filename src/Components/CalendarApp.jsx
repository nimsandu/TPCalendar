import { useState, useEffect } from "react";
import TodaysOverview from "./TodaysOverview";

const CalendarApp = ({ selectedMonth, setSelectedMonth }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeApp, setActiveApp] = useState("today"); // Default to Today's Overview

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthsOfYear = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, selectedMonth, 1).getDay();
  const today = new Date();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    setCurrentYear((prevYear) => {
      const newDaysInMonth = new Date(prevYear, selectedMonth + 1, 0).getDate();
      const newFirstDayOfMonth = new Date(prevYear, selectedMonth, 1).getDay();
      return prevYear;
    });
  }, [selectedMonth]);

  const toggleApp = () => {
    setActiveApp((prevView) => {
      if (prevView === "calendar") {
        setSelectedMonth(new Date().getMonth());
        setCurrentYear(new Date().getFullYear());
        return "today";
      } else {
        return "calendar";
      }
    });
  };

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((prevYear) => currentYear - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((prevYear) => currentYear + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <div className={`wrapper ${activeApp === "calendar" ? "show-calendar" : "show-today"}`}>
      <div className="calendar-app">
        <div className="buttmonth">
          <div className="calendar">
            <h1 className="heading">{monthsOfYear[selectedMonth]}</h1>
            <h2 className="year">{currentYear}</h2>
            <div className="navigate-date">
              <div className="buttons">
                <i className="bx bx-chevron-left" onClick={handlePrevMonth}></i>
                <i className="bx bx-chevron-right" onClick={handleNextMonth}></i>
              </div>
            </div>
          </div>

          <div className="weekdays">
            {daysOfWeek.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="days">
            {[...Array(firstDayOfMonth).keys()].map((_, index) => (
              <span key={`empty-${index}`} />
            ))}

            {[...Array(daysInMonth).keys()].map((day) => {
              const currentDate = new Date(currentYear, selectedMonth, day + 1);
              const isToday =
                currentDate.getDate() === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              return (
                <span key={day + 1} className={isToday ? "current-date" : ""}>
                  {day + 1}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="today-app">
        <TodaysOverview />
      </div>

      <div className="fab" onClick={toggleApp}>
      ⇆
      </div>
    </div>
  );
};

export default CalendarApp;
