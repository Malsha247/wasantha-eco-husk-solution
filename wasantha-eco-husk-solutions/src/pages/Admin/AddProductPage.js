import API_BASE_URL from "../../config/api";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "../../contexts/PreferencesContext";
import { ArrowLeft, ImagePlus, PackagePlus } from "lucide-react";
import "../../Styles/AdminStyle/ProductManage.css";

const API_BASE =
  `${API_BASE_URL}/products`;

export default function AddProductPage() {
  const { t } = usePreferences();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        fd.append("name", form.name);
        fd.append("description", form.description);
        fd.append("price", form.price);
        fd.append("stock", form.stock);
        fd.append("category", form.category);

        const res = await fetch(`${API_BASE}/addProduct.php`, {
          method: "POST",
          body: fd,
        });
        const j = await res.json();
        if (j.success) {
          alert(t("Product added"));
          navigate("/admin/products");
        } else alert(j.message || t("Add failed"));
      } else {
        const res = await fetch(`${API_BASE}/addProduct.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            price: parseFloat(form.price || 0),
            stock: parseInt(form.stock || 0),
          }),
        });
        const j = await res.json();
        if (j.success) {
          alert(t("Product added"));
          navigate("/admin/products");
        } else alert(j.message || t("Add failed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("Error adding product"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-page">
      <button
        className="product-form-back"
        type="button"
        onClick={() => navigate("/admin/products")}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        {t("Back to Products")}
      </button>

      <div className="product-form-heading">
        <div className="product-form-heading-icon">
          <PackagePlus size={23} aria-hidden="true" />
        </div>
        <div>
          <h1>{t("Add Product")}</h1>
          <p>{t("Add a new product to your store inventory.")}</p>
        </div>
      </div>

      <form className="product-form-card" onSubmit={handleSubmit}>
        <div className="product-form-content">
          <section className="product-form-fields" aria-labelledby="product-info-title">
            <h2 id="product-info-title">{t("Product information")}</h2>
            <div className="product-form-grid">
              <label className="product-form-field">
                <span>{t("Name")}</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("e.g. Coconut Husk Chips")}
                  autoComplete="off"
                  required
                />
              </label>

              <label className="product-form-field">
                <span>{t("Category")}</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">{t("-- Select Category --")}</option>
                  <option value="chips">{t("Coconut Husk Chips")}</option>
                  <option value="By-products">{t("Chips By-Products")}</option>
                </select>
              </label>

              <label className="product-form-field">
                <span>{t("Price")} (Rs.)</span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder={t("e.g. 120")}
                  required
                />
              </label>

              <label className="product-form-field">
                <span>{t("Stock")}</span>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder={t("e.g. 25")}
                />
              </label>

              <label className="product-form-field product-form-field-wide">
                <span>{t("Description")}</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder={t("Describe the product and its uses")}
                />
              </label>
            </div>
          </section>

          <aside className="product-image-panel">
            <h2>{t("Product image")}</h2>
            <p>{t("A clear product photo helps customers recognize the item.")}</p>
            <div className="product-image-preview">
              {imagePreview ? (
                <img src={imagePreview} alt={t("Product preview")} />
              ) : (
                <div className="product-image-empty">
                  <ImagePlus size={30} aria-hidden="true" />
                  <span>{t("No image selected")}</span>
                </div>
              )}
            </div>
            <input
              className="product-image-input"
              id="product-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <label className="product-image-upload" htmlFor="product-image">
              <ImagePlus size={17} aria-hidden="true" />
              {imageFile ? t("Change image") : t("Choose image")}
            </label>
            <span className="product-image-hint">{t("Image (optional)")}</span>
          </aside>
        </div>

        <div className="product-form-actions">
          <button
            className="product-form-cancel"
            type="button"
            onClick={() => navigate("/admin/products")}
          >
            {t("Cancel")}
          </button>
          <button className="product-form-submit" type="submit" disabled={loading}>
            <PackagePlus size={17} aria-hidden="true" />
            {loading ? t("Saving...") : t("Save Product")}
          </button>
        </div>
      </form>
    </div>
  );
}
