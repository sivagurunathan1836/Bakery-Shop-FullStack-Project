const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort('name');
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a category (Admin)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
    try {
        const { name, description, image, subcategories } = req.body;

        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await Category.create({
            name,
            description,
            image,
            subcategories: subcategories || []
        });

        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a category (Admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, image, subcategories, isActive } = req.body;

        const category = await Category.findById(req.params.id);

        if (category) {
            category.name = name || category.name;
            category.description = description || category.description;
            category.image = image || category.image;
            category.subcategories = subcategories || category.subcategories;
            category.isActive = isActive !== undefined ? isActive : category.isActive;

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a category (Admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add subcategory to category (Admin)
// @route   POST /api/categories/:id/subcategory
// @access  Private/Admin
exports.addSubcategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const category = await Category.findById(req.params.id);

        if (category) {
            category.subcategories.push({ name, description });
            await category.save();
            res.json(category);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Remove subcategory from category (Admin)
// @route   DELETE /api/categories/:id/subcategory/:subId
// @access  Private/Admin
exports.removeSubcategory = async (req, res) => {
    try {
        console.log(`Removing subcategory. CatID: ${req.params.id}, SubID/Name: ${req.params.subId}`);
        const category = await Category.findById(req.params.id);

        if (category) {
            const originalLength = category.subcategories.length;

            category.subcategories = category.subcategories.filter((sub) => {
                const sId = sub._id ? sub._id.toString() : '';
                return sId !== req.params.subId && sub.name !== req.params.subId;
            });

            if (category.subcategories.length === originalLength) {
                console.log('No subcategory found to remove with that ID or Name');
            } else {
                console.log('Subcategory removed');
            }

            await category.save();
            res.json(category);
        } else {
            console.log('Category not found');
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        console.error('Error removing subcategory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
