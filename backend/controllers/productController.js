const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
    try {
        const { category, subcategory, search, featured, inStock, sort, limit = 20, page = 1 } = req.query;

        let query = {};

        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;
        if (search) query.name = { $regex: search, $options: 'i' };

        if (inStock === 'true') {
            query.stock = { $gt: 0 };
            query.isAvailable = true;
        } else if (featured === 'true') {
            query.isFeatured = true;
            query.isAvailable = true;
        } else if (req.query.isAvailable !== undefined) {
            query.isAvailable = req.query.isAvailable === 'true';
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        if (sort === 'price_desc') sortOption = { price: -1 };
        if (sort === 'name') sortOption = { name: 1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find(query)
            .populate('category', 'name')
            .sort(sortOption)
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Product.countDocuments(query);

        res.json({
            products,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name subcategories');

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = async (req, res) => {
    try {
        const products = await Product.find({
            category: req.params.categoryId,
            isAvailable: true
        }).populate('category', 'name');

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, priceUnit, category, subcategory, stock, isFeatured } = req.body;

        // Handle image upload
        let image = req.body.image || '';
        if (req.file) {
            image = `/uploads/${req.file.filename}`;
        }

        const product = await Product.create({
            name,
            description,
            price,
            priceUnit: priceUnit || 'piece',
            category,
            subcategory,
            image,
            stock: stock || 0,
            isFeatured: isFeatured || false
        });

        const populatedProduct = await Product.findById(product._id).populate('category', 'name');
        res.status(201).json(populatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, priceUnit, category, subcategory, stock, isAvailable, isFeatured } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price !== undefined ? price : product.price;
            product.priceUnit = priceUnit || product.priceUnit;
            product.category = category || product.category;
            product.subcategory = subcategory || product.subcategory;

            // Handle image upload
            if (req.file) {
                product.image = `/uploads/${req.file.filename}`;
            } else if (req.body.image) {
                product.image = req.body.image;
            }

            product.stock = stock !== undefined ? stock : product.stock;
            product.isAvailable = isAvailable !== undefined ? isAvailable : product.isAvailable;
            product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;

            const updatedProduct = await product.save();
            const populatedProduct = await Product.findById(updatedProduct._id).populate('category', 'name');
            res.json(populatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update product stock (Admin)
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res) => {
    try {
        const { stock } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            product.stock = stock;
            await product.save();
            res.json({ message: 'Stock updated', stock: product.stock });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({ isFeatured: true, isAvailable: true, stock: { $gt: 0 } })
            .populate('category', 'name')
            .limit(8);

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
