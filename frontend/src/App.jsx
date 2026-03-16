import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Categories from './pages/Categories';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

import Orders from './pages/Orders';
import ScanQR from './pages/ScanQR';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageCategories from './pages/admin/ManageCategories';
import ManageOrders from './pages/admin/ManageOrders';
import ManageStock from './pages/admin/ManageStock';
import Analytics from './pages/admin/Analytics';
import AIBakeryAnalytics from './pages/admin/AIBakeryAnalytics';
import NewOrderAlert from './components/admin/NewOrderAlert';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin()) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    const { isAdmin } = useAuth();

    return (
        <>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#333',
                        color: '#fff',
                        borderRadius: '8px',
                    },
                }}
            />

            {isAdmin && isAdmin() && <NewOrderAlert />}

            <Navbar />

            <main>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />

                    <Route path="/categories" element={<Categories />} />
                    <Route path="/scan" element={<ScanQR />} />

                    {/* Protected Routes */}
                    <Route path="/cart" element={
                        <ProtectedRoute>
                            <Cart />
                        </ProtectedRoute>
                    } />
                    <Route path="/checkout" element={
                        <ProtectedRoute>
                            <Checkout />
                        </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    } />
                    <Route path="/orders/:id" element={
                        <ProtectedRoute>
                            <Orders />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    } />
                    <Route path="/admin/products" element={
                        <AdminRoute>
                            <ManageProducts />
                        </AdminRoute>
                    } />
                    <Route path="/admin/categories" element={
                        <AdminRoute>
                            <ManageCategories />
                        </AdminRoute>
                    } />
                    <Route path="/admin/orders" element={
                        <AdminRoute>
                            <ManageOrders />
                        </AdminRoute>
                    } />
                    <Route path="/admin/stock" element={
                        <AdminRoute>
                            <ManageStock />
                        </AdminRoute>
                    } />
                    <Route path="/admin/analytics" element={
                        <AdminRoute>
                            <Analytics />
                        </AdminRoute>
                    } />
                    <Route path="/admin/ai-analytics" element={
                        <AdminRoute>
                            <AIBakeryAnalytics />
                        </AdminRoute>
                    } />

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            <Footer />
        </>
    );
}

export default App;
