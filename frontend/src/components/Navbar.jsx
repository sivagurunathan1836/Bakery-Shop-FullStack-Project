import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiLogOut, FiPackage, FiSettings, FiChevronDown, FiCamera } from 'react-icons/fi';
import { GiCupcake } from 'react-icons/gi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
    const { user, logout, isAdmin, isAuthenticated } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    /*
        useEffect(() => {
            const fetchCartCount = async () => {
                if (isAuthenticated) {
                    try {
                        const response = await cartAPI.get();
                        setCartCount(response.data.totalItems || 0);
                    } catch (error) {
                        console.error('Error fetching cart count:', error);
                    }
                }
            };
    
            fetchCartCount();
        }, [isAuthenticated, location.pathname]);
    */

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <GiCupcake className="navbar-logo-icon" />
                    <span>Sri Ganesha Bakery</span>
                </Link>

                <div className="navbar-links">
                    <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
                        Home
                    </Link>
                    <Link to="/products" className={`navbar-link ${isActive('/products') ? 'active' : ''}`}>
                        Products
                    </Link>
                    <Link to="/categories" className={`navbar-link ${isActive('/categories') ? 'active' : ''}`}>
                        Categories
                    </Link>
                </div>

                <div className="navbar-actions">


                    {isAuthenticated && (
                        <Link to="/cart" className="navbar-cart">
                            <FiShoppingCart className="navbar-cart-icon" />
                            {cartCount > 0 && (
                                <span className="navbar-cart-badge">{cartCount}</span>
                            )}
                        </Link>
                    )}

                    {isAuthenticated ? (
                        <div className="navbar-user-dropdown" ref={dropdownRef}>
                            <button
                                className="navbar-user-btn"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <FiUser />
                                <span>{user?.name?.split(' ')[0]}</span>
                                <FiChevronDown />
                            </button>

                            <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                                <Link
                                    to="/orders"
                                    className="dropdown-item"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <FiPackage /> My Orders
                                </Link>
                                {isAdmin() && (
                                    <>
                                        <div className="dropdown-divider" />
                                        <Link
                                            to="/admin"
                                            className="dropdown-item"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <FiSettings /> Admin Panel
                                        </Link>
                                    </>
                                )}
                                <div className="dropdown-divider" />
                                <button className="dropdown-item" onClick={handleLogout}>
                                    <FiLogOut /> Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
