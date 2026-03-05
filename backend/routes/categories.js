const express = require('express');
const router = express.Router();
const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    removeSubcategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);
router.post('/:id/subcategory', protect, admin, addSubcategory);
router.delete('/:id/subcategory/:subId', protect, admin, removeSubcategory);

module.exports = router;
