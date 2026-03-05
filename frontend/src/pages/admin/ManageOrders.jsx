import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPackage, FiGrid, FiShoppingBag, FiBox, FiSettings } from 'react-icons/fi';
import { ordersAPI } from '../../services/api';
import toast from 'react-hot-toast';

// CSS for new order animation - HIGH VISIBILITY MODE
const newOrderStyles = `
    @keyframes intenseFlash {
        0%, 100% { 
            background-color: #ffebee; 
            box-shadow: inset 0 0 0 2px #ff1744;
        }
        50% { 
            background-color: #fff9c4; 
            box-shadow: inset 0 0 20px 2px #ffeb3b;
        }
    }
    
    @keyframes shakeRow {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    @keyframes popIn {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .new-order-row {
        animation: intenseFlash 1s infinite, shakeRow 0.8s ease-in-out 1;
        border-left: 8px solid #ff0000 !important;
        font-weight: bold;
        position: relative;
        z-index: 10;
    }
    
    .new-order-row td {
        color: #d50000 !important;
        background: transparent !important; /* Let row background show */
    }

    .new-order-badge {
        position: absolute;
        top: -10px;
        right: 10px;
        background-color: #ff0000;
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        font-weight: 900;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        z-index: 20;
        border: 2px solid white;
    }

    /* COMPACT MODE STYLES */
    .admin-table th, .admin-table td {
        padding: 8px 10px !important;
        font-size: 0.85rem !important;
        vertical-align: middle !important;
    }
    
    .admin-table th {
        font-size: 0.8rem !important;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background-color: #f8f9fa;
        color: #555;
    }

    .admin-content {
        padding: 20px !important;
        max-width: 100%;
    }

    .admin-header {
        margin-bottom: 15px !important;
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = newOrderStyles;
    if (!document.head.querySelector('[data-new-order-styles]')) {
        styleSheet.setAttribute('data-new-order-styles', 'true');
        document.head.appendChild(styleSheet);
    }
}

const ManageOrders = () => {
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [countdown, setCountdown] = useState(180); // 3 minutes in seconds
    const [newOrderIds, setNewOrderIds] = useState([]); // Track new orders for blinking effect
    const [previousOrderIds, setPreviousOrderIds] = useState([]); // Track previous order IDs

    // Use ref to access current orders in interval without resetting it
    const ordersRef = useRef(orders);

    // Update ref whenever orders changes
    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);

    const fetchOrders = async () => {
        try {
            const params = statusFilter ? { status: statusFilter } : {};
            const response = await ordersAPI.getAllAdmin(params);
            setOrders(response.data.orders || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    // Play sound notification
    const playNotificationSound = () => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/933/933-preview.mp3');
            audio.play().catch(e => console.log('Audio play failed', e));
        } catch (error) {
            console.error('Audio setup failed', error);
        }
    };

    // Detect new orders and trigger blinking effect
    useEffect(() => {
        if (orders.length > 0 && previousOrderIds.length > 0) {
            const currentOrderIds = orders.map(order => order._id);
            const newIds = currentOrderIds.filter(id => !previousOrderIds.includes(id));

            if (newIds.length > 0) {
                // Play notification sound
                playNotificationSound();

                // Show bright red alert toast
                toast.custom((t) => (
                    <div style={{
                        padding: '16px 24px',
                        background: '#d50000',
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        boxShadow: '0 8px 20px rgba(213, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: '2px solid white',
                        animation: t.visible ? 'pulse 1s infinite' : 'none'
                    }}>
                        <span style={{ fontSize: '24px' }}>🔔</span>
                        <div>
                            <div style={{ fontSize: '1.1rem', textTransform: 'uppercase' }}>New Order Detected!</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Check the orders list immediately.</div>
                        </div>
                    </div>
                ), { duration: 6000 });

                setNewOrderIds(prev => [...prev, ...newIds]);

                // Remove blinking effect after 30 seconds
                setTimeout(() => {
                    const idsToRemove = newIds;
                    setNewOrderIds(prev => prev.filter(id => !idsToRemove.includes(id)));
                }, 30000);
            }
        }

        // Update previous order IDs
        setPreviousOrderIds(orders.map(order => order._id));
    }, [orders]);

    // Poll for new orders every 5 seconds
    useEffect(() => {
        const pollInterval = setInterval(() => {
            fetchOrders();
        }, 5000); // Check for new orders every 5 seconds

        return () => clearInterval(pollInterval);
    }, [statusFilter]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await ordersAPI.updateStatus(orderId, newStatus);
            toast.success('Order status updated');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Auto-progress order statuses every 3 minutes
    const autoProgressStatuses = async () => {
        const orderList = ordersRef.current;
        const statusProgression = {
            'pending': 'confirmed',
            'confirmed': 'preparing',
            'preparing': 'out_for_delivery',
            'out_for_delivery': 'delivered'
        };

        for (const order of orderList) {
            const nextStatus = statusProgression[order.status];

            // Only auto-progress if order is not delivered or cancelled
            if (nextStatus && order.status !== 'delivered' && order.status !== 'cancelled') {
                try {
                    await ordersAPI.updateStatus(order._id, nextStatus);
                    console.log(`Auto-progressed order ${order.orderNumber} from ${order.status} to ${nextStatus}`);
                } catch (error) {
                    console.error(`Failed to auto-progress order ${order.orderNumber}:`, error);
                }
            }
        }

        // Refresh orders after auto-progression
        fetchOrders();
    };

    // Set up auto-progression interval (every 3 minutes = 180000ms)
    useEffect(() => {
        // Countdown timer (updates every second)
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    return 180; // Reset to 3 minutes
                }
                return prev - 1;
            });
        }, 1000);

        // Auto-progression timer (every 3 minutes)
        const progressInterval = setInterval(() => {
            if (ordersRef.current.length > 0) {
                autoProgressStatuses();
                toast.success('Order statuses auto-updated', { duration: 2000 });
                setCountdown(180); // Reset countdown
            }
        }, 180000); // 3 minutes

        return () => {
            clearInterval(countdownInterval);
            clearInterval(progressInterval);
        };
    }, []);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusClass = (status) => {
        const classes = {
            pending: 'status-pending',
            confirmed: 'status-confirmed',
            preparing: 'status-preparing',
            out_for_delivery: 'status-confirmed',
            delivered: 'status-delivered',
            cancelled: 'status-cancelled'
        };
        return classes[status] || 'status-pending';
    };

    const sidebarLinks = [
        { to: '/admin', icon: FiHome, label: 'Dashboard' },
        { to: '/admin/products', icon: FiPackage, label: 'Products' },
        { to: '/admin/categories', icon: FiGrid, label: 'Categories' },
        { to: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
        { to: '/admin/stock', icon: FiBox, label: 'Stock Management' }
    ];

    return (
        <div className="admin-layout">
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

            <main className="admin-content">
                {/* Persistent New Order Alert Banner */}
                {newOrderIds.length > 0 && (
                    <div style={{
                        background: '#d50000',
                        color: 'white',
                        padding: '10px 15px',
                        marginBottom: '15px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        animation: 'pulse 1s infinite',
                        boxShadow: '0 2px 8px rgba(213, 0, 0, 0.4)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🚨</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>NEW ORDERS!</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                                    {newOrderIds.length} new order(s) require attention.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNewOrderIds([])}
                            style={{
                                background: 'white',
                                color: '#d50000',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                <div className="admin-header">
                    <h1 className="admin-title">Manage Orders</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Auto-update countdown */}
                        <div style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                        }}>
                            <span>🔄 Auto-update in:</span>
                            <span style={{
                                fontSize: '1rem',
                                fontFamily: 'monospace',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                            }}>
                                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                            </span>
                        </div>

                        <select
                            className="form-input form-select"
                            style={{ width: '200px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Orders</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Info banner about auto-progression */}
                <div style={{
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    border: '1px solid #bbdefb',
                    fontSize: '0.8rem',
                    color: '#1565c0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <strong>ℹ️ Auto-Progression:</strong>
                    <span>Every 3 mins: Pending → Confirmed → Preparing → Out for Delivery → Delivered</span>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <FiShoppingBag className="empty-state-icon" />
                        <h3 className="empty-state-title">No orders found</h3>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Customer</th>
                                <th>Address</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr
                                    key={order._id}
                                    className={newOrderIds.includes(order._id) ? 'new-order-row' : ''}
                                >
                                    <td style={{ fontWeight: '500', position: 'relative' }}>
                                        {order.orderNumber}
                                        {newOrderIds.includes(order._id) && (
                                            <span className="new-order-badge">NEW</span>
                                        )}
                                    </td>
                                    <td>
                                        <div>{order.user?.name || 'N/A'}</div>
                                    </td>
                                    <td>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            maxWidth: '180px',
                                            lineHeight: '1.2'
                                        }}>
                                            {order.shippingAddress ? (
                                                <>
                                                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                                                        {order.shippingAddress.name}
                                                    </div>
                                                    <div style={{ color: 'var(--gray-600)' }}>
                                                        {order.shippingAddress.phone}
                                                    </div>
                                                    <div style={{ color: 'var(--gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {order.shippingAddress.street}, {order.shippingAddress.city}
                                                    </div>
                                                    <div style={{ color: 'var(--gray-600)' }}>
                                                        {order.shippingAddress.pincode}
                                                    </div>
                                                </>
                                            ) : (
                                                <span style={{ color: 'var(--gray-400)' }}>No address</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {order.items?.map((item, index) => (
                                                <div key={index} style={{ fontSize: '0.9rem' }}>
                                                    {item.product?.name || 'Unknown Product'}
                                                    <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginLeft: '10px' }}>
                                                        [<span style={{ fontWeight: 'bold', color: '#000' }}>{item.quantity}</span>]
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>₹{order.totalAmount?.toFixed(2)}</td>
                                    <td>
                                        <span style={{
                                            textTransform: 'uppercase',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {order.paymentMethod}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`order-status ${getStatusClass(order.status)}`}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.9rem' }}>{formatDate(order.createdAt)}</td>
                                    <td>
                                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                            <select
                                                className="form-input form-select"
                                                style={{ width: '150px', padding: '8px' }}
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="preparing">Preparing</option>
                                                <option value="out_for_delivery">Out for Delivery</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </main>
        </div>
    );
};

export default ManageOrders;
