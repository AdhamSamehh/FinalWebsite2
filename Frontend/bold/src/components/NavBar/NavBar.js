import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';

const NavBar = () => {
    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to="/">Bold Shop</Link>
            </div>
            <div className="nav-links">
                <Link to="/" className="nav-link">Home</Link>
            </div>
        </nav>
    );
};

export default NavBar;