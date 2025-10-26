import React from 'react';
import './Loader.css';

const Loader = ({ 
  size = 'medium', 
  variant = 'primary',
  text = '',
  overlay = false 
}) => {
  const LoaderComponent = (
    <div className={`loader-container loader-${size}`}>
      <div className={`spinner spinner-${variant}`}>
        <div className="spinner-inner"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loader-overlay">
        {LoaderComponent}
      </div>
    );
  }

  return LoaderComponent;
};

export default Loader;


