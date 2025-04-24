'use client'; // Add this directive for useState

import React, { useState } from 'react';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa'; // Import FaGithub

// Removed the old GitHubIcon component

const Footer = () => {
  const [isDonatePopupOpen, setIsDonatePopupOpen] = useState(false);

  const toggleDonatePopup = () => {
    setIsDonatePopupOpen(!isDonatePopupOpen);
  };

  // Placeholder addresses - replace with actual addresses
  const bitcoinAddress = 'bc1qhgxzqfq95h4gt5ncvrn6zglll6qjm8q0zu6hsv';
  const moneroAddress = '88khJ7br739Y1Bkz8CNY9CGRbTVD7Cy1Dbwa9qo7RbZAhbyrTQT3uLmhBcWqMVGHTD6Mv4jFcZtvCRau5sj5vQXTHUsUyMk';

  return (
    // Updated footer styles for dark theme
    <footer className="bg-gray-900 text-gray-400 p-4 mt-auto text-center text-sm border-t border-gray-700"> {/* Dark background, lighter text, top border */}
      <div className="container mx-auto flex justify-between items-center">
        <span>created by me</span>
        <div className="flex items-center space-x-4">
          {/* Updated link hover color and use FaGithub */}
          <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-200">
            <FaGithub className="h-5 w-5" /> {/* Use FaGithub icon */}
          </Link>
          {/* Updated button styles */}
          <button onClick={toggleDonatePopup} className="text-gray-400 hover:text-gray-200 underline">
            Donate
          </button>
        </div>
      </div>

      {/* Donate Popup Overlay - Updated for dark theme */}
      {isDonatePopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={toggleDonatePopup}> {/* Darker overlay */}
          {/* Popup styles updated for dark theme */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl relative max-w-sm w-full text-gray-200 border border-gray-700" onClick={(e) => e.stopPropagation()}> {/* Dark background, lighter text, border */}
            <button
              onClick={toggleDonatePopup}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-300 text-3xl leading-none" // Adjusted position and size
              aria-label="Close donate popup"
            >
              &times; {/* Close button */}
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-100">Donate</h3> {/* Lighter heading */}
            <div className="space-y-4 text-left"> {/* Increased spacing */}
              <div>
                <p className="font-medium text-gray-300">Bitcoin (BTC):</p> {/* Lighter label */}
                {/* Darker code block */}
                <p className="text-xs break-all bg-gray-700 p-2 rounded mt-1 text-gray-300">{bitcoinAddress}</p>
                {/* Add QR Code component if desired */}
              </div>
              <div>
                <p className="font-medium text-gray-300">Monero (XMR):</p> {/* Lighter label */}
                {/* Darker code block */}
                <p className="text-xs break-all bg-gray-700 p-2 rounded mt-1 text-gray-300">{moneroAddress}</p>
                {/* Add QR Code component if desired */}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
