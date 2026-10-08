import React from 'react';
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <p>© {currentYear} Harshu Chaudhary. All rights reserved.</p>
      </div>
    </footer>
  );
};
