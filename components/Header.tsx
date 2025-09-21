import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Header: React.FC = () => {
  const activeLinkStyle: React.CSSProperties = {
    color: 'white',
    textDecoration: 'underline',
  };

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm text-gray-300 py-4 mb-12 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/_/dashboard" className="text-2xl font-bold text-white">
          AI Site Builder
        </Link>
        <nav className="space-x-6">
          <NavLink 
            to="/_/dashboard" 
            className="hover:text-white transition-colors"
            style={({ isActive }) => isActive ? activeLinkStyle : undefined}
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/_/create" 
            className="hover:text-white transition-colors"
            style={({ isActive }) => isActive ? activeLinkStyle : undefined}
          >
            Create App
          </NavLink>
          <NavLink 
            to="/_/settings" 
            className="hover:text-white transition-colors"
            style={({ isActive }) => isActive ? activeLinkStyle : undefined}
          >
            Settings
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Header;
