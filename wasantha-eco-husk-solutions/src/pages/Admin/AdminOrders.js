import API_BASE_URL from "../../config/api";
import React, { useCallback, useEffect, useState } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useToast } from "../../contexts/ToastContext";
import "../../Styles/AdminStyle/OrderManage.css";

export default function AdminOrders() {
  const { t } = usePreferences();
  const showToast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    `${API_BASE_URL}/orders`;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/getAllOrders.php`);
      const text = await res.text();

      try {
        const data = JSON.parse(text);
        if (data.success) setOrders(data.orders || []);
        else setOrders([]);
      } catch {
        console.error("Invalid JSON:", text);
        setOrders([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE}/updateOrderStatus.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status }),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.success) fetchOrders();
      else alert(data.message || t("Update failed"));
    } catch (err) {
      alert(t("Network error"));
    }
  };

 
  const deleteOrder = async (orderId) => {
    const confirmDelete = window.confirm(
      t("Are you sure you want to delete this order?")
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/deleteOrder.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.success) {
        showToast(t("Order deleted successfully"));
        fetchOrders();
      } else {
        showToast(data.message || t("Delete failed"), "error");
      }
    } catch {
      showToast(t("Network error"), "error");
    }
  };

  return (
    <div className="admin-orders">
      <h2>{t("Manage Orders")}</h2>

      {loading ? (
        <p className="admin-orders-message">{t("Loading...")}</p>
      ) : (
        <div className="admin-orders-table-wrap">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>{t("Order Number")}</th>
                <th>{t("Customer")}</th>
                <th>{t("Address")}</th>
                <th>{t("Total")}</th>
                <th>{t("Status")}</th>
                <th>{t("Change")}</th>
                <th>{t("Delete")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td className="admin-orders-empty" colSpan="7">
                    {t("No orders found.")}
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td className="admin-order-number">#{o.id}</td>
                    <td>{o.customer_name}</td>
                    <td className="admin-order-address">
                      {o.shipping_address || t("Not provided")}
                    </td>
                    <td className="admin-order-total">Rs. {o.total_price}</td>
                    <td>
                      <span
                        className={`admin-order-status admin-order-status--${String(
                          o.status || ""
                        ).toLowerCase()}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-order-status-select"
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                      >
                        <option value="Pending">{t("Pending")}</option>
                        <option value="Processing">{t("Processing")}</option>
                        <option value="Shipped">{t("Shipped")}</option>
                        <option value="Delivered">{t("Delivered")}</option>
                        <option value="Canceled">{t("Canceled")}</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="admin-order-delete"
                        onClick={() => deleteOrder(o.id)}
                      >
                        {t("Delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
