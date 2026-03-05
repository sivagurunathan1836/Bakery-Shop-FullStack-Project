import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPackage, FiGrid, FiShoppingBag, FiSettings, FiBox, FiTrendingUp, FiDollarSign, FiUsers, FiClock, FiAlertTriangle, FiArrowRight, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { productsAPI, categoriesAPI, ordersAPI } from '../../services/api';

const AdminDashboard = () => {
    const location = useLocation();
    const [stats, setStats] = useState({
        products: 0,
        categories: 0,
        orders: 0,
        lowStock: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [productsRes, categoriesRes, ordersRes] = await Promise.all([
                    productsAPI.getAll({ limit: 100 }),
                    categoriesAPI.getAll(),
                    ordersAPI.getAllAdmin({ limit: 10 })
                ]);

                const products = productsRes.data.products || [];
                const orders = ordersRes.data.orders || [];
                const lowStockCount = products.filter(p => p.stock < 5).length;

                // Calculate order statistics
                const pendingOrders = orders.filter(o => o.status === 'pending').length;
                const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
                const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

                // Calculate total revenue from delivered orders
                const totalRevenue = orders
                    .filter(o => o.status === 'delivered')
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

                // Get top products (featured or first 5)
                const featured = products.filter(p => p.isFeatured).slice(0, 5);
                setTopProducts(featured.length > 0 ? featured : products.slice(0, 5));

                setStats({
                    products: productsRes.data.total || products.length,
                    categories: categoriesRes.data?.length || 0,
                    orders: ordersRes.data.total || 0,
                    lowStock: lowStockCount,
                    totalRevenue,
                    pendingOrders,
                    deliveredOrders,
                    cancelledOrders
                });

                setRecentOrders(orders.slice(0, 5));
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getStatusClass = (status) => {
        const classes = {
            pending: 'status-pending',
            confirmed: 'status-confirmed',
            preparing: 'status-preparing',
            delivered: 'status-delivered',
            cancelled: 'status-cancelled'
        };
        return classes[status] || 'status-pending';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: <FiClock />,
            confirmed: <FiCheckCircle />,
            preparing: <FiRefreshCw />,
            delivered: <FiCheckCircle />,
            cancelled: <FiXCircle />
        };
        return icons[status] || <FiClock />;
    };

    const sidebarLinks = [
        { to: '/admin', icon: FiHome, label: 'Dashboard' },
        { to: '/admin/products', icon: FiPackage, label: 'Products' },
        { to: '/admin/categories', icon: FiGrid, label: 'Categories' },
        { to: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
        { to: '/admin/stock', icon: FiBox, label: 'Stock Management' }
    ];

    const quickActions = [
        { to: '/admin/products', icon: FiPackage, label: 'Add Product', color: '#2e7d32' },
        { to: '/admin/categories', icon: FiGrid, label: 'Add Category', color: '#1565c0' },
        { to: '/admin/orders', icon: FiShoppingBag, label: 'View Orders', color: '#c2185b' },
        { to: '/admin/stock', icon: FiBox, label: 'Manage Stock', color: '#ef6c00' }
    ];

    return (
        <div className="admin-layout">
            {/* Sidebar */}
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
                                >
                                    <link.icon />
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="admin-content">
                {/* Dashboard Header */}
                <div className="dashboard-header">
                    <div className="dashboard-header-content">
                        <div className="dashboard-greeting">
                            <h1 className="dashboard-title">{formatGreeting()}, Admin! 👋</h1>
                            <p className="dashboard-subtitle">
                                Here's what's happening with your bakery today.
                            </p>
                        </div>
                        <div className="dashboard-header-actions">
                            <span className="dashboard-date">
                                {currentTime.toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            <Link to="/" className="btn btn-secondary btn-sm">
                                <FiArrowRight /> Visit Store
                            </Link>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="dashboard-stats-grid">
                            <div className="dashboard-stat-card stat-products">
                                <div className="stat-icon-wrapper">
                                    <FiPackage />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{stats.products}</span>
                                    <span className="stat-label">Total Products</span>
                                </div>
                                <div className="stat-trend positive">
                                    <FiTrendingUp /> Active
                                </div>
                            </div>

                            <div className="dashboard-stat-card stat-orders">
                                <div className="stat-icon-wrapper">
                                    <FiShoppingBag />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{stats.orders}</span>
                                    <span className="stat-label">Total Orders</span>
                                </div>
                                <div className="stat-trend positive">
                                    <FiTrendingUp /> All Time
                                </div>
                            </div>

                            <div className="dashboard-stat-card stat-revenue">
                                <div className="stat-icon-wrapper">
                                    <FiDollarSign />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
                                    <span className="stat-label">Revenue (Delivered)</span>
                                </div>
                                <div className="stat-trend positive">
                                    <FiTrendingUp /> Earned
                                </div>
                            </div>

                            <div className="dashboard-stat-card stat-categories">
                                <div className="stat-icon-wrapper">
                                    <FiGrid />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{stats.categories}</span>
                                    <span className="stat-label">Categories</span>
                                </div>
                                <div className="stat-trend neutral">
                                    <FiUsers /> Types
                                </div>
                            </div>
                        </div>

                        {/* Order Status Overview & Low Stock Alert */}
                        <div className="dashboard-row">
                            <div className="dashboard-card order-status-card">
                                <div className="card-header">
                                    <h3><FiShoppingBag /> Order Status Overview</h3>
                                </div>
                                <div className="order-status-grid">
                                    <div className="order-status-item pending">
                                        <div className="status-icon"><FiClock /></div>
                                        <div className="status-count">{stats.pendingOrders}</div>
                                        <div className="status-name">Pending</div>
                                    </div>
                                    <div className="order-status-item delivered">
                                        <div className="status-icon"><FiCheckCircle /></div>
                                        <div className="status-count">{stats.deliveredOrders}</div>
                                        <div className="status-name">Delivered</div>
                                    </div>
                                    <div className="order-status-item cancelled">
                                        <div className="status-icon"><FiXCircle /></div>
                                        <div className="status-count">{stats.cancelledOrders}</div>
                                        <div className="status-name">Cancelled</div>
                                    </div>
                                </div>
                            </div>

                            <div className={`dashboard-card stock-alert-card ${stats.lowStock > 0 ? 'has-alert' : 'no-alert'}`}>
                                <div className="card-header">
                                    <h3><FiAlertTriangle /> Stock Alert</h3>
                                </div>
                                <div className="stock-alert-content">
                                    <div className="stock-alert-icon">
                                        {stats.lowStock > 0 ? <FiAlertTriangle /> : <FiCheckCircle />}
                                    </div>
                                    <div className="stock-alert-info">
                                        <span className="stock-alert-count">{stats.lowStock}</span>
                                        <span className="stock-alert-text">
                                            {stats.lowStock > 0
                                                ? 'Products with low stock (< 5 units)'
                                                : 'All products are well stocked!'}
                                        </span>
                                    </div>
                                    {stats.lowStock > 0 && (
                                        <Link to="/admin/stock" className="btn btn-sm btn-danger">
                                            Manage Stock
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="dashboard-card quick-actions-card">
                            <div className="card-header">
                                <h3><FiSettings /> Quick Actions</h3>
                            </div>
                            <div className="quick-actions-grid">
                                {quickActions.map((action, index) => (
                                    <Link
                                        key={index}
                                        to={action.to}
                                        className="quick-action-item"
                                        style={{ '--action-color': action.color }}
                                    >
                                        <div className="quick-action-icon">
                                            <action.icon />
                                        </div>
                                        <span>{action.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="dashboard-main-grid">
                            {/* Recent Orders */}
                            <div className="dashboard-card recent-orders-card">
                                <div className="card-header">
                                    <h3><FiShoppingBag /> Recent Orders</h3>
                                    <Link to="/admin/orders" className="btn btn-secondary btn-sm">
                                        View All <FiArrowRight />
                                    </Link>
                                </div>
                                <div className="orders-list">
                                    {recentOrders.length === 0 ? (
                                        <div className="empty-state-mini">
                                            <FiShoppingBag />
                                            <p>No orders yet</p>
                                        </div>
                                    ) : (
                                        recentOrders.map((order) => (
                                            <div key={order._id} className="order-item">
                                                <div className="order-item-left">
                                                    <div className="order-icon">
                                                        {getStatusIcon(order.status)}
                                                    </div>
                                                    <div className="order-details">
                                                        <span className="order-number">#{order.orderNumber}</span>
                                                        <span className="order-customer">{order.user?.name || 'Guest'}</span>
                                                    </div>
                                                </div>
                                                <div className="order-item-right">
                                                    <span className="order-amount">₹{order.totalAmount?.toFixed(2)}</span>
                                                    <span className={`order-status-badge ${getStatusClass(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="dashboard-card top-products-card">
                                <div className="card-header">
                                    <h3><FiPackage /> Featured Products</h3>
                                    <Link to="/admin/products" className="btn btn-secondary btn-sm">
                                        Manage <FiArrowRight />
                                    </Link>
                                </div>
                                <div className="products-list">
                                    {topProducts.length === 0 ? (
                                        <div className="empty-state-mini">
                                            <FiPackage />
                                            <p>No products yet</p>
                                        </div>
                                    ) : (
                                        topProducts.map((product) => (
                                            <div key={product._id} className="product-item">
                                                <img
                                                    src={product.image ? (product.image.startsWith('http') ? product.image : `http://localhost:5000${product.image}`) : `https://placehold.co/50x50/f5e6d3/5c4033?text=${product.name[0]}`}
                                                    alt={product.name}
                                                    className="product-thumbnail"
                                                    onError={(e) => {
                                                        e.target.src = `https://placehold.co/50x50/f5e6d3/5c4033?text=${product.name[0]}`;
                                                    }}
                                                />
                                                <div className="product-details">
                                                    <span className="product-name">{product.name}</span>
                                                    <span className="product-category">{product.category?.name || 'Uncategorized'}</span>
                                                </div>
                                                <div className="product-meta">
                                                    <span className="product-price">₹{product.price}</span>
                                                    <span className={`product-stock ${product.stock < 5 ? 'low' : 'good'}`}>
                                                        {product.stock} in stock
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
