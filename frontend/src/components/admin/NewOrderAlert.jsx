import { useState, useEffect, useRef } from 'react';
import { ordersAPI } from '../../services/api';
import { FiBell, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const NewOrderAlert = () => {
    const [latestOrderId, setLatestOrderId] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const audioContentRef = useRef(null);

    // Provide a professional chime sound using Web Audio API
    const playChime = () => {
        try {
            if (!audioContentRef.current) {
                audioContentRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const context = audioContentRef.current;
            
            if (context.state === 'suspended') {
                context.resume();
            }

            const playNote = (freq, delay, volume) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(freq, context.currentTime + delay);
                
                gainNode.gain.setValueAtTime(0, context.currentTime + delay);
                gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + delay + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + delay + 1);
                
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                
                oscillator.start(context.currentTime + delay);
                oscillator.stop(context.currentTime + delay + 1.2);
            };

            // Play a two-tone chime (E5 then A5)
            playNote(659.25, 0, 0.4); // E5
            playNote(880.00, 0.15, 0.4); // A5
        } catch(e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        // Fetch initially to get the latest order id without alerting
        const fetchInitial = async () => {
            try {
                const res = await ordersAPI.getAllAdmin({ limit: 1 });
                if (res.data.orders && res.data.orders.length > 0) {
                    setLatestOrderId(res.data.orders[0]._id);
                } else {
                    setLatestOrderId('NONE');
                }
            } catch (error) {
                console.error('Failed to init order polling');
            }
        };
        fetchInitial();
    }, []);

    useEffect(() => {
        if (!latestOrderId) return; // Don't poll until we have the baseline

        const pollOrders = async () => {
            try {
                const res = await ordersAPI.getAllAdmin({ limit: 1 });
                const orders = res.data.orders;
                if (orders && orders.length > 0) {
                    const newest = orders[0];
                    if (latestOrderId !== 'NONE' && newest._id !== latestOrderId) {
                        // We have a new order!
                        setLatestOrderId(newest._id);
                        
                        // Create a new alert
                        const newAlert = {
                            id: Date.now(),
                            orderName: newest.user?.name || "A customer",
                            orderId: newest._id,
                            amount: newest.totalAmount || 0
                        };
                        
                        setAlerts(prev => [...prev, newAlert]);
                        
                        // Set 15s timeout
                        const timeoutId = setTimeout(() => {
                            dismissAlert(newAlert.id);
                        }, 15000);
                        
                        newAlert.timeoutId = timeoutId;
                    } else if (latestOrderId === 'NONE') {
                        setLatestOrderId(newest._id);
                    }
                }
            } catch(e) {}
        };

        const intervalId = setInterval(pollOrders, 5000); // Check every 5 seconds
        return () => clearInterval(intervalId);
    }, [latestOrderId]);

    // Continuous sound loop for active alerts
    useEffect(() => {
        let soundInterval;
        if (alerts.length > 0) {
            playChime(); // initial chime
            soundInterval = setInterval(() => {
                playChime();
            }, 3500); // chime every 3.5 seconds while alert is active
        }
        
        // Notify Sidebar about active alerts
        const event = new CustomEvent('new-order-update', { detail: { count: alerts.length } });
        window.dispatchEvent(event);

        return () => {
            if (soundInterval) clearInterval(soundInterval);
        };
    }, [alerts]);

    const dismissAlert = (id) => {
        setAlerts(prev => {
            const act = prev.find(a => a.id === id);
            if (act && act.timeoutId) clearTimeout(act.timeoutId);
            return prev.filter(a => a.id !== id);
        });
    };

    if (alerts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
        }}>
            {alerts.map(alert => (
                <div key={alert.id} style={{
                    background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
                    color: 'white',
                    padding: '24px',
                    borderRadius: '16px',
                    boxShadow: '0 15px 35px rgba(255, 71, 87, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '320px',
                    animation: 'slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            <FiBell className="ringing-bell" size={24} /> New Order!
                        </h4>
                        <button 
                            onClick={() => dismissAlert(alert.id)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '0', display: 'flex' }}
                            title="Dismiss"
                        >
                            <FiX size={24} />
                        </button>
                    </div>
                    <p style={{ margin: '0 0 20px 0', fontSize: '1rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.95)' }}>
                        <strong>{alert.orderName}</strong> has just placed an order for <strong>₹{alert.amount.toFixed(2)}</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link 
                            to="/admin/orders" 
                            onClick={() => dismissAlert(alert.id)}
                            style={{
                                background: 'white',
                                color: '#ff4757',
                                padding: '10px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                flex: 2,
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                            className="btn-hover-effect"
                        >
                            View Order
                        </Link>
                        <button 
                            onClick={() => dismissAlert(alert.id)}
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                flex: 1.5,
                                transition: 'all 0.2s'
                            }}
                            className="btn-hover-effect"
                        >
                            Stop Sound
                        </button>
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(120%) scale(0.9); opacity: 0; }
                    to { transform: translateX(0) scale(1); opacity: 1; }
                }
                @keyframes ring {
                    0% { transform: rotate(0); }
                    10% { transform: rotate(20deg) scale(1.1); }
                    20% { transform: rotate(-20deg) scale(1.1); }
                    30% { transform: rotate(15deg) scale(1.1); }
                    40% { transform: rotate(-15deg) scale(1.1); }
                    50% { transform: rotate(0) scale(1); }
                    100% { transform: rotate(0); }
                }
                .ringing-bell {
                    animation: ring 2s infinite;
                }
                .btn-hover-effect:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default NewOrderAlert;
