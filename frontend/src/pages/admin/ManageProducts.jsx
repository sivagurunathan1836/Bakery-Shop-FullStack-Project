import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPackage, FiGrid, FiShoppingBag, FiBox, FiPlus, FiEdit2, FiTrash2, FiSettings, FiX, FiPieChart, FiSearch } from 'react-icons/fi';
import { productsAPI, categoriesAPI } from '../../services/api';
import Sidebar from '../../components/admin/Sidebar';
import toast from 'react-hot-toast';

const BASE_URL = 'http://localhost:5000';

const ManageProducts = () => {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        priceUnit: 'piece',
        category: '',
        subcategory: '',
        stock: '',
        isFeatured: false,
        image: '',
        imageFile: null
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                productsAPI.getAll({ limit: 100 }),
                categoriesAPI.getAll()
            ]);
            setProducts(productsRes.data.products || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            setFormData({
                ...formData,
                imageFile: files[0]
            });
        } else {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? checked : value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description || '');
            data.append('price', parseFloat(formData.price));
            data.append('priceUnit', formData.priceUnit);
            data.append('category', formData.category);
            data.append('subcategory', formData.subcategory || '');
            data.append('stock', parseInt(formData.stock));
            data.append('isFeatured', formData.isFeatured);

            if (formData.imageFile) {
                data.append('image', formData.imageFile);
            } else if (formData.image) {
                data.append('image', formData.image);
            }

            // Products API handles Content-Type automatically when data is FormData
            if (editingProduct) {
                await productsAPI.update(editingProduct._id, data);
                toast.success('Product updated successfully');
            } else {
                await productsAPI.create(data);
                toast.success('Product created successfully');
            }

            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Save product error:', error);
            toast.error(error.response?.data?.message || 'Failed to save product');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString(),
            priceUnit: product.priceUnit,
            category: product.category?._id || product.category,
            subcategory: product.subcategory || '',
            stock: product.stock.toString(),
            isFeatured: product.isFeatured,
            image: product.image || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            await productsAPI.delete(id);
            toast.success('Product deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            priceUnit: 'piece',
            category: '',
            subcategory: '',
            stock: '',
            isFeatured: false,
            image: '',
            imageFile: null
        });
    };

    const selectedCategory = categories.find(c => c._id === formData.category);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));



    return (
        <div className="admin-layout">
            <Sidebar />

            {/* Main Content */}
            <main className="admin-content">
                <div className="admin-header">
                    <h1 className="admin-title">Manage Products</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '10px 20px 10px 40px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--gray-300)',
                                    outline: 'none',
                                    width: '350px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => { resetForm(); setShowModal(true); }}
                        >
                            <FiPlus /> Add Product
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product._id}>
                                    <td>
                                        <img
                                            src={product.image ? (product.image.startsWith('http') ? product.image : `${BASE_URL}${product.image}`) : `https://placehold.co/50x50/f5e6d3/5c4033?text=${product.name[0]}`}
                                            alt={product.name}
                                            className="admin-table-image"
                                            onError={(e) => {
                                                e.target.src = `https://placehold.co/50x50/f5e6d3/5c4033?text=${product.name[0]}`;
                                            }}
                                        />
                                    </td>
                                    <td style={{ fontWeight: '500' }}>{product.name}</td>
                                    <td>
                                        {product.category?.name || 'N/A'}
                                        {product.subcategory && <span style={{ color: 'var(--gray-500)' }}> / {product.subcategory}</span>}
                                    </td>
                                    <td>₹{product.price}{product.priceUnit === 'kg' ? '/kg' : ''}</td>
                                    <td>
                                        <span style={{
                                            color: product.stock === 0 ? 'var(--danger)' : product.stock < 5 ? 'var(--warning)' : 'var(--success)',
                                            fontWeight: '600'
                                        }}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn btn-secondary btn-sm btn-icon"
                                                onClick={() => handleEdit(product)}
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm btn-icon"
                                                onClick={() => handleDelete(product._id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            name="description"
                                            className="form-input"
                                            rows="3"
                                            value={formData.description}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Price (₹) *</label>
                                            <input
                                                type="number"
                                                name="price"
                                                className="form-input"
                                                value={formData.price}
                                                onChange={handleChange}
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Price Unit *</label>
                                            <select
                                                name="priceUnit"
                                                className="form-input form-select"
                                                value={formData.priceUnit}
                                                onChange={handleChange}
                                            >
                                                <option value="piece">Per Piece</option>
                                                <option value="kg">Per Kg</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Category *</label>
                                            <select
                                                name="category"
                                                className="form-input form-select"
                                                value={formData.category}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Subcategory</label>
                                            <select
                                                name="subcategory"
                                                className="form-input form-select"
                                                value={formData.subcategory}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Subcategory</option>
                                                {selectedCategory?.subcategories?.map((sub, idx) => (
                                                    <option key={idx} value={sub.name}>{sub.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Stock *</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            className="form-input"
                                            value={formData.stock}
                                            onChange={handleChange}
                                            min="0"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Product Image</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {/* Image URL Input */}
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.9em', color: 'var(--gray-600)' }}>Image URL</label>
                                                <input
                                                    type="text"
                                                    name="image"
                                                    className="form-input"
                                                    placeholder="https://example.com/image.jpg"
                                                    value={formData.image}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            image: e.target.value,
                                                            imageFile: null // Clear file if URL is entered
                                                        }));
                                                    }}
                                                />
                                            </div>

                                            {/* File Upload */}
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.9em', color: 'var(--gray-600)' }}>Or Upload Image</label>
                                                <input
                                                    type="file"
                                                    name="imageFile" // Changed name to avoid conflict with text input
                                                    className="form-input"
                                                    accept="image/*"
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Image Preview */}
                                            {(formData.image || formData.imageFile) && (
                                                <div style={{
                                                    marginTop: '8px',
                                                    border: '1px solid var(--gray-300)',
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    width: 'fit-content'
                                                }}>
                                                    <p style={{ fontSize: '0.8em', marginBottom: '8px', color: 'var(--gray-600)' }}>Preview:</p>
                                                    <img
                                                        src={
                                                            formData.imageFile
                                                                ? URL.createObjectURL(formData.imageFile)
                                                                : formData.image.startsWith('http')
                                                                    ? formData.image
                                                                    : `${BASE_URL}${formData.image}`
                                                        }
                                                        alt="Preview"
                                                        style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }}
                                                        onError={(e) => {
                                                            e.target.src = 'https://placehold.co/200x200/f5e6d3/5c4033?text=Invalid+Image';
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            name="isFeatured"
                                            checked={formData.isFeatured}
                                            onChange={handleChange}
                                        />
                                        Featured Product
                                    </label>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingProduct ? 'Update' : 'Create'} Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ManageProducts;
