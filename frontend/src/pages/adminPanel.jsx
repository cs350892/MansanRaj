import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  LogOut,
  Download,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";
import ProductManagement from "../components/ProductManagement";
import OrderManagement from "../components/OrderManagement";
import PaymentsReports from "../components/PaymentsReports";
import OffersCoupons from "../components/OffersCoupons";
import MessagesSupport from "../components/MessagesSupport";

const AdminPanel = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  // Safely destructure with defaults
  const {
    user = null,
    token = null,
    logout = () => {},
    isAdmin = false,
  } = auth || {};

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [formData, setFormData] = useState({
    name: "",
    image: "",
    mrp: 0,
    stock: 0,
    category: "",
    brand: "",
    description: "",
    type: "regional-brands",
  });

  // Mock data for additional sections
  const [payouts] = useState([
    { id: "PAY001", date: "2025-10-01", amount: 5000, status: "Completed" },
    { id: "PAY002", date: "2025-09-25", amount: 4500, status: "Completed" },
  ]);

  const [offers] = useState([
    {
      id: "OFF001",
      code: "SAVE10",
      discount: 10,
      active: true,
      expiry: "2025-10-15",
    },
    {
      id: "OFF002",
      code: "WELCOME20",
      discount: 20,
      active: false,
      expiry: "2025-09-30",
    },
  ]);

  const [messages] = useState([
    {
      id: "MSG001",
      from: "Customer",
      content: "When will my order arrive?",
      date: "2025-10-07",
    },
    {
      id: "MSG002",
      from: "Support",
      content: "Your issue is resolved.",
      date: "2025-10-06",
    },
  ]);

  // Check if admin
  useEffect(() => {
    if (!isAdmin && user) {
      alert("Admin access required!");
      navigate("/login");
    }
  }, [isAdmin, user, navigate]);
  useEffect(() => {
    if (activeTab === "offers") {
      navigate("/offers");
    }
  }, [activeTab, navigate]);

  // Fetch data on mount
  useEffect(() => {
    if (token && isAdmin) {
      fetchAnalytics();
      fetchProducts();
      fetchOrders();
    }
  }, [token, isAdmin]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_API}/admin/analytics`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      // Set mock analytics if API fails
      setAnalytics({
        users: { totalUsers: 150 },
        revenue: { totalRevenue: 25000 },
        orders: { totalOrders: 120, pendingOrders: 15 },
        products: {
          totalProducts: 89,
          totalBrands: 23,
          totalCategories: 8,
          lowStock: [
            { id: 1, name: "Parle-G", stock: 5 },
            { id: 2, name: "Haldiram Bhujia", stock: 8 },
          ],
        },
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_URL_API}/products`);
      const data = await response.json();
      // Ensure data is an array - handle both direct array and {products: []} format
      const productsArray = Array.isArray(data) ? data : data.products || [];
      setProducts(productsArray);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]); // Set to empty array on error
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_API}/admin/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        // Ensure orders is an array
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } else {
        // Set mock orders if API fails
        setOrders([
          {
            _id: "ORD001",
            user: { name: "John Doe" },
            items: [{ product: { name: "Parle-G" }, quantity: 2 }],
            totalAmount: 200,
            status: "pending",
            createdAt: "2025-10-06",
          },
          {
            _id: "ORD002",
            user: { name: "Jane Smith" },
            items: [{ product: { name: "Haldiram Bhujia" }, quantity: 1 }],
            totalAmount: 300,
            status: "shipped",
            createdAt: "2025-10-05",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      // Set mock orders on error
      setOrders([
        {
          _id: "ORD001",
          user: { name: "John Doe" },
          items: [{ product: { name: "Parle-G" }, quantity: 2 }],
          totalAmount: 200,
          status: "pending",
          createdAt: "2025-10-06",
        },
        {
          _id: "ORD002",
          user: { name: "Jane Smith" },
          items: [{ product: { name: "Haldiram Bhujia" }, quantity: 1 }],
          totalAmount: 300,
          status: "shipped",
          createdAt: "2025-10-05",
        },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      id: editingProduct ? formData.id : `PROD-${Date.now()}`,
      name: formData.name,
      image: formData.image,
      mrp: Number(formData.mrp),
      stock: Number(formData.stock),
      category: formData.category,
      brand: formData.brand,
      type: formData.type,
      description: formData.description,
    };

    try {
      const url = editingProduct
        ? `${import.meta.env.VITE_URL_API}/products/${editingProduct.id}`
        : `${import.meta.env.VITE_URL_API}/products`;

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert(editingProduct ? "Product updated!" : "Product added!");
        fetchProducts();
        resetForm();
      } else {
        alert("Failed to save product");
      }
    } catch (error) {
      alert("Error saving product");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      image: "",
      mrp: 0,
      stock: 0,
      category: "",
      brand: "",
      description: "",
      type: "regional-brands",
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const handleEdit = (product) => {
    setFormData({
      id: product.id,
      name: product.name,
      image: product.image,
      mrp: product.mrp,
      stock: product.stock,
      category: product.category,
      brand: product.brand,
      type: product.type || "regional-brands",
      description: product.description || "",
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_API}/products/${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        alert("Product deleted!");
        fetchProducts();
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product");
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_API}/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        alert("Order status updated!");
        fetchOrders();
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === "All" || product.category === categoryFilter)
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const downloadReport = () => {
    alert("Downloading report...");
    // Implement report download logic here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and admin
  if (!user || !token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Please login to access admin panel
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Access Denied: Admin privileges required
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8">
            {[
              "dashboard",
              "products",
              "orders",
              "payments",
              "offers",
              "messages",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (activeTab === "offers") {
                    navigate("/offers");
                  }
                  setActiveTab(tab);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Overview */}
        {activeTab === "dashboard" && (
          <div className="px-4 py-6">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics?.users?.totalUsers || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{analytics?.revenue?.totalRevenue || 0}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics?.orders?.totalOrders || 0}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics?.orders?.pendingOrders || 0}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics?.products?.totalProducts || 0}
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-sm text-gray-600">Total Brands</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {analytics?.products?.totalBrands || 0}
                  </p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                  <p className="text-sm text-gray-600">Total Categories</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {analytics?.products?.totalCategories || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            {analytics?.products?.lowStock?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-red-600">
                  ⚠️ Low Stock Alert
                </h2>
                <div className="space-y-2">
                  {analytics.products.lowStock.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                    >
                      <span className="font-medium">{product.name}</span>
                      <span className="font-bold text-red-600">
                        {product.stock} units left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Management */}
        {activeTab === "products" && <ProductManagement />}

        {/* Order Management */}
        {activeTab === "orders" && (
          <div className="px-4 py-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Order Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Order ID
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        User
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Items
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Total
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Status
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-sm text-gray-600">
                          {order._id?.slice(-6) || "N/A"}
                        </td>
                        <td className="p-3 text-gray-900">
                          {order.user?.name || "N/A"}
                        </td>
                        <td className="p-3 text-gray-600">
                          {order.items?.length || 0}
                        </td>
                        <td className="p-3 text-gray-900">
                          ₹{order.totalAmount}
                        </td>
                        <td className="p-3">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleOrderStatusUpdate(order._id, e.target.value)
                            }
                            className="p-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payments & Reports */}
        {activeTab === "payments" && (
          <div className="px-4 py-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Payments & Reports</h2>
              <div className="mb-6">
                <p className="text-lg font-bold text-gray-900">
                  Total Earnings: ₹
                  {payouts.reduce((sum, p) => sum + p.amount, 0)}
                </p>
              </div>
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Payout ID
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Date
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Amount
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-900">{payout.id}</td>
                        <td className="p-3 text-gray-600">{payout.date}</td>
                        <td className="p-3 text-gray-900">₹{payout.amount}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payout.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {payout.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={downloadReport}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors"
              >
                <Download size={18} /> Download Report
              </button>
            </div>
          </div>
        )}

        {/* Offers & Coupons */}
        {activeTab === "offers" && (
          <div className="px-4 py-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Offers & Coupons</h2>
                <button
                  onClick={() => alert("Add new offer form here")}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors"
                >
                  <Plus size={18} /> Add Offer
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Code
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Discount
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Status
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-gray-500">
                        Expiry
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {offers.map((offer) => (
                      <tr key={offer.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-gray-900">
                          {offer.code}
                        </td>
                        <td className="p-3 text-gray-600">{offer.discount}%</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              offer.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {offer.active ? "Active" : "Expired"}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">{offer.expiry}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Messages / Support */}
        {activeTab === "messages" && (
          <div className="px-4 py-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Messages / Support</h2>
                <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center gap-2 transition-colors">
                  <MessageSquare size={18} /> New Message
                </button>
              </div>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="text-gray-900">
                      <strong>{msg.from}:</strong> {msg.content}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{msg.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {editingProduct ? "Edit" : "Add"} Product
                </h3>
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    placeholder="Product ID (auto-generated if empty)"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Product Name"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    placeholder="Image URL"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) =>
                      setFormData({ ...formData, mrp: Number(e.target.value) })
                    }
                    placeholder="MRP"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: Number(e.target.value),
                      })
                    }
                    placeholder="Stock"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="Category"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    placeholder="Brand"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high-margin">High Margin</option>
                    <option value="regional-brands">Regional Brands</option>
                  </select>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 p-2 border rounded text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Save size={18} /> {editingProduct ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
