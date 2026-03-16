import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPackage, FiGrid, FiShoppingBag, FiBox, FiSettings, FiPieChart, FiZap } from 'react-icons/fi';

const Sidebar = () => {
    const location = useLocation();
    const [hasActiveAlert, setHasActiveAlert] = useState(false);

    useEffect(() => {
        const handleNewOrderEvent = (event) => {
            setHasActiveAlert(event.detail.count > 0);
        };

        window.addEventListener('new-order-update', handleNewOrderEvent);
        return () => window.removeEventListener('new-order-update', handleNewOrderEvent);
    }, []);

    const sidebarLinks = [
        { to: '/admin', icon: FiHome, label: 'Dashboard' },
        { to: '/admin/products', icon: FiPackage, label: 'Products' },
        { to: '/admin/categories', icon: FiGrid, label: 'Categories' },
        { to: '/admin/orders', icon: FiShoppingBag, label: 'Orders', badge: hasActiveAlert },
        { to: '/admin/stock', icon: FiBox, label: 'Stock Management' },
        { to: '/admin/analytics', icon: FiPieChart, label: 'Analytics' },
        { to: '/admin/ai-analytics', icon: FiZap, label: 'AI Analytics' }
    ];

    return (
        <aside className="admin-sidebar">
            <h2 className="admin-sidebar-title">
                <FiSettings style={{ marginRight: '8px' }} />
                Admin Panel
            </h2>
            <nav>
                <ul className="admin-sidebar-nav">
                    {sidebarLinks.map((link) => (
                        <li key={link.to}>
                            <Link
                                to={link.to}
                                className={`admin-sidebar-link ${location.pathname === link.to ? 'active' : ''}`}
                                style={{ position: 'relative' }}
                            >
                                <link.icon />
                                {link.label}
                                {link.badge && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '15px',
                                        width: '10px',
                                        height: '10px',
                                        backgroundColor: '#ff4757',
                                        borderRadius: '50%',
                                        border: '2px solid white',
                                        boxShadow: '0 0 10px rgba(255, 71, 87, 0.5)',
                                        animation: 'pulseBadge 1.5s infinite'
                                    }} />
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <style>{`
                @keyframes pulseBadge {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.4); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
