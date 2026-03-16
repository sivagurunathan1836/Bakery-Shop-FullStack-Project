import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiTrash2, FiArrowRight, FiCreditCard, FiDollarSign, FiCheckCircle, FiAlertTriangle, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import CartItem from '../components/CartItem';
import ProductCard from '../components/ProductCard';
import { cartAPI, ordersAPI, paymentAPI, productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const Cart = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { refreshCart } = useCart();
    const [cart, setCart] = useState(null);
    const [totalItems, setTotalItems] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [confirmingPayment, setConfirmingPayment] = useState(false);
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [deliveryCity, setDeliveryCity] = useState('');
    const [shippingAddress, setShippingAddress] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        street: '',
        pincode: ''
    });
    const [recommendations, setRecommendations] = useState([]);

    const CITIES = [
        'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode',
        'Kallakurichi', 'Kancheepuram', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam',
        'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
        'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur',
        'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
    ];

    // Tax calculation (5% GST)
    const TAX_RATE = 0.05;
    const subtotal = totalAmount;
    const tax = subtotal * TAX_RATE;
    const finalTotal = subtotal + tax;

    // Generate dynamic UPI payment URL with cart total
    const generateUPIUrl = () => {
        const upiId = 'sekarparameshwari09-1@oksbi';
        const payeeName = 'Ganesh Bakery';
        const amount = finalTotal.toFixed(2);
        const currency = 'INR';
        const transactionNote = 'Order Payment';

        return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(transactionNote)}`;
    };

    const fetchCart = async () => {
        try {
            const response = await cartAPI.get();
            setCart(response.data.cart);
            setTotalItems(response.data.totalItems);
            setTotalAmount(response.data.totalAmount);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // AI Recommendation Logic
    useEffect(() => {
        const getRecommendations = async () => {
            if (!cart || !cart.items || cart.items.length === 0) {
                setRecommendations([]);
                return;
            }

            try {
                // Get IDs of items currently in cart
                const cartProductIds = cart.items.map(item => String(item.product?._id || item.product));
                console.log("Cart Product IDs:", cartProductIds);

                // Fetch our entire product catalog
                const response = await productsAPI.getAll({ limit: 100 });
                const allProducts = response.data.products || [];
                console.log("All Products fetched:", allProducts.length);

                let recommended = [];
                for (let p of allProducts) {
                    const idString = String(p._id);
                    if (!cartProductIds.includes(idString) && p.stock > 0) {
                        recommended.push(p);
                    }
                }

                console.log("Filtered recommended before shuffling:", recommended.length);

                // If somehow empty, just show anything available
                if (recommended.length === 0) {
                    recommended = allProducts;
                }

                // Shuffle utilizing Fisher-Yates approach substitute to diversify what's shown
                recommended = recommended.sort(() => 0.5 - Math.random()).slice(0, 4);

                console.log("Final set of recommendations:", recommended.length);
                setRecommendations(recommended);
            } catch (error) {
                console.error("Failed to fetch AI recommendations", error);
            }
        };
        getRecommendations();
    }, [cart]);

    useEffect(() => {
        if (user) {
            setShippingAddress(prev => ({
                ...prev,
                name: prev.name || user.name || '',
                phone: prev.phone || user.phone || ''
            }));
        }
    }, [user]);

    const handleUpdateQuantity = async (productId, quantity) => {
        setUpdating(true);
        try {
            if (quantity <= 0) {
                await cartAPI.remove(productId);
                toast.success('Item removed from cart');
            } else {
                await cartAPI.update(productId, quantity);
            }
            await fetchCart();
            refreshCart();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update cart');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemove = async (productId) => {
        setUpdating(true);
        try {
            await cartAPI.remove(productId);
            toast.success('Item removed from cart');
            await fetchCart();
            refreshCart();
        } catch (error) {
            toast.error('Failed to remove item');
        } finally {
            setUpdating(false);
        }
    };

    const handleClearCart = async () => {
        if (!window.confirm('Are you sure you want to clear your cart?')) return;

        setUpdating(true);
        try {
            await cartAPI.clear();
            toast.success('Cart cleared');
            await fetchCart();
            refreshCart();
        } catch (error) {
            toast.error('Failed to clear cart');
        } finally {
            setUpdating(false);
        }
    };

    // Check if any items are out of stock
    const hasOutOfStock = cart?.items.some(item => item.product?.stock === 0) || false;

    // Handle COD Order
    const handleCODOrder = async () => {
        if (!user) {
            toast.error('Please login to place order');
            navigate('/login');
            return;
        }

        if (deliveryCity !== 'Karur') {
            toast.error('We currently only deliver to Karur');
            return;
        }

        // Validate address fields
        if (!shippingAddress.street || !shippingAddress.pincode || !shippingAddress.phone) {
            toast.error('Please fill in all address fields');
            return;
        }

        setConfirmingPayment(true);
        try {
            const orderData = {
                shippingAddress: {
                    name: shippingAddress.name || user.name,
                    phone: shippingAddress.phone,
                    street: shippingAddress.street,
                    city: deliveryCity,
                    state: 'Tamil Nadu',
                    pincode: shippingAddress.pincode
                },
                paymentMethod: 'cod',
                paymentStatus: 'Pending',
                notes: 'Cash on Delivery'
            };

            const response = await ordersAPI.create(orderData);
            toast.success('Order placed successfully!');
            refreshCart();
            navigate(`/orders/${response.data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to place order');
        } finally {
            setConfirmingPayment(false);
        }
    };

    // Handle Razorpay Payment
    const handleRazorpayPayment = async () => {
        if (!user) {
            toast.error('Please login to place order');
            navigate('/login');
            return;
        }

        if (deliveryCity !== 'Karur') {
            toast.error('We currently only deliver to Karur');
            return;
        }

        // Validate address fields
        if (!shippingAddress.street || !shippingAddress.pincode || !shippingAddress.phone) {
            toast.error('Please fill in all address fields');
            return;
        }

        setConfirmingPayment(true);

        try {
            // Step 1: Create Razorpay order
            const orderResponse = await paymentAPI.createOrder({
                amount: finalTotal,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            });

            const { order, key_id } = orderResponse.data;

            // Step 2: Open Razorpay checkout
            const options = {
                key: key_id,
                amount: order.amount,
                currency: order.currency,
                name: 'Ganesh Bakery',
                description: 'Order Payment',
                order_id: order.id,
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || ''
                },
                theme: {
                    color: '#d4a574'
                },
                handler: async function (response) {
                    // Step 3: Verify payment on backend
                    try {
                        const verifyResponse = await paymentAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderData: {
                                shippingAddress: {
                                    name: shippingAddress.name || user.name,
                                    phone: shippingAddress.phone,
                                    street: shippingAddress.street,
                                    city: deliveryCity,
                                    state: 'Tamil Nadu',
                                    pincode: shippingAddress.pincode
                                },
                                notes: 'Paid via Razorpay UPI'
                            }
                        });

                        if (verifyResponse.data.success) {
                            toast.success('Payment successful! Order placed automatically.');
                            refreshCart();
                            navigate(`/orders/${verifyResponse.data.order._id}`);
                        }
                    } catch (error) {
                        toast.error('Payment verification failed. Please contact support.');
                        console.error('Verification error:', error);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setConfirmingPayment(false);
                        toast.error('Payment cancelled');
                    }
                }
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();

        } catch (error) {
            console.error('Razorpay init error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to initiate payment';
            toast.error(`Payment Error: ${errorMessage}`);
            setConfirmingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    const items = cart?.items || [];

    return (
        <div className="page">
            <div className="container">
                <h1 className="section-title" style={{ marginBottom: '40px' }}>Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="empty-state">
                        <FiShoppingBag className="empty-state-icon" />
                        <h3 className="empty-state-title">Your cart is empty</h3>
                        <p className="empty-state-text">
                            Looks like you haven't added any items yet
                        </p>
                        <Link to="/products" className="btn btn-primary">
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="cart-payment-container">
                        {/* Left Side - Bill Summary */}
                        <div className="cart-bill-section">
                            <div className="cart-items">
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <h2 style={{ fontSize: '1.3rem', fontWeight: '600' }}>
                                        Cart Items ({totalItems})
                                    </h2>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleClearCart}
                                        disabled={updating}
                                    >
                                        <FiTrash2 /> Clear Cart
                                    </button>
                                </div>

                                {items.map((item) => (
                                    <CartItem
                                        key={item.product?._id || item._id}
                                        item={item}
                                        onUpdateQuantity={handleUpdateQuantity}
                                        onRemove={handleRemove}
                                        loading={updating}
                                    />
                                ))}
                            </div>

                            {/* Detailed Bill Summary */}
                            <div className="bill-summary-card">
                                <h3 className="bill-summary-title">
                                    <FiDollarSign /> Bill Summary
                                </h3>

                                <div className="bill-items-list">
                                    {items.map((item) => (
                                        <div key={item._id} className="bill-item-row">
                                            <div className="bill-item-details">
                                                <span className="bill-item-name">{item.product?.name}</span>
                                                <span className="bill-item-qty">
                                                    {item.quantity} × ₹{item.product?.price}
                                                    {item.weight && ` (${item.weight}kg)`}
                                                </span>
                                            </div>
                                            <span className="bill-item-price">
                                                ₹{(item.product?.priceUnit === 'kg' && item.weight
                                                    ? item.product?.price * item.weight
                                                    : item.product?.price * item.quantity
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="bill-calculations">
                                    <div className="bill-calc-row">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="bill-calc-row">
                                        <span>GST (5%)</span>
                                        <span>₹{tax.toFixed(2)}</span>
                                    </div>
                                    <div className="bill-calc-row">
                                        <span>Delivery</span>
                                        <span style={{ color: 'var(--success)' }}>Free</span>
                                    </div>
                                    <div className="bill-calc-row bill-total">
                                        <span>Total Amount</span>
                                        <span>₹{finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Payment Section */}
                        <div className="cart-qr-section">
                            {/* Out of Stock Warning */}
                            {hasOutOfStock && (
                                <div className="stock-warning-card">
                                    <FiAlertTriangle />
                                    <div>
                                        <strong>Some items are out of stock</strong>
                                        <p>Please remove out-of-stock items to proceed</p>
                                    </div>
                                </div>
                            )}

                            {/* Delivery Check */}
                            <div className="location-check-card" style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: 'var(--border-radius)',
                                boxShadow: 'var(--shadow-sm)',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiMapPin /> Delivery Location
                                </h3>
                                <div className="form-group">
                                    <select
                                        value={deliveryCity}
                                        onChange={(e) => setDeliveryCity(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--gray-300)',
                                            fontSize: '1rem',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="">Select City</option>
                                        {CITIES.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                {deliveryCity && deliveryCity !== 'Karur' && (
                                    <div style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        background: '#ffebee',
                                        color: '#c62828',
                                        borderRadius: '6px',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <FiAlertTriangle />
                                        Sorry, we currently only deliver to Karur.
                                    </div>
                                )}
                                {deliveryCity === 'Karur' && (
                                    <div style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        background: '#e8f5e9',
                                        color: '#2e7d32',
                                        borderRadius: '6px',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <FiCheckCircle />
                                        Location serviceable! You can proceed.
                                    </div>
                                )}
                            </div>

                            {/* Shipping Address Form - shown when Karur is selected */}
                            {deliveryCity === 'Karur' && (
                                <div style={{
                                    background: 'white',
                                    padding: '20px',
                                    borderRadius: 'var(--border-radius)',
                                    boxShadow: 'var(--shadow-sm)',
                                    marginBottom: '20px'
                                }}>
                                    <h3 style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        marginBottom: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <FiMapPin /> Shipping Address
                                    </h3>

                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontWeight: '500',
                                            fontSize: '0.9rem'
                                        }}>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingAddress.name}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                                            placeholder="Enter your full name"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--gray-300)',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontWeight: '500',
                                            fontSize: '0.9rem'
                                        }}>
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={shippingAddress.phone}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                            placeholder="Enter your phone number"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--gray-300)',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            required
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontWeight: '500',
                                            fontSize: '0.9rem'
                                        }}>
                                            Street Address *
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingAddress.street}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                                            placeholder="House No, Street, Area"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--gray-300)',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            required
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label style={{
                                            display: 'block',
                                            marginBottom: '6px',
                                            fontWeight: '500',
                                            fontSize: '0.9rem'
                                        }}>
                                            Pincode *
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingAddress.pincode}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                                            placeholder="Enter pincode"
                                            maxLength="6"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--gray-300)',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                            required
                                        />
                                    </div>

                                    <div style={{
                                        marginTop: '12px',
                                        padding: '10px',
                                        background: '#e3f2fd',
                                        color: '#1976d2',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem'
                                    }}>
                                        ℹ️ Please provide accurate delivery address for smooth delivery
                                    </div>
                                </div>
                            )}

                            {/* Payment Method Selection */}
                            <div className="payment-method-card">
                                <h3 className="payment-card-title">
                                    <FiCreditCard /> Select Payment Method
                                </h3>

                                <div className="payment-options">
                                    <label className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={(e) => {
                                                setPaymentMethod(e.target.value);
                                                setPaymentConfirmed(false);
                                            }}
                                        />
                                        <div className="payment-option-content">
                                            <strong>Cash on Delivery</strong>
                                            <p>Pay when you receive your order</p>
                                        </div>
                                    </label>

                                    <label className={`payment-option ${paymentMethod === 'online' ? 'active' : ''}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="online"
                                            checked={paymentMethod === 'online'}
                                            onChange={(e) => {
                                                setPaymentMethod(e.target.value);
                                                setPaymentConfirmed(false);
                                            }}
                                        />
                                        <div className="payment-option-content">
                                            <strong>Online Payment (UPI)</strong>
                                            <p>Pay instantly via UPI</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Razorpay Payment Info */}
                            {paymentMethod === 'online' && (
                                <div className="qr-payment-card">
                                    <h3 className="qr-card-title">Razorpay Secure Payment</h3>

                                    <div className="payment-amount-display">
                                        <span className="amount-label">Amount to Pay</span>
                                        <span className="amount-value">₹{finalTotal.toFixed(2)}</span>
                                    </div>

                                    <div className="payment-instructions">
                                        <p className="instruction-title">💳 How It Works:</p>
                                        <ol className="instruction-list">
                                            <li>Click "Pay Now" button below</li>
                                            <li>Razorpay payment window will open</li>
                                            <li>Select UPI payment method</li>
                                            <li>Scan QR code or enter UPI ID</li>
                                            <li>Complete payment in your UPI app</li>
                                            <li>Order will be created automatically!</li>
                                        </ol>
                                    </div>

                                    <div style={{
                                        background: '#e3f2fd',
                                        padding: '12px',
                                        borderRadius: 'var(--border-radius-sm)',
                                        marginTop: '16px'
                                    }}>
                                        <p style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--secondary)',
                                            margin: 0,
                                            textAlign: 'center',
                                            fontWeight: '500'
                                        }}>
                                            ✓ Secure payment powered by Razorpay
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="cart-actions">
                                {paymentMethod === 'online' ? (
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={handleRazorpayPayment}
                                        disabled={hasOutOfStock || confirmingPayment || deliveryCity !== 'Karur'}
                                        style={{ width: '100%', opacity: deliveryCity !== 'Karur' ? 0.6 : 1, cursor: deliveryCity !== 'Karur' ? 'not-allowed' : 'pointer' }}
                                    >
                                        {confirmingPayment ? (
                                            'Processing...'
                                        ) : (
                                            <>
                                                <FiCheckCircle /> Pay ₹{finalTotal.toFixed(2)} Now
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={handleCODOrder}
                                        disabled={hasOutOfStock || confirmingPayment || deliveryCity !== 'Karur'}
                                        style={{ width: '100%', opacity: deliveryCity !== 'Karur' ? 0.6 : 1, cursor: deliveryCity !== 'Karur' ? 'not-allowed' : 'pointer' }}
                                    >
                                        {confirmingPayment ? (
                                            'Placing Order...'
                                        ) : (
                                            <>
                                                Place Order (COD) <FiArrowRight />
                                            </>
                                        )}
                                    </button>
                                )}

                                <Link
                                    to="/products"
                                    className="continue-shopping-link"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Recommendations Section */}
                {recommendations.length > 0 && items.length > 0 && (
                    <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid var(--gray-200)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', marginBottom: '25px', color: 'var(--text-dark)' }}>
                            <FiTrendingUp style={{ color: 'var(--primary)' }} />
                            Pairs perfectly with your items!
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: '24px'
                        }}>
                            {recommendations.map(product => (
                                <ProductCard key={product._id} product={product} onCartUpdate={fetchCart} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
