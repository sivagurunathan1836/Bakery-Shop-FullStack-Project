const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name price priceUnit image stock isAvailable category'
            });

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        // Calculate totals
        let totalItems = 0;
        let totalAmount = 0;

        cart.items.forEach(item => {
            if (item.product) {
                totalItems += item.quantity;
                if (item.product.priceUnit === 'kg' && item.weight) {
                    totalAmount += item.product.price * item.weight;
                } else {
                    totalAmount += item.product.price * item.quantity;
                }
            }
        });

        res.json({
            cart,
            totalItems,
            totalAmount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1, weight } = req.body;

        // Check if product exists and is in stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock <= 0) {
            return res.status(400).json({ message: 'Product is out of stock' });
        }

        if (quantity > product.stock) {
            return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
            }
            cart.items[existingItemIndex].quantity = newQuantity;
            if (weight) cart.items[existingItemIndex].weight = weight;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity,
                weight: weight || null
            });
        }

        await cart.save();

        // Return populated cart
        cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name price priceUnit image stock isAvailable category'
            });

        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
    try {
        const { quantity, weight } = req.body;
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (quantity > product.stock) {
            return res.status(400).json({ message: `Only ${product.stock} items available in stock` });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex > -1) {
            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = quantity;
                if (weight) cart.items[itemIndex].weight = weight;
            }
            await cart.save();
        } else {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name price priceUnit image stock isAvailable'
            });

        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        await cart.save();

        cart = await Cart.findOne({ user: req.user._id })
            .populate({
                path: 'items.product',
                select: 'name price priceUnit image stock isAvailable'
            });

        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json({ message: 'Cart cleared', cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
