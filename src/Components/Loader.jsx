import React from 'react';
import './Loader.css'; // Create Loader.css

const Loader = () => {
  return (
    <div className="loader-overlay">
      <div className="loader"></div>
    </div>
  );
};

export default Loader;