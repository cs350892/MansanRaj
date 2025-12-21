import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import { formatPrice } from '../utils/pricing';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token, apiFetch } = useContext(AuthContext);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('=== FETCHING ORDERS ===');
      console.log('User from context:', user);
      console.log('Token from context:', token ? 'Present (' + token.substring(0, 20) + '...)' : 'Missing');
      console.log('localStorage user:', localStorage.getItem('user'));
      console.log('localStorage token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
      
      if (!user || !token) {
        console.warn('No user or token available');
        setError('Please login to view orders');
        setLoading(false);
        return;
      }
      
      const data = await apiFetch('/orders/my-orders');
      
      console.log('=== API RESPONSE ===');
      console.log('Success:', data.success);
      console.log('Count:', data.count);
      console.log('Orders array:', data.orders);
      
      if (data.orders && data.orders.length > 0) {
        console.log('First order sample:', JSON.stringify(data.orders[0], null, 2));
      } else {
        console.log('No orders returned from API');
      }
      
      setOrders(data.orders || []);
    } catch (err) {
      console.error('=== ERROR FETCHING ORDERS ===');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError(err.message || 'Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, token, apiFetch]);

  useEffect(() => {
    if (user && token) {
      fetchOrders();
    } else if (!user) {
      setLoading(false);
      setError('Please login to view your orders');
    }
  }, [user, token, fetchOrders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'placed': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-cyan-100 text-cyan-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="My Orders" showBackButton={true} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="My Orders" showBackButton={true} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="My Orders" showBackButton={true} />

      <div className="p-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h2>
            <p className="text-gray-500 text-center">Your order history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {order.orderId || `Order #${order._id?.slice(-8) || 'N/A'}`}
                    </h3>
                    {order.invoiceId && (
                      <p className="text-xs text-gray-500">
                        Invoice: {order.invoiceId}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.product?.image || item.image || '/placeholder.jpg'}
                          alt={item.product?.name || item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-sm">{item.product?.name || item.name}</p>
                          <p className="text-xs text-gray-600">
                            {item.quantity} × {formatPrice(item.pricePerUnit)}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">{formatPrice(item.subtotal)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3">
                  {order.subtotalAmount && order.subtotalAmount !== order.totalAmount && (
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-800">{formatPrice(order.subtotalAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                  {order.shippingAddress && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Delivered to: {order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Orders;