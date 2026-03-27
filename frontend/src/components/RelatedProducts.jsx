import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiEye, FiStar, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cartAPI, productsAPI } from '../services/api';
import toast from 'react-hot-toast';

/* ── Skeleton card while loading ── */
const SkeletonCard = () => (
    <div className="rp-card rp-skeleton">
        <div className="rp-card-img rp-skel-block" />
        <div className="rp-card-body">
            <div className="rp-skel-line rp-skel-line--sm" />
            <div className="rp-skel-line" />
            <div className="rp-skel-line rp-skel-line--md" />
            <div className="rp-skel-line rp-skel-line--btn" />
        </div>
    </div>
);

/* ── Individual product card ── */
const RelatedCard = ({ product, onCartUpdate, index }) => {
    const { isAuthenticated } = useAuth();
    const { refreshCart } = useCart();
    const [adding, setAdding] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), index * 80);
        return () => clearTimeout(timer);
    }, [index]);

    const isOutOfStock = product.stock <= 0;

    const getImage = () => {
        if (product.image?.startsWith('/uploads')) return `http://localhost:5000${product.image}`;
        if (product.image?.startsWith('http')) return product.image;
        return `https://placehold.co/400x300/f5e6d3/5c4033?text=${encodeURIComponent(product.name)}`;
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) { toast.error('Please login to add items'); return; }
        if (isOutOfStock) { toast.error('Out of stock'); return; }
        setAdding(true);
        try {
            await cartAPI.add(product._id, 1);
            toast.success(`${product.name} added! 🎉`);
            refreshCart();
            if (onCartUpdate) onCartUpdate();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAdding(false);
        }
    };

    const formatPrice = (price, unit) => unit === 'kg' ? `₹${price}/kg` : `₹${price}`;

    return (
        <div className={`rp-card ${visible ? 'rp-card--visible' : ''}`}>
            <Link to={`/products/${product._id}`} className="rp-card-link">
                <div className="rp-card-img-wrap">
                    <img
                        src={getImage()}
                        alt={product.name}
                        className="rp-card-img"
                        style={{ opacity: isOutOfStock ? 0.5 : 1 }}
                        onError={(e) => {
                            e.target.src = `https://placehold.co/400x300/f5e6d3/5c4033?text=${encodeURIComponent(product.name)}`;
                        }}
                    />
                    {product.isFeatured && !isOutOfStock && (
                        <span className="rp-badge rp-badge--featured"><FiStar /> Featured</span>
                    )}
                    {isOutOfStock && (
                        <span className="rp-badge rp-badge--oos">Out of Stock</span>
                    )}
                    {product.category?.name && (
                        <span className="rp-cat-tag">{product.category.name}</span>
                    )}
                    <div className="rp-quick-view">
                        <FiEye /> Quick View
                    </div>
                </div>

                <div className="rp-card-body">
                    <h4 className="rp-card-name">{product.name}</h4>
                    <p className="rp-card-price">{formatPrice(product.price, product.priceUnit)}</p>
                </div>
            </Link>

            <div className="rp-card-footer">
                <button
                    className={`rp-add-btn ${isOutOfStock ? 'rp-add-btn--disabled' : ''} ${adding ? 'rp-add-btn--loading' : ''}`}
                    onClick={handleAdd}
                    disabled={isOutOfStock || adding}
                >
                    {adding ? (
                        <span className="rp-spinner" />
                    ) : (
                        <FiShoppingCart />
                    )}
                    {adding ? 'Adding…' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
};

/* ── Main component ── */
const RelatedProducts = ({ cart, onCartUpdate }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | category id
    const [tabs, setTabs] = useState([]);
    const sectionRef = useRef(null);

    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);
            try {
                const cartItems = cart?.items || [];
                if (cartItems.length === 0) { setProducts([]); setLoading(false); return; }

                const cartProductIds = new Set(cartItems.map(i => String(i.product?._id || i.product)));

                // Collect unique categories from cart items
                const cartCategories = [];
                const seenCatIds = new Set();
                cartItems.forEach(item => {
                    const cat = item.product?.category;
                    if (cat && !seenCatIds.has(String(cat._id || cat))) {
                        seenCatIds.add(String(cat._id || cat));
                        cartCategories.push({ id: String(cat._id || cat), name: cat.name || 'Related' });
                    }
                });

                // Build tab list
                const tabList = [{ id: 'all', name: 'All Suggestions' }, ...cartCategories];
                setTabs(tabList);

                // Fetch products from all cart categories in parallel
                const categoryFetches = cartCategories.map(cat =>
                    productsAPI.getAll({ category: cat.id, inStock: 'true', limit: 12 })
                        .then(r => (r.data.products || []).map(p => ({ ...p, _fromCategory: cat.id })))
                        .catch(() => [])
                );

                const categoryResults = await Promise.all(categoryFetches);

                // Merge, deduplicate and exclude cart items
                const seen = new Set();
                const allRelated = [];
                categoryResults.flat().forEach(p => {
                    const sid = String(p._id);
                    if (!seen.has(sid) && !cartProductIds.has(sid)) {
                        seen.add(sid);
                        allRelated.push(p);
                    }
                });

                // If we don't have enough, pad with featured products
                if (allRelated.length < 4) {
                    const fallback = await productsAPI.getAll({ inStock: 'true', limit: 16 });
                    (fallback.data.products || []).forEach(p => {
                        const sid = String(p._id);
                        if (!seen.has(sid) && !cartProductIds.has(sid)) {
                            seen.add(sid);
                            allRelated.push({ ...p, _fromCategory: 'other' });
                        }
                    });
                }

                // Shuffle for freshness
                allRelated.sort(() => Math.random() - 0.5);

                setProducts(allRelated);
            } catch (err) {
                console.error('RelatedProducts error:', err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRelated();
    }, [cart]);

    // Filter displayed products based on active tab
    const displayed = activeTab === 'all'
        ? products.slice(0, 8)
        : products.filter(p => p._fromCategory === activeTab).slice(0, 8);

    if (!loading && products.length === 0) return null;

    return (
        <section className="rp-section" ref={sectionRef} id="related-products">
            {/* Header */}
            <div className="rp-header">
                <div className="rp-header-left">
                    <span className="rp-header-chip"><FiZap /> You May Also Like</span>
                    <h2 className="rp-title">Pairs Perfectly With Your Order</h2>
                    <p className="rp-subtitle">
                        Curated picks based on what's in your cart
                    </p>
                </div>
            </div>

            {/* Category Tabs */}
            {!loading && tabs.length > 1 && (
                <div className="rp-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`rp-tab ${activeTab === tab.id ? 'rp-tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Grid */}
            <div className="rp-grid">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                    : displayed.length > 0
                        ? displayed.map((p, i) => (
                            <RelatedCard
                                key={p._id}
                                product={p}
                                onCartUpdate={onCartUpdate}
                                index={i}
                            />
                        ))
                        : (
                            <p className="rp-empty">No suggestions found for this category.</p>
                        )
                }
            </div>

            {/* View all link */}
            {!loading && products.length > 0 && (
                <div className="rp-footer">
                    <Link to="/products" className="rp-view-all">
                        Explore All Products →
                    </Link>
                </div>
            )}
        </section>
    );
};

export default RelatedProducts;
