import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiEye } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onCartUpdate }) => {
    const { isAuthenticated } = useAuth();
    const { refreshCart } = useCart();
    const [loading, setLoading] = useState(false);

    const isOutOfStock = product.stock <= 0;

    const formatPrice = (price, priceUnit) => {
        if (priceUnit === 'kg') {
            return `₹${price}/kg`;
        }
        return `₹${price}`;
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            return;
        }

        if (isOutOfStock) {
            toast.error('Product is out of stock');
            return;
        }

        setLoading(true);
        try {
            await cartAPI.add(product._id, 1);
            toast.success(`${product.name} added to cart!`);
            refreshCart();
            if (onCartUpdate) onCartUpdate();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add to cart');
        } finally {
            setLoading(false);
        }
    };

    const getProductImage = () => {
        if (product.image && product.image.startsWith('/uploads')) {
            return `http://localhost:5000${product.image}`;
        }
        if (product.image && product.image.startsWith('http')) {
            return product.image;
        }
        // Default placeholder
        return `https://placehold.co/400x300/f5e6d3/5c4033?text=${encodeURIComponent(product.name)}`;
    };

    return (
        <div className="product-card">
            <Link to={`/products/${product._id}`}>
                <div className="product-card-image" style={{ backgroundColor: '#000' }}>
                    <img
                        src={getProductImage()}
                        alt={product.name}
                        style={{ opacity: isOutOfStock ? 0.5 : 1 }}
                        onError={(e) => {
                            e.target.src = `https://placehold.co/400x300/f5e6d3/5c4033?text=${encodeURIComponent(product.name)}`;
                        }}
                    />
                    {product.isFeatured && !isOutOfStock && (
                        <span className="product-badge badge-featured">Featured</span>
                    )}
                    {isOutOfStock && (
                        <span className="product-badge badge-out-of-stock">Out of Stock</span>
                    )}
                </div>

                <div className="product-card-content">
                    <p className="product-card-category">
                        {product.category?.name || 'Bakery'}
                        {product.subcategory && ` • ${product.subcategory}`}
                    </p>
                    <h3 className="product-card-name">{product.name}</h3>
                    <p className="product-card-price">
                        {formatPrice(product.price, product.priceUnit)}
                        {product.priceUnit === 'kg' && (
                            <span className="price-unit"> per kg</span>
                        )}
                    </p>

                    <div className="product-card-actions">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleAddToCart}
                            disabled={isOutOfStock || loading}
                        >
                            {loading ? 'Adding...' : (
                                <>
                                    <FiShoppingCart />
                                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                </>
                            )}
                        </button>
                        <Link
                            to={`/products/${product._id}`}
                            className="btn btn-secondary btn-sm btn-icon"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <FiEye />
                        </Link>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;
