import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPackage, FiGrid, FiShoppingBag, FiBox, FiSearch, FiSettings, FiPieChart, FiAlertTriangle } from 'react-icons/fi';
import { productsAPI } from '../../services/api';
import Sidebar from '../../components/admin/Sidebar';
import toast from 'react-hot-toast';

const ManageStock = () => {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingStock, setEditingStock] = useState({});

    const fetchProducts = async () => {
        try {
            const response = await productsAPI.getAll({ limit: 100 });
            // Sort by stock (low to high)
            const sorted = (response.data.products || []).sort((a, b) => a.stock - b.stock);
            setProducts(sorted);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleStockChange = (productId, value) => {
        setEditingStock({
            ...editingStock,
            [productId]: value
        });
    };

    const handleUpdateStock = async (productId) => {
        const newStock = editingStock[productId];
        if (newStock === undefined || newStock === '') return;

        try {
            await productsAPI.updateStock(productId, parseInt(newStock));
            toast.success('Stock updated');
            fetchProducts();
            setEditingStock({ ...editingStock, [productId]: undefined });
        } catch (error) {
            toast.error('Failed to update stock');
        }
    };

    const lowStockProducts = products.filter(p => p.stock < 5);
    const outOfStockProducts = products.filter(p => p.stock === 0);



    return (
        <div className="admin-layout">
            <Sidebar />

            <main className="admin-content">
                <div className="admin-header">
                    <h1 className="admin-title">Stock Management</h1>
                </div>

                {/* Alerts */}
                <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="stat-card" style={{
                        background: outOfStockProducts.length > 0 ? '#ffebee' : '#e8f5e9'
                    }}>
                        <div className="stat-card-icon" style={{
                            background: outOfStockProducts.length > 0 ? '#ffcdd2' : '#c8e6c9',
                            color: outOfStockProducts.length > 0 ? '#c62828' : '#2e7d32'
                        }}>
                            <FiAlertTriangle />
                        </div>
                        <div className="stat-card-value" style={{
                            color: outOfStockProducts.length > 0 ? '#c62828' : '#2e7d32'
                        }}>
                            {outOfStockProducts.length}
                        </div>
                        <div className="stat-card-label">Out of Stock</div>
                    </div>

                    <div className="stat-card" style={{
                        background: lowStockProducts.length > 0 ? '#fff3e0' : '#e8f5e9'
                    }}>
                        <div className="stat-card-icon" style={{
                            background: lowStockProducts.length > 0 ? '#ffe0b2' : '#c8e6c9',
                            color: lowStockProducts.length > 0 ? '#ef6c00' : '#2e7d32'
                        }}>
                            <FiBox />
                        </div>
                        <div className="stat-card-value" style={{
                            color: lowStockProducts.length > 0 ? '#ef6c00' : '#2e7d32'
                        }}>
                            {lowStockProducts.length}
                        </div>
                        <div className="stat-card-label">Low Stock ({"<"}5)</div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Current Stock</th>
                                <th>Status</th>
                                <th>Update Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product._id} style={{
                                    background: product.stock === 0 ? '#fff5f5' : product.stock < 5 ? '#fffdf5' : 'inherit'
                                }}>
                                    <td style={{ fontWeight: '500' }}>{product.name}</td>
                                    <td>{product.category?.name || 'N/A'}</td>
                                    <td>
                                        <span style={{
                                            fontWeight: '700',
                                            fontSize: '1.1rem',
                                            color: product.stock === 0 ? 'var(--danger)' :
                                                product.stock < 5 ? 'var(--warning)' : 'var(--success)'
                                        }}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td>
                                        {product.stock === 0 ? (
                                            <span className="order-status status-cancelled">Out of Stock</span>
                                        ) : product.stock < 5 ? (
                                            <span className="order-status status-pending">Low Stock</span>
                                        ) : (
                                            <span className="order-status status-delivered">In Stock</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ width: '100px', padding: '8px' }}
                                                placeholder={product.stock.toString()}
                                                value={editingStock[product._id] ?? ''}
                                                onChange={(e) => handleStockChange(product._id, e.target.value)}
                                                min="0"
                                            />
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => handleUpdateStock(product._id)}
                                                disabled={editingStock[product._id] === undefined || editingStock[product._id] === ''}
                                            >
                                                Update
                                            </button>
                                        </div>
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

export default ManageStock;
