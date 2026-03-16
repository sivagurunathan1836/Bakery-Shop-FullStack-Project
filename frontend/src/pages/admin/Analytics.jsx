import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSettings, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ordersAPI, productsAPI } from '../../services/api';
import Sidebar from '../../components/admin/Sidebar';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#8884d8', '#82ca9d', '#ffc658'];

const Analytics = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [overallProductSales, setOverallProductSales] = useState([]);
    const [categorySales, setCategorySales] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);
    const [dailySales, setDailySales] = useState([]);

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                // Fetch all orders and products
                const [ordersRes, productsRes] = await Promise.all([
                    ordersAPI.getAllAdmin({ limit: 1000 }),
                    productsAPI.getAll({ limit: 1000 })
                ]);
                const orders = ordersRes.data.orders || [];
                const products = productsRes.data.products || [];

                // Build a safety map for categories
                const productToCategoryMap = {};
                products.forEach(p => {
                    productToCategoryMap[p._id] = p.category?.name || 'Uncategorized';
                });

                // 1. Overall Product Sales mapping
                const productSalesMap = {};
                // 2. Monthly Sales mapping
                const monthlyMap = {};
                // 3. Daily Sales mapping
                const dailyMap = {};
                // 4. Category Sales mapping
                const categoryMap = {};

                orders.forEach(order => {
                    const date = new Date(order.createdAt);
                    
                    // Safe strings for day/month
                    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    
                    // Total Sales Amount by Period
                    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = 0;
                    monthlyMap[monthKey] += order.totalAmount || 0;

                    if (!dailyMap[dayKey]) dailyMap[dayKey] = 0;
                    dailyMap[dayKey] += order.totalAmount || 0;

                    // Aggregate products
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            const productName = item.product?.name || 'Unknown';
                            const productId = item.product?._id || item.product;
                            const categoryName = item.product?.category?.name || productToCategoryMap[productId] || 'Uncategorized';
                            
                            const quantity = item.quantity || 1;

                            if (!productSalesMap[productName]) {
                                productSalesMap[productName] = 0;
                            }
                            productSalesMap[productName] += quantity;

                            if (!categoryMap[categoryName]) {
                                categoryMap[categoryName] = 0;
                            }
                            categoryMap[categoryName] += quantity;
                        });
                    }
                });

                // Convert maps to array formats suitable for recharts
                const productData = Object.keys(productSalesMap).map(key => ({
                    name: key,
                    totalSold: productSalesMap[key]
                })).sort((a, b) => b.totalSold - a.totalSold).slice(0, 10); // Top 10
                
                const categoryData = Object.keys(categoryMap).map(key => ({
                    name: key,
                    value: categoryMap[key]
                })).sort((a, b) => b.value - a.value);

                const monthData = Object.keys(monthlyMap).map(key => ({
                    month: key,
                    sales: monthlyMap[key]
                })).sort((a, b) => new Date(a.month) - new Date(b.month));

                const dayData = Object.keys(dailyMap).map(key => ({
                    day: key,
                    sales: dailyMap[key]
                })).sort((a, b) => new Date(a.day) - new Date(b.day));

                setOverallProductSales(productData);
                setCategorySales(categoryData);
                setMonthlySales(monthData);
                setDailySales(dayData.slice(-30)); // Last 30 days
            } catch (error) {
                console.error('Error fetching analytics data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);



    return (
        <div className="admin-layout">
            <Sidebar />

            <main className="admin-content">
                <div className="admin-header">
                    <h1 className="admin-title">Sales Analytics</h1>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Category Sales Pie Chart */}
                        <div className="dashboard-card" style={{ padding: '20px' }}>
                            <h3>Sales by Category (Units Sold)</h3>
                            <div style={{ width: '100%', height: 350, marginTop: '20px' }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={categorySales}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {categorySales.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 1. Overall Product Sales */}
                        <div className="dashboard-card" style={{ padding: '20px' }}>
                            <h3>Top Selling Products (Overall)</h3>
                            <div style={{ width: '100%', height: 350, marginTop: '20px' }}>
                                <ResponsiveContainer>
                                    <BarChart data={overallProductSales} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" tick={{ fontSize: 12 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="totalSold" name="Total Units Sold" fill="#8884d8">
                                            {overallProductSales.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Each month sales */}
                        <div className="dashboard-card" style={{ padding: '20px' }}>
                            <h3>Monthly Sales Trend (Revenue)</h3>
                            <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
                                <ResponsiveContainer>
                                    <LineChart data={monthlySales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="sales" name="Cash Earned (₹)" stroke="#82ca9d" strokeWidth={3} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 3. Each day selling products */}
                        <div className="dashboard-card" style={{ padding: '20px' }}>
                            <h3>Daily Sales Track (Last 30 Days)</h3>
                            <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
                                <ResponsiveContainer>
                                    <BarChart data={dailySales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="sales" name="Daily Revenue (₹)" fill="#ffc658" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Analytics;
