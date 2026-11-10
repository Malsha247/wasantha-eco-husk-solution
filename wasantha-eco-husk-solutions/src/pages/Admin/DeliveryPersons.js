import API_BASE_URL from "../../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useToast } from "../../contexts/ToastContext";
import { ArrowLeft, UserPlus } from "lucide-react";
import "../../Styles/AdminStyle/DeliveryPersons.css";

export default function DeliveryPersons() {
  const { t } = usePreferences();
  const showToast = useToast();
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const BASE_SALARY = 25000;
  const PER_DELIVERY = 100;

  /* ================= LOAD ================= */
  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/delivery/getAll.php`
      );
      const data = await res.json();
      setList(data.data || []);
    } catch {
      setMessage(t("Failed to load delivery persons"));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  /* ================= CREATE ================= */
  const submit = async () => {
    if (!form.name || !form.email || !form.password) {
      setMessage(t("Name, Email and Password are required"));
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/delivery/create.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (data.success) {
        setMessage(t("Delivery person registered successfully"));
        setForm({ name: "", email: "", phone: "", password: "" });
        load();
      } else {
        setMessage(data.message || t("Registration failed"));
      }
    } catch {
      setMessage(t("Server error"));
    } finally {
      setLoading(false);
    }
  };

  /* ================= PAY SALARY ================= */
  const paySalary = async (deliveryPersonId) => {
    if (!window.confirm(t("Confirm salary payment for this month?"))) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/delivery/paySalary.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delivery_person_id: deliveryPersonId }),
        }
      );

      const data = await res.json();
      alert(data.message);

      if (data.success) {
        setList((prev) =>
          prev.map((d) =>
            d.id === deliveryPersonId
              ? { ...d, paid_delivery_count: d.delivery_count }
              : d
          )
        );
      }
    } catch {
      alert(t("Salary payment failed"));
    }
  };

  /* ================= DELETE (NEW) ================= */
  const deleteDeliveryPerson = async (id) => {
    if (!window.confirm(t("Are you sure you want to delete this delivery person?")))
      return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/delivery/delete.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setList((prev) => prev.filter((d) => d.id !== id));
        showToast(t("Delivery person deleted successfully"));
      } else {
        showToast(data.message || t("Delete failed"), "error");
      }
    } catch {
      showToast(t("Server error while deleting"), "error");
    }
  };

  return (
    <div className="delivery-persons">
      <button
        className="delivery-persons-back"
        onClick={() => navigate("/admin/dashboard")}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        {t("Back to Admin Dashboard")}
      </button>

      <div className="delivery-persons-heading">
        <div className="delivery-persons-heading-icon">
          <UserPlus size={23} aria-hidden="true" />
        </div>
        <div>
          <h1>{t("Delivery Persons Management")}</h1>
          <p>{t("Create and manage delivery person accounts.")}</p>
        </div>
      </div>

      {message && (
        <p className="delivery-persons-message" role="status">
          {message}
        </p>
      )}

      <form
        className="delivery-persons-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="delivery-persons-form-heading">
          <h2>{t("Create Delivery Person")}</h2>
          <p>{t("Enter the account details for the new delivery person.")}</p>
        </div>
        <div className="delivery-persons-fields">
          <label className="delivery-persons-field">
            <span>{t("Full Name")}</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
              required
            />
          </label>
          <label className="delivery-persons-field">
            <span>{t("Email")}</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
          </label>
          <label className="delivery-persons-field">
            <span>{t("Phone")}</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              autoComplete="tel"
            />
          </label>
          <label className="delivery-persons-field">
            <span>{t("Temporary Password")}</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              required
            />
          </label>
        </div>
        <div className="delivery-persons-form-actions">
          <button
            className="delivery-persons-submit"
            type="submit"
            disabled={loading}
          >
            <UserPlus size={17} aria-hidden="true" />
            {loading ? t("Creating...") : t("Create Delivery Person")}
          </button>
        </div>
      </form>

      <section className="delivery-persons-list">
        <div className="delivery-persons-list-heading">
          <h2>{t("Registered Delivery Persons")}</h2>
          <span>{list.length}</span>
        </div>

        {list.length === 0 ? (
          <p className="delivery-persons-empty">
            {t("No delivery persons found")}
          </p>
        ) : (
          <div className="delivery-persons-grid">
            {list.map((d) => {
              const unpaidDeliveries =
                (d.delivery_count || 0) - (d.paid_delivery_count || 0);

              const salary =
                unpaidDeliveries > 0
                  ? BASE_SALARY + unpaidDeliveries * PER_DELIVERY
                  : 0;

              return (
                <article className="delivery-person-card" key={d.id}>
                  <div className="delivery-person-details">
                    <strong>{d.name}</strong>
                    <span>{d.email}</span>
                  </div>

                  <div className="delivery-person-stats">
                    <span>
                      {t("Total Deliveries")}: <strong>{d.delivery_count}</strong>
                    </span>
                    <span>
                      {t("Unpaid Deliveries")}: <strong>{unpaidDeliveries}</strong>
                    </span>
                    <span>
                      {t("Salary")}:{" "}
                      <strong>Rs. {salary.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="delivery-person-actions">
                    <button
                      className="delivery-person-pay"
                      disabled={salary === 0}
                      onClick={() => paySalary(d.id)}
                    >
                      {t("Pay Salary")}
                    </button>
                    <button
                      className="delivery-person-delete"
                      onClick={() => deleteDeliveryPerson(d.id)}
                    >
                      {t("Delete")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
