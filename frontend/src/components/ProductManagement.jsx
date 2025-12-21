import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Search, Filter, Package, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const ProductManagement = () => {
  const { apiFetch } = useContext(AuthContext);
  
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    stockStatus: ''
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    image: '',
    mrp: '',
    margin: 20,
    category: '',
    brand: '',
    stock: '',
    description: '',
    type: 'high-margin'
  });

  // Load products from MongoDB
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        category: filters.category,
        brand: filters.brand,
        stockStatus: filters.stockStatus
      });
      
      const response = await apiFetch(`/products?${queryParams}`);
      
      if (response.success) {
        setProducts(response.products);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
      console.error('Load products error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load categories from MongoDB
  const loadCategories = async () => {
    try {
      const response = await apiFetch('/products/categories');
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Load categories error:', err);
    }
  };

  // Load brands from MongoDB
  const loadBrands = async () => {
    try {
      const response = await apiFetch('/products/brands');
      if (response.success) {
        setBrands(response.brands);
      }
    } catch (err) {
      console.error('Load brands error:', err);
    }
  };

  // Initial load and reload on filter/search changes
  useEffect(() => {
    loadProducts();
  }, [pagination.page, searchTerm, filters]);

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  // Handle form submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editMode) {
        // Update existing product
        const response = await apiFetch(`/products/${formData.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        
        if (response.success) {
          setSuccess('Product updated successfully!');
          setShowForm(false);
          resetForm();
          loadProducts(); // Reload to show updated data
        }
      } else {
        // Create new product
        const response = await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        
        if (response.success) {
          setSuccess('Product created successfully!');
          setShowForm(false);
          resetForm();
          loadProducts(); // Reload to show new product
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save product');
      console.error('Submit error:', err);
    }
  };

  // Handle delete
  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setError(null);
      const response = await apiFetch(`/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setSuccess('Product deleted successfully!');
        loadProducts(); // Reload products
      }
    } catch (err) {
      setError(err.message || 'Failed to delete product');
      console.error('Delete error:', err);
    }
  };

  // Handle edit
  const handleEdit = (product) => {
    setFormData({
      id: product.id,
      name: product.name,
      image: product.image,
      mrp: product.mrp,
      margin: product.pricingTiers[0]?.margin || 20,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      description: product.description || '',
      type: product.type
    });
    setEditMode(true);
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      image: '',
      mrp: '',
      margin: 20,
      category: '',
      brand: '',
      stock: '',
      description: '',
      type: 'high-margin'
    });
    setEditMode(false);
  };

  // Get stock status color and icon
  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { color: 'bg-gray-500', icon: <AlertCircle className="w-4 h-4" />, text: 'Out of Stock' };
    } else if (stock < 20) {
      return { color: 'bg-red-500', icon: <AlertTriangle className="w-4 h-4" />, text: 'Low Stock' };
    } else if (stock < 50) {
      return { color: 'bg-yellow-500', icon: <AlertTriangle className="w-4 h-4" />, text: 'Medium Stock' };
    } else {
      return { color: 'bg-green-500', icon: <CheckCircle className="w-4 h-4" />, text: 'In Stock' };
    }
  };

  // Calculate price preview
  const calculatePrice = () => {
    if (!formData.mrp || !formData.margin) return 0;
    return (formData.mrp * (100 - formData.margin) / 100).toFixed(2);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Product Management</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center justify-between">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-2xl px-4"
            >
              &times;
            </button>
          </div>
          {error.includes('Session expired') && (
            <div className="mt-2">
              <a 
                href="/login" 
                className="text-red-800 underline font-semibold"
              >
                Click here to login again
              </a>
            </div>
          )}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter className="w-5 h-5" />
          <span>Filters & Search</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              style={{ color: '#000000' }}
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            style={{ color: '#000000' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            style={{ color: '#000000' }}
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <select
            value={filters.stockStatus}
            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            style={{ color: '#000000' }}
          >
            <option value="">All Stock Levels</option>
            <option value="low">Low Stock (&lt;20)</option>
            <option value="medium">Medium Stock (20-49)</option>
            <option value="high">High Stock (50+)</option>
          </select>
        </div>
      </div>

      {/* Add/Edit Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4">
                {editMode ? 'Edit Product' : 'Add New Product'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., LAY001"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={editMode}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Lays Classic 52g"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Snacks"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Lays"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 20"
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Margin (%) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 20"
                      value={formData.margin}
                      onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                      required
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Product description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Price Preview */}
                {formData.mrp && formData.margin && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Price Preview:</p>
                    <p className="text-2xl font-bold text-blue-600">₹{calculatePrice()}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Base price for 1-20 units (Tiers auto-generated)
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {editMode ? 'Update Product' : 'Create Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No products found</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <img
                            src={product.image || 'https://via.placeholder.com/80'}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.brand}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">₹{product.mrp}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          ₹{product.pricingTiers[0]?.price || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${stockStatus.color}`}>
                            {stockStatus.icon}
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{products.length}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;