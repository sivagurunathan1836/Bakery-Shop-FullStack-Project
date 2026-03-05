import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPackage, FiGrid, FiShoppingBag, FiBox, FiPlus, FiEdit2, FiTrash2, FiSettings, FiX } from 'react-icons/fi';
import { categoriesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageCategories = () => {
    const location = useLocation();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: ''
    });
    const [newSubcategory, setNewSubcategory] = useState('');

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingCategory) {
                await categoriesAPI.update(editingCategory._id, formData);
                toast.success('Category updated successfully');
            } else {
                await categoriesAPI.create(formData);
                toast.success('Category created successfully');
            }

            setShowModal(false);
            resetForm();
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save category');
        }
    };

    const handleAddSubcategory = async (categoryId) => {
        if (!newSubcategory.trim()) return;

        try {
            await categoriesAPI.addSubcategory(categoryId, { name: newSubcategory });
            toast.success('Subcategory added');
            setNewSubcategory('');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to add subcategory');
        }
    };

    const handleRemoveSubcategory = async (categoryId, subId, subName) => {
        if (!window.confirm(`Remove subcategory "${subName}"?`)) return;

        try {
            const category = categories.find(c => c._id === categoryId);
            if (!category) {
                toast.error('Category not found');
                return;
            }

            const updatedSubcategories = category.subcategories.filter(
                sub => sub._id !== subId && sub.name !== subName
            );

            // Use update API instead of remove API to avoid 404 issues with new routes
            await categoriesAPI.update(categoryId, {
                subcategories: updatedSubcategories
            });

            toast.success('Subcategory removed');
            fetchCategories();
        } catch (error) {
            console.error('Remove error details:', error);
            toast.error('Failed to remove subcategory');
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            image: category.image || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            await categoriesAPI.delete(id);
            toast.success('Category deleted successfully');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '', image: '' });
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
                <div className="admin-header">
                    <h1 className="admin-title">Manage Categories</h1>
                    <button
                        className="btn btn-primary"
                        onClick={() => { resetForm(); setShowModal(true); }}
                    >
                        <FiPlus /> Add Category
                    </button>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {categories.map((category) => (
                            <div key={category._id} className="card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>{category.name}</h3>
                                        <p style={{ color: 'var(--gray-500)', marginBottom: '16px' }}>
                                            {category.description || 'No description'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleEdit(category)}>
                                            <FiEdit2 />
                                        </button>
                                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(category._id)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>

                                {/* Subcategories */}
                                <div>
                                    <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                                        Subcategories ({category.subcategories?.length || 0})
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                        {category.subcategories?.map((sub, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    padding: '6px 14px',
                                                    background: 'var(--primary-light)',
                                                    borderRadius: '20px',
                                                    fontSize: '0.875rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                {sub.name}
                                                <button
                                                    onClick={() => handleRemoveSubcategory(category._id, sub._id, sub.name)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--gray-600)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: 0
                                                    }}
                                                >
                                                    <FiX size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', maxWidth: '400px' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="New subcategory name"
                                            value={newSubcategory}
                                            onChange={(e) => setNewSubcategory(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory(category._id)}
                                        />
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleAddSubcategory(category._id)}
                                        >
                                            <FiPlus /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Category Name *</label>
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

                                    <div className="form-group">
                                        <label className="form-label">Image URL</label>
                                        <input
                                            type="text"
                                            name="image"
                                            className="form-input"
                                            value={formData.image}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingCategory ? 'Update' : 'Create'} Category
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

export default ManageCategories;
