import { useState, useRef, useEffect } from "react";

const SETS = [];
for (let y = 2024; y >= 1970; y--) SETS.push(String(y));

const STATES_NG = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara"
];

const TOTAL_STEPS = 5;
const stepTitles = ["Personal", "Location", "Work", "Payment", "Social"];
const stepIcons = ["👤", "📍", "💼", "💳", "🌐"];

const initialForm = {
  firstName: "", lastName: "", middleName: "", email: "", phone: "", gender: "",
  setYear: "2016", address: "", city: "", state: "", country: "Nigeria",
  occupation: "", company: "", photo: null, photoPreview: null,
  paymentProof: null, paymentProofPreview: null, paymentProofName: "",
  facebook: "", linkedin: "", twitter: "", instagram: "",
  achievements: "", interests: "", message: ""
};

// ⚠️ PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL BELOW (see setup guide)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyvG8vqIiwrhV82cgzQ60bZLMQ9aJbKByNtaS9dev1Ev1Bnkrj4iOzhBQ-MNzt6ZA/exec";

// Bank details
const BANK = { name: "Access Bank", accountName: "Abdullahi Ahmad", accountNumber: "0098370178", dues: "500" };

// Image compression utility
const compressImage = (file, callback, quality = 0.7, maxWidth = 800, maxHeight = 600) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() });
        callback(compressedFile, canvas.toDataURL("image/jpeg", quality));
      }, "image/jpeg", quality);
    };
  };
};

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [animate, setAnimate] = useState(true);
  const [copied, setCopied] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [autoSaving, setAutoSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const fileRef = useRef();
  const proofRef = useRef();
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 400);
    return () => clearTimeout(t);
  }, [step]);

  // Show toast notification
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  // Auto-save form to localStorage
  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    if (unsavedChanges) {
      autoSaveTimer.current = setTimeout(() => {
        setAutoSaving(true);
        localStorage.setItem("lobForm", JSON.stringify(form));
        setAutoSaving(false);
        setUnsavedChanges(false);
      }, 2000);
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [unsavedChanges, form]);

  // Load form from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("lobForm");
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved form", e);
      }
    }
  }, []);

  const set = (field) => (e) => {
    let value = e.target.value;
    // Email sanitization
    if (field === "email") value = value.trim();
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
    setUnsavedChanges(true);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image must be smaller than 5MB", "error");
        return;
      }
      compressImage(file, (compressedFile, preview) => {
        setForm((f) => ({ ...f, photo: compressedFile, photoPreview: preview }));
        setUnsavedChanges(true);
        showToast("Photo uploaded and compressed", "success");
      });
    }
  };

  const handleProof = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("Receipt image must be smaller than 10MB", "error");
        return;
      }
      compressImage(file, (compressedFile, preview) => {
        setForm((f) => ({ ...f, paymentProof: compressedFile, paymentProofPreview: preview, paymentProofName: file.name }));
        setErrors((er) => ({ ...er, paymentProof: undefined }));
        setUnsavedChanges(true);
        showToast("Receipt uploaded and compressed", "success");
      }, 0.8);
    }
  };

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    });
  };

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.firstName.trim()) e.firstName = "Required";
      if (!form.lastName.trim()) e.lastName = "Required";
      if (!form.email.trim()) e.email = "Required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
      if (!form.phone.trim()) e.phone = "Required";
      if (!form.gender) e.gender = "Required";
    }
    if (step === 1) {
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim()) e.city = "Required";
      if (!form.state) e.state = "Required";
    }
    if (step === 3) {
      if (!form.paymentProofPreview) e.paymentProof = "Please upload your proof of payment";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!validate()) {
      showToast("Please fill all required fields", "error");
      return;
    }
    if (submitting) return; // Prevent duplicate submissions
    setSubmitting(true);
    setSubmitError("");

    const payload = {
      timestamp: new Date().toLocaleString(),
      firstName: form.firstName,
      lastName: form.lastName,
      middleName: form.middleName,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      setYear: form.setYear,
      address: form.address,
      city: form.city,
      state: form.state,
      country: form.country,
      occupation: form.occupation,
      company: form.company,
      achievements: form.achievements,
      interests: form.interests,
      paymentProof: form.paymentProofPreview || "",
      paymentProofName: form.paymentProofName || "",
      facebook: form.facebook,
      linkedin: form.linkedin,
      twitter: form.twitter,
      instagram: form.instagram,
      message: form.message,
    };

    try {
      if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
        await new Promise((r) => setTimeout(r, 1500));
      } else {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setSubmitted(true);
      localStorage.removeItem("lobForm");
      showToast("Registration submitted successfully!", "success");
    } catch (err) {
      const errorMsg = "Submission failed. Please check your internet and try again.";
      setSubmitError(errorMsg);
      showToast(errorMsg, "error", 5000);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <h1 style={styles.successTitle}>Registration Successful!</h1>
          <p style={styles.successText}>
            Thank You , <strong>{form.firstName} {form.lastName}</strong>!<br />
            You're registered as a proud old boy of<br />
            <strong>Science Secondary School, Lautai Gumel</strong> — Set of {form.setYear}.
          </p>
          <p style={{ ...styles.successText, opacity: 0.7, fontSize: 14, marginTop: 8 }}>
            Your payment proof has been received and will be verified shortly.<br />
            A confirmation will be sent to <strong>{form.email}</strong>.
          </p>
          <button style={styles.btnPrimary} onClick={() => { setSubmitted(false); setForm(initialForm); setStep(0); }}>
            Register Another Member
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageOverlay} />
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          ...styles.toast,
          background: toast.type === "error" ? "#c0392b" : "#27ae60",
        }}>
          <span style={{ marginRight: 10 }}>{toast.type === "error" ? "❌" : "✅"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Auto-save Indicator */}
      {autoSaving && (
        <div style={styles.autoSaveIndicator}>💾 Saving...</div>
      )}

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.logoContainer}>
            <img src="/logo.jpeg" alt="School Logo" style={styles.logo} />
          </div>
        </div>
        <h1 style={styles.schoolName}>Science Secondary School</h1>
        <p style={styles.schoolSub}>Lautai, Gumel — Old Boys Registration Form 2016 Graduate</p>
      </header>

      {/* Stepper */}
      <div style={styles.stepper}>
        {stepTitles.map((t, i) => (
          <div key={i} style={styles.stepItem} onClick={() => { if (i < step) setStep(i); }}>
            <div style={{
              ...styles.stepCircle,
              ...(i === step ? styles.stepActive : {}),
              ...(i < step ? styles.stepDone : {}),
            }}>
              {i < step ? "✓" : stepIcons[i]}
            </div>
            <span style={{
              ...styles.stepLabel,
              fontWeight: i === step ? 700 : 400,
              color: i <= step ? "#1a3a2a" : "#999",
            }}>{t}</span>
          </div>
        ))}
        <div style={styles.stepLine}>
          <div style={{ ...styles.stepLineInner, width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Form Card */}
      <div style={{ ...styles.card, opacity: animate ? 0 : 1, transform: animate ? "translateY(16px)" : "none", transition: "all 0.4s ease" }}>

        {/* Step 0: Personal */}
        {step === 0 && (
          <>
            <h2 style={styles.sectionTitle}>Personal Information</h2>
            <div style={styles.row}>
              <Field label="First Name *" value={form.firstName} onChange={set("firstName")} error={errors.firstName} placeholder="e.g. Abdullahi" aria-required="true" />
              <Field label="Last Name *" value={form.lastName} onChange={set("lastName")} error={errors.lastName} placeholder="e.g. Bello" aria-required="true" />
            </div>
            <Field label="Middle Name" value={form.middleName} onChange={set("middleName")} placeholder="Optional" />
            <div style={styles.row}>
              <Field label="Email Address *" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="you@email.com" aria-required="true" />
              <Field label="Phone Number *" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="+234..." aria-required="true" />
            </div>
            <div style={styles.row}>
              <SelectField label="Gender *" value={form.gender} onChange={set("gender")} error={errors.gender} options={["Male", "Female"]} placeholder="Select gender" aria-required="true" />
            </div>
            <label style={styles.label}>Passport Photo</label>
            <div style={styles.photoRow} onClick={() => fileRef.current?.click()}>
              {form.photoPreview ? (
                <img src={form.photoPreview} alt="preview" style={styles.photoPreview} />
              ) : (
                <div style={styles.photoPlaceholder}>
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span style={{ fontSize: 13, color: "#888" }}>Click to upload</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
            </div>
          </>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <>
            <h2 style={styles.sectionTitle}>Contact & Location</h2>
            <Field label="Residential Address *" value={form.address} onChange={set("address")} error={errors.address} placeholder="House / Street" />
            <div style={styles.row}>
              <Field label="City *" value={form.city} onChange={set("city")} error={errors.city} placeholder="e.g. Gumel" aria-required="true" />
              <SelectField label="State *" value={form.state} onChange={set("state")} error={errors.state} options={STATES_NG} placeholder="Select state" aria-required="true" />
            </div>
            <Field label="Country" value={form.country} onChange={set("country")} placeholder="Nigeria" />
          </>
        )}

        {/* Step 2: Work */}
        {step === 2 && (
          <>
            <h2 style={styles.sectionTitle}>Professional Details</h2>
            <div style={styles.row}>
              <Field label="Occupation" value={form.occupation} onChange={set("occupation")} placeholder="e.g. Engineer, Teacher" />
              <Field label="Organisation / Company" value={form.company} onChange={set("company")} placeholder="e.g. NNPC" />
            </div>
            <label style={styles.label}>Notable Achievements</label>
            <textarea style={styles.textarea} value={form.achievements} onChange={set("achievements")} placeholder="Awards, positions, contributions..." rows={3} />
            <label style={styles.label}>Interests / Hobbies</label>
            <textarea style={styles.textarea} value={form.interests} onChange={set("interests")} placeholder="Football, reading, community service..." rows={2} />
          </>
        )}

        {/* Step 3: PAYMENT */}
        {step === 3 && (
          <>
            <h2 style={styles.sectionTitle}>Dues Payment</h2>

            {/* Dues Amount Banner */}
            <div style={styles.duesBox}>
              <span style={styles.duesLabel}>Registration Dues</span>
              <span style={styles.duesAmount}>₦{Number(BANK.dues).toLocaleString()}</span>
            </div>

            {/* Bank Details Card */}
            <div style={styles.bankCard}>
              <div style={styles.bankHeader}>
                <span style={{ fontSize: 22 }}>🏦</span>
                <span style={styles.bankTitle}>Transfer to this account</span>
              </div>
              <div style={styles.bankRow}>
                <span style={styles.bankLabel}>Bank Name</span>
                <div style={styles.bankValueRow}>
                  <span style={styles.bankValue}>{BANK.name}</span>
                </div>
              </div>
              <div style={styles.bankDivider} />
              <div style={styles.bankRow}>
                <span style={styles.bankLabel}>Account Name</span>
                <div style={styles.bankValueRow}>
                  <span style={styles.bankValue}>{BANK.accountName}</span>
                </div>
              </div>
              <div style={styles.bankDivider} />
              <div style={styles.bankRow}>
                <span style={styles.bankLabel}>Account Number</span>
                <div style={styles.bankValueRow}>
                  <span style={{ ...styles.bankValue, fontFamily: "'Courier New', monospace", fontSize: 20, letterSpacing: 2 }}>{BANK.accountNumber}</span>
                  <button
                    style={{ ...styles.copyBtn, color: copied === "acct" ? "#27ae60" : "#d4af37" }}
                    onClick={() => copyText(BANK.accountNumber, "acct")}
                  >
                    {copied === "acct" ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>
              <div style={styles.bankDivider} />
              <div style={styles.bankRow}>
                <span style={styles.bankLabel}>Amount to Pay</span>
                <div style={styles.bankValueRow}>
                  <span style={{ ...styles.bankValue, color: "#d4af37", fontWeight: 800 }}>₦{Number(BANK.dues).toLocaleString()}.00</span>
                  <button
                    style={{ ...styles.copyBtn, color: copied === "amt" ? "#27ae60" : "#d4af37" }}
                    onClick={() => copyText(BANK.dues, "amt")}
                  >
                    {copied === "amt" ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <p style={styles.payNote}>
              After making the transfer, please upload a screenshot or photo of your payment receipt below.
            </p>

            {/* Proof of Payment Upload */}
            <label style={styles.label}>Proof of Payment *</label>
            <div
              style={{
                ...styles.proofUpload,
                borderColor: errors.paymentProof ? "#c0392b" : form.paymentProofPreview ? "#27ae60" : "#b8c8be",
                background: errors.paymentProof ? "#fdf2f2" : form.paymentProofPreview ? "#f0faf4" : "#f5f8f6",
              }}
              onClick={() => proofRef.current?.click()}
            >
              {form.paymentProofPreview ? (
                <div style={styles.proofDone}>
                  <img src={form.paymentProofPreview} alt="proof" style={styles.proofThumb} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a3a2a" }}>✅ Proof uploaded</div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{form.paymentProofName}</div>
                    <div style={{ fontSize: 12, color: "#d4af37", marginTop: 4, cursor: "pointer" }}>Tap to change</div>
                  </div>
                </div>
              ) : (
                <div style={styles.proofEmpty}>
                  <span style={{ fontSize: 36 }}>📤</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#3a5a4a" }}>Upload Payment Receipt</span>
                  <span style={{ fontSize: 12, color: "#888" }}>Screenshot, photo, or bank slip</span>
                </div>
              )}
              <input ref={proofRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleProof} />
            </div>
            {errors.paymentProof && <span style={styles.errText}>{errors.paymentProof}</span>}
          </>
        )}

        {/* Step 4: Social */}
        {step === 4 && (
          <>
            <h2 style={styles.sectionTitle}>Social & Final Info</h2>
            <div style={styles.row}>
              <Field label="Facebook" value={form.facebook} onChange={set("facebook")} placeholder="facebook.com/yourname" />
              <Field label="LinkedIn" value={form.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/yourname" />
            </div>
            <div style={styles.row}>
              <Field label="Twitter / X" value={form.twitter} onChange={set("twitter")} placeholder="@handle" />
              <Field label="Instagram" value={form.instagram} onChange={set("instagram")} placeholder="@handle" />
            </div>
            <label style={styles.label}>Message to Fellow Old Boys</label>
            <textarea style={styles.textarea} value={form.message} onChange={set("message")} placeholder="Say something to the community..." rows={3} />
          </>
        )}

        {/* Navigation */}
        <div style={styles.nav}>
          {step > 0 && (
            <button style={styles.btnSecondary} onClick={prev} aria-label="Go to previous step">← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {unsavedChanges && <span style={styles.unsavedIndicator} title="Unsaved changes">●</span>}
          {step < TOTAL_STEPS - 1 ? (
            <button style={styles.btnPrimary} onClick={next} aria-label={`Go to ${stepTitles[step + 1]} step`}>Continue →</button>
          ) : (
            <button 
              style={{ ...styles.btnSubmit, opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }} 
              onClick={submit} 
              disabled={submitting}
              aria-label="Submit registration"
              aria-busy={submitting}
            >
              {submitting ? "🔄 Submitting..." : "✓ Submit Registration"}
            </button>
          )}
        </div>
        {submitError && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 10, fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", fontWeight: 500 }}>{submitError}</p>}
      </div>

      <footer style={styles.footer}>
        © {new Date().getFullYear()} Science Secondary School Old Boys Association, Lautai Gumel
      </footer>
    </div>
  );
}

function Field({ label, value, onChange, error, placeholder, type = "text", ...props }) {
  const inputId = `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <label htmlFor={inputId} style={styles.label}>{label}</label>
      <input
        id={inputId}
        type={type}
        style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && <span id={`${inputId}-error`} style={styles.errText} role="alert">{error}</span>}
    </div>
  );
}

function SelectField({ label, value, onChange, error, options, placeholder, ...props }) {
  const selectId = `select-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <label htmlFor={selectId} style={styles.label}>{label}</label>
      <select 
        id={selectId}
        style={{ ...styles.input, ...styles.select, ...(error ? styles.inputError : {}), color: value ? "#1a3a2a" : "#999" }} 
        value={value} 
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <span id={`${selectId}-error`} style={styles.errText} role="alert">{error}</span>}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e8eef5 50%, #f0f4f8 100%)",
    fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica', 'Arial', 'sans-serif'",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "24px 16px 40px",
    position: "relative",
    overflow: "hidden",
  },
  pageOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(26, 60, 42, 0.05) 0%, transparent 50%)`,
    pointerEvents: "none",
  },
  toast: {
    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
    padding: "14px 24px", borderRadius: 12, color: "white",
    display: "flex", alignItems: "center", zIndex: 9999,
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", fontSize: 14, fontWeight: 600,
    animation: "slideDown 0.3s ease",
  },
  autoSaveIndicator: {
    position: "fixed", bottom: 20, right: 20, padding: "10px 16px",
    background: "rgba(46, 125, 50, 0.9)", color: "white",
    borderRadius: 8, fontSize: 12, fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'",
    zIndex: 9998, fontWeight: 600,
  },
  headerTop: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 16, width: "100%", position: "relative", zIndex: 1,
  },
  header: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 28, textAlign: "center", position: "relative", zIndex: 1 },
  logoContainer: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 140, height: 140, background: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20, padding: 12, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    border: "2px solid rgba(212, 175, 55, 0.3)", marginBottom: 16, backdropFilter: "blur(10px)",
  },
  logo: {
    maxWidth: "100%", height: "auto", maxHeight: "100%",
    objectFit: "contain",
  },
  crest: {
    fontSize: 48, width: 72, height: 72, background: "rgba(255,255,255,0.12)",
    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid rgba(212,175,55,0.5)", flexShrink: 0,
  },
  schoolName: {
    fontFamily: "'Playfair Display', 'Georgia', 'serif'", fontSize: 28, fontWeight: 800,
    color: "#1a3a2a", margin: 0, letterSpacing: 0.3, lineHeight: 1.3,
  },
  schoolSub: {
    fontSize: 13, color: "#5a7a6a", margin: "10px 0 0",
    fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 500,
  },
  stepper: {
    display: "flex", justifyContent: "center", gap: 14, marginBottom: 24,
    position: "relative", padding: "0 4px", flexWrap: "wrap", zIndex: 1,
  },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, zIndex: 1, cursor: "pointer" },
  stepCircle: {
    width: 36, height: 36, borderRadius: "50%", background: "rgba(212,175,55,0.1)",
    border: "2px solid #d4af37", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 15, color: "#1a3a2a", transition: "all 0.3s",
  },
  stepActive: { background: "#d4af37", border: "2px solid #d4af37", color: "#1a3a2a", boxShadow: "0 0 18px rgba(212,175,55,0.4)" },
  stepDone: { background: "rgba(212,175,55,0.2)", border: "2px solid #d4af37", color: "#d4af37" },
  stepLabel: { fontSize: 9, color: "#3a5a4a", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 },
  stepLine: { position: "absolute", top: 18, left: "8%", right: "8%", height: 2, background: "rgba(212,175,55,0.2)", zIndex: 0 },
  stepLineInner: { height: "100%", background: "#d4af37", transition: "width 0.5s ease", borderRadius: 2 },
  card: {
    width: "100%", maxWidth: 580, background: "rgba(255,255,255,0.99)",
    borderRadius: 18, padding: "42px 36px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)", transition: "all 0.4s ease", position: "relative", zIndex: 1,
    border: "1px solid rgba(212, 175, 55, 0.15)",
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', 'Georgia', 'serif'", fontSize: 24, fontWeight: 700,
    color: "#1a3a2a", marginBottom: 24, paddingBottom: 16, borderBottom: "2.5px solid #d4af37", letterSpacing: 0.2,
  },
  row: { display: "flex", gap: 18, flexWrap: "wrap" },
  label: {
    display: "block", fontSize: 11, fontWeight: 700, color: "#1a3a2a", marginTop: 18, marginBottom: 8,
    fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", textTransform: "uppercase", letterSpacing: 1, fontStyle: "normal",
  },
  input: {
    width: "100%", padding: "13px 16px", border: "1.5px solid #d0d8d3", borderRadius: 10,
    fontSize: 15, fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", color: "#1a3a2a",
    background: "#f9fafb", outline: "none", transition: "all 0.3s ease", boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)", fontWeight: 500, lineHeight: 1.5,
  },
  inputError: { borderColor: "#c0392b", background: "#fdf2f2" },
  select: {
    appearance: "none", cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231a3a2a' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center", paddingRight: 36,
  },
  textarea: {
    width: "100%", padding: "13px 16px", border: "1.5px solid #d0d8d3", borderRadius: 10,
    fontSize: 15, fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", color: "#1a3a2a",
    background: "#f9fafb", outline: "none", resize: "vertical", boxSizing: "border-box",
    transition: "all 0.3s ease", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)", fontWeight: 500, lineHeight: 1.6,
  },
  errText: { fontSize: 12, color: "#c0392b", marginTop: 5, display: "block", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", fontWeight: 500 },
  photoRow: { display: "inline-flex", cursor: "pointer", marginTop: 4 },
  photoPlaceholder: {
    width: 110, height: 120, background: "#f0f3f2", border: "2px dashed #c8d5d0",
    borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
    transition: "all 0.3s ease",
  },
  photoPreview: { width: 110, height: 120, objectFit: "cover", borderRadius: 12, border: "2px solid #d4af37", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },

  /* Payment styles */
  duesBox: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.05) 100%)", borderRadius: 14, padding: "22px 26px", marginBottom: 24,
    border: "1.5px solid rgba(212,175,55,0.25)",
  },
  duesLabel: { fontSize: 13, color: "#1a3a2a", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2 },
  duesAmount: { fontSize: 36, fontWeight: 800, color: "#d4af37", fontFamily: "'Playfair Display', 'Georgia', 'serif'", letterSpacing: -0.5 },
  bankCard: { border: "1.5px solid #d0d8d3", borderRadius: 14, padding: 24, background: "#fafbfc", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  bankHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  bankTitle: { fontSize: 16, fontWeight: 700, color: "#1a3a2a", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", letterSpacing: 0.3 },
  bankRow: { padding: "12px 0" },
  bankLabel: { fontSize: 11, color: "#888", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 4, fontWeight: 600 },
  bankValueRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  bankValue: { fontSize: 16, fontWeight: 700, color: "#1a3a2a", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'" },
  bankDivider: { height: 1, background: "#e8ede9" },
  copyBtn: {
    background: "rgba(212, 175, 55, 0.08)", border: "1px solid #d4af37", borderRadius: 8, padding: "6px 14px",
    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", transition: "all 0.2s",
    color: "#d4af37", letterSpacing: 0.3,
  },
  payNote: { fontSize: 14, color: "#5a7a6a", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", lineHeight: 1.7, margin: "16px 0 8px", fontWeight: 500 },
  proofUpload: { border: "2px dashed #c8d5d0", borderRadius: 14, padding: 24, cursor: "pointer", transition: "all 0.3s ease", marginTop: 8, background: "#fafbfc" },
  proofEmpty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 0" },
  proofDone: { display: "flex", alignItems: "center", gap: 18 },
  proofThumb: { width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "2px solid #27ae60", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },

  unsavedIndicator: {
    display: "inline-block", width: 8, height: 8, background: "#e67e22",
    borderRadius: "50%", marginRight: 8,
  },
  nav: { display: "flex", alignItems: "center", marginTop: 32, gap: 14 },
  btnPrimary: {
    padding: "14px 32px", background: "linear-gradient(135deg, #1a5c38, #14422a)",
    color: "#d4af37", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 10,
    cursor: "pointer", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", letterSpacing: 0.5, boxShadow: "0 4px 12px rgba(26, 60, 42, 0.2)",
    transition: "all 0.3s ease", lineHeight: 1.4,
  },
  btnSecondary: {
    padding: "14px 28px", background: "transparent", color: "#1a5c38", fontWeight: 600,
    fontSize: 14, border: "1.5px solid #1a5c38", borderRadius: 10, cursor: "pointer", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'",
    transition: "all 0.3s ease", letterSpacing: 0.2,
  },
  btnSubmit: {
    padding: "16px 36px", background: "linear-gradient(135deg, #d4af37, #b8942e)",
    color: "#1a3a2a", fontWeight: 800, fontSize: 16, border: "none", borderRadius: 10,
    cursor: "pointer", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", letterSpacing: 0.5, boxShadow: "0 6px 20px rgba(212,175,55,0.3)",
    transition: "all 0.3s ease", lineHeight: 1.4,
  },
  successCard: {
    maxWidth: 480, background: "rgba(255,255,255,0.99)", borderRadius: 20,
    padding: "56px 42px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", marginTop: 40, position: "relative", zIndex: 1,
    border: "1px solid rgba(212, 175, 55, 0.15)",
  },
  successIcon: { fontSize: 56, marginBottom: 12 },
  successTitle: { fontFamily: "'Playfair Display', 'Georgia', 'serif'", fontSize: 26, color: "#1a3a2a", margin: "0 0 12px", fontWeight: 700, letterSpacing: -0.3 },
  successText: { fontSize: 15, color: "#3a5a4a", lineHeight: 1.8, fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", fontWeight: 500 },
  footer: { marginTop: 32, fontSize: 12, color: "#5a7a6a", fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'", textAlign: "center", position: "relative", zIndex: 1, fontWeight: 500, letterSpacing: 0.2 },
};
