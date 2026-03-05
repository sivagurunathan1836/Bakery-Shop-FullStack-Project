import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const { isAuthenticated } = useAuth();

    const fetchCartCount = async () => {
        if (!isAuthenticated) {
            setCartCount(0);
            return;
        }

        try {
            const response = await cartAPI.get();
            setCartCount(response.data.totalItems || 0);
        } catch (error) {
            console.error('Error fetching cart count:', error);
            // Don't reset count on error to avoid flickering if temporary
        }
    };

    useEffect(() => {
        fetchCartCount();
    }, [isAuthenticated]);

    const refreshCart = () => {
        fetchCartCount();
    };

    return (
        <CartContext.Provider value={{ cartCount, refreshCart }}>
            {children}
        </CartContext.Provider>
    );
};
