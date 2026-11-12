import API_BASE_URL from "../config/api";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePreferences } from "../contexts/PreferencesContext";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "../Styles/Register.css";
import logo from "../assests/icon.png"; 

function Register() {
  const { t } = usePreferences();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const submitting = useRef(false);

  const navigate = useNavigate();


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 
  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = t("First name is required.");
    if (!formData.lastName.trim())
      newErrors.lastName = t("Last name is required.");

    if (!formData.email.trim()) newErrors.email = t("Email is required.");
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = t("Invalid email format.");

    if (!formData.password.trim()) newErrors.password = t("Password is required.");
    else if (formData.password.length < 8)
      newErrors.password = t("Password must be at least 8 characters long.");

    if (!formData.confirmPassword.trim())
      newErrors.confirmPassword = t("Please confirm your password.");
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t("Passwords do not match.");

    return newErrors;
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current || submitted) return;

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    submitting.current = true;
    setLoading(true);
    setApiError("");
    const controller = new AbortController();
    let requestTimedOut = false;
    const timeoutId = setTimeout(() => {
      requestTimedOut = true;
      controller.abort();
    }, 45000);

    try {
      const res = await fetch(
        `${API_BASE_URL}/register.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Registration server returned HTTP ${res.status}.`);
      }

      if (res.ok && data.success) {
        setSubmitted(true);
        setWelcomeEmailSent(data.email_sent !== false);
        setApiError("");
        setTimeout(() => navigate("/login"), 2000); 
      } else {
        setApiError(data.message || t("Registration failed. Try again."));
      }
    } catch (err) {
      console.error("Register error:", err);
      setApiError(
        requestTimedOut
          ? t("Registration is taking too long. Check whether your account was created, then try logging in.")
          : t("Could not connect to the registration server. Please try again.")
      );
    } finally {
      clearTimeout(timeoutId);
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        
        <div className="register-logo">
          <img src={logo} alt={t("Wasantha Eco Husk Logo")} />
        </div>

        <h2>{t("Create Your Account")}</h2>
        <p className="welcome-text">{t("Join Wasantha Eco Husk Solutions today")}</p>

        {submitted && (
          <div className="success-msg">
            {welcomeEmailSent
              ? t("Registration successful! Welcome email sent. Redirecting...")
              : t("Registration successful, but we could not send the welcome email. Redirecting...")}
          </div>
        )}
        {apiError && <div className="error-msg">{apiError}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="input-group">
            <FaUser className="icon" />
            <input
              type="text"
              name="firstName"
              placeholder={t("First Name")}
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          {errors.firstName && (
            <small className="error">{errors.firstName}</small>
          )}

         
          <div className="input-group">
            <FaUser className="icon" />
            <input
              type="text"
              name="lastName"
              placeholder={t("Last Name")}
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
          {errors.lastName && (
            <small className="error">{errors.lastName}</small>
          )}

          
          <div className="input-group">
            <FaEnvelope className="icon" />
            <input
              type="email"
              name="email"
              placeholder={t("Email")}
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && <small className="error">{errors.email}</small>}

          
          <div className="input-group password-group">
            <FaLock className="icon" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder={t("Password")}
              value={formData.password}
              onChange={handleChange}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.password && (
            <small className="error">{errors.password}</small>
          )}

         
          <div className="input-group password-group">
            <FaLock className="icon" />
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              placeholder={t("Confirm Password")}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.confirmPassword && (
            <small className="error">{errors.confirmPassword}</small>
          )}

          <button type="submit" className="btn-register" disabled={loading || submitted}>
            {loading ? t("Registering...") : t("Register")}
          </button>
        </form>

        <div className="extra-links">
          <p>
            {t("Already have an account?")}{" "}
            <Link to="/login" className="link-green">
              {t("Login Here")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
