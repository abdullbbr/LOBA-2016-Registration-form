import { useState, useRef, useEffect } from "react";
import "./App.css";

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
const stepIcons = [
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
];

const initialForm = {
  firstName: "", lastName: "", middleName: "", email: "", phone: "", gender: "",
  setYear: "2016", address: "", city: "", state: "", country: "Nigeria",
  occupation: "", company: "", photo: null, photoPreview: null,
  paymentProof: null, paymentProofPreview: null, paymentProofName: "",
  facebook: "", linkedin: "", twitter: "", instagram: "",
  achievements: "", interests: "", message: ""
};

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyvG8vqIiwrhV82cgzQ60bZLMQ9aJbKByNtaS9dev1Ev1Bnkrj4iOzhBQ-MNzt6ZA/exec";

const BANK = { name: "Opay ", accountName: "Salisu Habibu Babura", accountNumber: "8039912121", dues: "500" };

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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [animKey, setAnimKey] = useState(0);
  const [copied, setCopied] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [autoSaving, setAutoSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const fileRef = useRef();
  const proofRef = useRef();
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [step]);

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

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

  useEffect(() => {
    const saved = localStorage.getItem("lobForm");
    if (saved) {
      try { setForm(JSON.parse(saved)); } catch (e) { console.error("Error loading saved form", e); }
    }
  }, []);

  const set = (field) => (e) => {
    let value = e.target.value;
    if (field === "email") value = value.trim();
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
    setUnsavedChanges(true);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { showToast("Image must be smaller than 5MB", "error"); return; }
      compressImage(file, (compressedFile, preview) => {
        setForm((f) => ({ ...f, photo: compressedFile, photoPreview: preview }));
        setUnsavedChanges(true);
        showToast("Photo uploaded successfully", "success");
      });
    }
  };

  const handleProof = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { showToast("Receipt must be smaller than 10MB", "error"); return; }
      compressImage(file, (compressedFile, preview) => {
        setForm((f) => ({ ...f, paymentProof: compressedFile, paymentProofPreview: preview, paymentProofName: file.name }));
        setErrors((er) => ({ ...er, paymentProof: undefined }));
        setUnsavedChanges(true);
        showToast("Receipt uploaded successfully", "success");
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
    if (!validate()) { showToast("Please fill all required fields", "error"); return; }
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");

    const payload = {
      timestamp: new Date().toLocaleString(),
      firstName: form.firstName, lastName: form.lastName, middleName: form.middleName,
      email: form.email, phone: form.phone, gender: form.gender, setYear: form.setYear,
      address: form.address, city: form.city, state: form.state, country: form.country,
      occupation: form.occupation, company: form.company,
      achievements: form.achievements, interests: form.interests,
      paymentProof: form.paymentProofPreview || "", paymentProofName: form.paymentProofName || "",
      facebook: form.facebook, linkedin: form.linkedin, twitter: form.twitter, instagram: form.instagram,
      message: form.message,
    };

    try {
      if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
        await new Promise((r) => setTimeout(r, 1500));
      } else {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST", mode: "no-cors",
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

  /* ─── SUCCESS SCREEN ─── */
  if (submitted) {
    return (
      <div style={S.page}>
        <div style={S.bgOrb1} />
        <div style={S.bgOrb2} />
        <div className="success-animate" style={S.successCard}>
          <div style={S.successIconWrap}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1 style={S.successTitle}>Registration Complete</h1>
          <p style={S.successText}>
            Thank you, <strong style={{ color: "#c9a84c" }}>{form.firstName} {form.lastName}</strong>.<br />
            You're registered as a proud old boy of<br />
            <strong>Science Secondary School, Lautai Gumel</strong> — Set of {form.setYear}.
          </p>
          <p style={{ ...S.successText, opacity: 0.5, fontSize: 13, marginTop: 12 }}>
            Your payment proof has been received and will be verified shortly.<br />
            A confirmation will be sent to <strong>{form.email}</strong>.
          </p>
          <button className="btn-primary" style={{ ...S.btnPrimary, marginTop: 28 }} onClick={() => { setSubmitted(false); setForm(initialForm); setStep(0); }}>
            Register Another Member
          </button>
        </div>
      </div>
    );
  }

  /* ─── MAIN FORM ─── */
  return (
    <div style={S.page}>
      <div style={S.bgOrb1} />
      <div style={S.bgOrb2} />

      {/* Toast */}
      {toast.show && (
        <div className="toast-animate" style={{
          ...S.toast,
          background: toast.type === "error"
            ? "linear-gradient(135deg, #dc2626, #b91c1c)"
            : "linear-gradient(135deg, #16a34a, #15803d)",
        }}>
          <span style={{ fontSize: 16, marginRight: 10 }}>{toast.type === "error" ? "\u2716" : "\u2714"}</span>
          {toast.message}
        </div>
      )}

      {/* Auto-save */}
      {autoSaving && <div style={S.autoSave}>Saving...</div>}

      {/* Header */}
      <header style={S.header}>
        <div style={S.logoWrap}>
          <img src="/logo.jpeg" alt="School Logo" style={S.logo} />
        </div>
        <h1 style={S.schoolName}>Science Secondary School</h1>
        <p style={S.schoolSub}>Lautai, Gumel &mdash; Old Boys Registration</p>
      </header>

      {/* Stepper */}
      <div style={S.stepper}>
        <div style={S.stepTrack}>
          <div style={{ ...S.stepTrackFill, width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }} />
        </div>
        {stepTitles.map((t, i) => (
          <div
            key={i}
            className="step-item"
            style={S.stepItem}
            onClick={() => { if (i < step) setStep(i); }}
          >
            <div className="step-circle" style={{
              ...S.stepCircle,
              ...(i < step ? S.stepDone : {}),
              ...(i === step ? S.stepActive : {}),
              ...(i > step ? S.stepFuture : {}),
            }}>
              {i < step ? <CheckIcon /> : stepIcons[i]}
            </div>
            <span style={{
              ...S.stepLabel,
              color: i === step ? "#c9a84c" : i < step ? "#888" : "#444",
              fontWeight: i === step ? 700 : 500,
            }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="card-animate" key={animKey} style={S.card}>

        {/* Step 0: Personal */}
        {step === 0 && (
          <>
            <h2 style={S.sectionTitle}>Personal Information</h2>
            <div style={S.row}>
              <Field label="First Name *" value={form.firstName} onChange={set("firstName")} error={errors.firstName} placeholder="e.g. Abdullahi" />
              <Field label="Last Name *" value={form.lastName} onChange={set("lastName")} error={errors.lastName} placeholder="e.g. Bello" />
            </div>
            <Field label="Middle Name" value={form.middleName} onChange={set("middleName")} placeholder="Optional" />
            <div style={S.row}>
              <Field label="Email Address *" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="you@email.com" />
              <Field label="Phone Number *" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="+234..." />
            </div>
            <div style={S.row}>
              <SelectField label="Gender *" value={form.gender} onChange={set("gender")} error={errors.gender} options={["Male", "Female"]} placeholder="Select gender" />
            </div>
            <label style={S.label}>Passport Photo</label>
            <div className="photo-upload" style={S.photoArea} onClick={() => fileRef.current?.click()}>
              {form.photoPreview ? (
                <img src={form.photoPreview} alt="preview" style={S.photoImg} />
              ) : (
                <div style={S.photoEmpty}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Click to upload</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
            </div>
          </>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <>
            <h2 style={S.sectionTitle}>Contact & Location</h2>
            <Field label="Residential Address *" value={form.address} onChange={set("address")} error={errors.address} placeholder="House / Street" />
            <div style={S.row}>
              <Field label="City *" value={form.city} onChange={set("city")} error={errors.city} placeholder="e.g. Gumel" />
              <SelectField label="State *" value={form.state} onChange={set("state")} error={errors.state} options={STATES_NG} placeholder="Select state" />
            </div>
            <Field label="Country" value={form.country} onChange={set("country")} placeholder="Nigeria" />
          </>
        )}

        {/* Step 2: Work */}
        {step === 2 && (
          <>
            <h2 style={S.sectionTitle}>Professional Details</h2>
            <div style={S.row}>
              <Field label="Occupation" value={form.occupation} onChange={set("occupation")} placeholder="e.g. Engineer, Teacher" />
              <Field label="Organisation / Company" value={form.company} onChange={set("company")} placeholder="e.g. NNPC" />
            </div>
            <label style={S.label}>Notable Achievements</label>
            <textarea className="modern-textarea" style={S.textarea} value={form.achievements} onChange={set("achievements")} placeholder="Awards, positions, contributions..." rows={3} />
            <label style={S.label}>Interests / Hobbies</label>
            <textarea className="modern-textarea" style={S.textarea} value={form.interests} onChange={set("interests")} placeholder="Football, reading, community service..." rows={2} />
          </>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <>
            <h2 style={S.sectionTitle}>Dues Payment</h2>

            <div style={S.duesBox}>
              <span style={S.duesLabel}>Registration Dues</span>
              <span style={S.duesAmount}>{"\u20A6"}{Number(BANK.dues).toLocaleString()}</span>
            </div>

            <div style={S.bankCard}>
              <div style={S.bankHeader}>
                <div style={S.bankIconWrap}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <span style={S.bankTitle}>Transfer to this account</span>
              </div>

              <BankRow label="Bank Name" value={BANK.name} />
              <BankRow label="Account Name" value={BANK.accountName} />
              <div style={S.bankRowWrap}>
                <span style={S.bankLabel}>Account Number</span>
                <div style={S.bankValueRow}>
                  <span style={{ ...S.bankValue, fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: 18, letterSpacing: 2 }}>{BANK.accountNumber}</span>
                  <button className="copy-btn" style={{ ...S.copyBtn, color: copied === "acct" ? "#16a34a" : "#c9a84c" }} onClick={() => copyText(BANK.accountNumber, "acct")}>
                    {copied === "acct" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div style={S.bankDivider} />
              <div style={S.bankRowWrap}>
                <span style={S.bankLabel}>Amount to Pay</span>
                <div style={S.bankValueRow}>
                  <span style={{ ...S.bankValue, color: "#c9a84c", fontWeight: 800 }}>{"\u20A6"}{Number(BANK.dues).toLocaleString()}.00</span>
                  <button className="copy-btn" style={{ ...S.copyBtn, color: copied === "amt" ? "#16a34a" : "#c9a84c" }} onClick={() => copyText(BANK.dues, "amt")}>
                    {copied === "amt" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <p style={S.payNote}>After making the transfer, upload a screenshot or photo of your payment receipt below.</p>

            <label style={S.label}>Proof of Payment *</label>
            <div
              className="proof-upload"
              style={{
                ...S.proofUpload,
                borderColor: errors.paymentProof ? "#dc2626" : form.paymentProofPreview ? "#16a34a" : "#2a2a35",
                background: errors.paymentProof ? "rgba(220,38,38,0.05)" : form.paymentProofPreview ? "rgba(22,163,74,0.05)" : "rgba(255,255,255,0.02)",
              }}
              onClick={() => proofRef.current?.click()}
            >
              {form.paymentProofPreview ? (
                <div style={S.proofDone}>
                  <img src={form.paymentProofPreview} alt="proof" style={S.proofThumb} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8ed" }}>Proof uploaded</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{form.paymentProofName}</div>
                    <div style={{ fontSize: 12, color: "#c9a84c", marginTop: 4, cursor: "pointer" }}>Tap to change</div>
                  </div>
                </div>
              ) : (
                <div style={S.proofEmpty}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#aaa" }}>Upload Payment Receipt</span>
                  <span style={{ fontSize: 12, color: "#666" }}>Screenshot, photo, or bank slip</span>
                </div>
              )}
              <input ref={proofRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleProof} />
            </div>
            {errors.paymentProof && <span style={S.errText}>{errors.paymentProof}</span>}
          </>
        )}

        {/* Step 4: Social */}
        {step === 4 && (
          <>
            <h2 style={S.sectionTitle}>Social & Final Info</h2>
            <div style={S.row}>
              <Field label="Facebook" value={form.facebook} onChange={set("facebook")} placeholder="facebook.com/yourname" />
              <Field label="LinkedIn" value={form.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/yourname" />
            </div>
            <div style={S.row}>
              <Field label="Twitter / X" value={form.twitter} onChange={set("twitter")} placeholder="@handle" />
              <Field label="Instagram" value={form.instagram} onChange={set("instagram")} placeholder="@handle" />
            </div>
            <label style={S.label}>Message to Fellow Old Boys</label>
            <textarea className="modern-textarea" style={S.textarea} value={form.message} onChange={set("message")} placeholder="Say something to the community..." rows={3} />
          </>
        )}

        {/* Navigation */}
        <div style={S.nav}>
          {step > 0 && (
            <button className="btn-secondary" style={S.btnSecondary} onClick={prev}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {unsavedChanges && <span style={S.unsavedDot} title="Unsaved changes" />}
          {step < TOTAL_STEPS - 1 ? (
            <button className="btn-primary" style={S.btnPrimary} onClick={next}>
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          ) : (
            <button
              className="btn-submit"
              style={{ ...S.btnSubmit, opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
          )}
        </div>
        {submitError && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 10, fontWeight: 500 }}>{submitError}</p>}
      </div>

      <footer style={S.footer}>
        &copy; {new Date().getFullYear()} Science Secondary School Old Boys Association, Lautai Gumel
      </footer>
    </div>
  );
}

/* ─── Field Components ─── */
function Field({ label, value, onChange, error, placeholder, type = "text", ...props }) {
  const inputId = `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <label htmlFor={inputId} style={S.label}>{label}</label>
      <input
        id={inputId}
        className="modern-input"
        type={type}
        style={{ ...S.input, ...(error ? S.inputError : {}) }}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && <span id={`${inputId}-error`} style={S.errText} role="alert">{error}</span>}
    </div>
  );
}

function SelectField({ label, value, onChange, error, options, placeholder, ...props }) {
  const selectId = `select-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <label htmlFor={selectId} style={S.label}>{label}</label>
      <select
        id={selectId}
        className="modern-input modern-select"
        style={{ ...S.input, ...S.select, ...(error ? S.inputError : {}), color: value ? "#e8e8ed" : "#666" }}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <span id={`${selectId}-error`} style={S.errText} role="alert">{error}</span>}
    </div>
  );
}

function BankRow({ label, value }) {
  return (
    <>
      <div style={S.bankRowWrap}>
        <span style={S.bankLabel}>{label}</span>
        <span style={S.bankValue}>{value}</span>
      </div>
      <div style={S.bankDivider} />
    </>
  );
}

/* ─── STYLES ─── */
const S = {
  page: {
    minHeight: "100vh",
    background: "#0f0f12",
    fontFamily: "'Inter', 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "32px 16px 48px",
    position: "relative",
    overflow: "hidden",
    color: "#e8e8ed",
  },
  bgOrb1: {
    position: "fixed", top: "-20%", right: "-10%",
    width: 600, height: 600,
    background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  bgOrb2: {
    position: "fixed", bottom: "-20%", left: "-10%",
    width: 500, height: 500,
    background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  toast: {
    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
    padding: "12px 24px", borderRadius: 12, color: "white",
    display: "flex", alignItems: "center", zIndex: 9999,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    fontSize: 14, fontWeight: 600,
    backdropFilter: "blur(12px)",
  },
  autoSave: {
    position: "fixed", bottom: 20, right: 20, padding: "8px 16px",
    background: "rgba(22,163,74,0.9)", color: "white",
    borderRadius: 8, fontSize: 12, zIndex: 9998, fontWeight: 600,
    backdropFilter: "blur(8px)",
  },

  /* Header */
  header: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 12, marginBottom: 32, textAlign: "center", position: "relative", zIndex: 1,
  },
  logoWrap: {
    width: 100, height: 100, borderRadius: 20,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,168,76,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 8, marginBottom: 8,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
  },
  logo: { maxWidth: "100%", height: "auto", maxHeight: "100%", objectFit: "contain", borderRadius: 12 },
  schoolName: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 28, fontWeight: 800, color: "#fff",
    margin: 0, letterSpacing: -0.5,
  },
  schoolSub: {
    fontSize: 12, color: "#888", margin: 0,
    letterSpacing: 2, textTransform: "uppercase", fontWeight: 500,
  },

  /* Stepper */
  stepper: {
    display: "flex", justifyContent: "center", gap: 0,
    marginBottom: 28, position: "relative", padding: "0 20px",
    width: "100%", maxWidth: 520, zIndex: 1,
  },
  stepTrack: {
    position: "absolute", top: 20, left: 50, right: 50,
    height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1,
  },
  stepTrackFill: {
    height: "100%", background: "linear-gradient(90deg, #c9a84c, #e8cc6e)",
    borderRadius: 1, transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
  },
  stepItem: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 8, zIndex: 1, cursor: "pointer", flex: 1,
  },
  stepCircle: {
    width: 40, height: 40, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
  },
  stepActive: {
    background: "rgba(201,168,76,0.15)",
    border: "2px solid #c9a84c",
    color: "#c9a84c",
    boxShadow: "0 0 20px rgba(201,168,76,0.2)",
  },
  stepDone: {
    background: "rgba(201,168,76,0.1)",
    border: "2px solid rgba(201,168,76,0.4)",
    color: "#c9a84c",
  },
  stepFuture: {
    background: "rgba(255,255,255,0.04)",
    border: "2px solid rgba(255,255,255,0.08)",
    color: "#555",
  },
  stepLabel: {
    fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8,
    transition: "color 0.3s",
  },

  /* Card */
  card: {
    width: "100%", maxWidth: 580,
    background: "rgba(255,255,255,0.03)",
    borderRadius: 20, padding: "40px 36px",
    boxShadow: "0 4px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
    position: "relative", zIndex: 1,
    border: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 22, fontWeight: 700, color: "#fff",
    marginBottom: 28, paddingBottom: 16,
    borderBottom: "1px solid rgba(201,168,76,0.2)",
    letterSpacing: -0.3,
  },
  row: { display: "flex", gap: 16, flexWrap: "wrap" },
  label: {
    display: "block", fontSize: 11, fontWeight: 600,
    color: "#999", marginTop: 18, marginBottom: 8,
    textTransform: "uppercase", letterSpacing: 1,
  },
  input: {
    width: "100%", padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, fontSize: 15, color: "#e8e8ed",
    background: "rgba(255,255,255,0.04)", outline: "none",
    transition: "all 0.2s ease", boxSizing: "border-box",
    fontWeight: 500, lineHeight: 1.5,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  inputError: { borderColor: "#dc2626", background: "rgba(220,38,38,0.05)" },
  select: {
    appearance: "none", cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center", paddingRight: 36,
  },
  textarea: {
    width: "100%", padding: "12px 16px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, fontSize: 15, color: "#e8e8ed",
    background: "rgba(255,255,255,0.04)", outline: "none",
    resize: "vertical", boxSizing: "border-box",
    transition: "all 0.2s ease", fontWeight: 500, lineHeight: 1.6,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  errText: { fontSize: 12, color: "#ef4444", marginTop: 5, display: "block", fontWeight: 500 },

  /* Photo */
  photoArea: { display: "inline-flex", cursor: "pointer", marginTop: 4, borderRadius: 14, transition: "all 0.2s" },
  photoEmpty: {
    width: 110, height: 120,
    background: "rgba(255,255,255,0.03)",
    border: "2px dashed rgba(255,255,255,0.1)",
    borderRadius: 14, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 4,
    transition: "all 0.2s",
  },
  photoImg: {
    width: 110, height: 120, objectFit: "cover", borderRadius: 14,
    border: "2px solid rgba(201,168,76,0.4)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
  },

  /* Payment */
  duesBox: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.03))",
    borderRadius: 14, padding: "20px 24px", marginBottom: 24,
    border: "1px solid rgba(201,168,76,0.15)",
  },
  duesLabel: {
    fontSize: 12, color: "#999", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: 1.2,
  },
  duesAmount: {
    fontSize: 32, fontWeight: 800, color: "#c9a84c",
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  bankCard: {
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14,
    padding: 24, background: "rgba(255,255,255,0.02)",
    marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
  },
  bankHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  bankIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(201,168,76,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  bankTitle: { fontSize: 15, fontWeight: 700, color: "#e8e8ed" },
  bankRowWrap: { padding: "12px 0" },
  bankLabel: {
    fontSize: 10, color: "#666", textTransform: "uppercase",
    letterSpacing: 0.8, display: "block", marginBottom: 6, fontWeight: 600,
  },
  bankValueRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  bankValue: { fontSize: 15, fontWeight: 700, color: "#e8e8ed" },
  bankDivider: { height: 1, background: "rgba(255,255,255,0.04)" },
  copyBtn: {
    background: "rgba(201,168,76,0.08)",
    border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: 8, padding: "5px 14px",
    fontSize: 12, fontWeight: 700, cursor: "pointer",
    transition: "all 0.2s", letterSpacing: 0.3,
    fontFamily: "'Inter', sans-serif",
  },
  payNote: {
    fontSize: 14, color: "#888", lineHeight: 1.7,
    margin: "16px 0 8px", fontWeight: 500,
  },
  proofUpload: {
    border: "2px dashed rgba(255,255,255,0.08)",
    borderRadius: 14, padding: 24, cursor: "pointer",
    transition: "all 0.2s", marginTop: 8,
  },
  proofEmpty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "12px 0" },
  proofDone: { display: "flex", alignItems: "center", gap: 18 },
  proofThumb: {
    width: 72, height: 72, objectFit: "cover", borderRadius: 10,
    border: "2px solid rgba(22,163,74,0.5)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
  },

  unsavedDot: {
    display: "inline-block", width: 8, height: 8,
    background: "#f59e0b", borderRadius: "50%", marginRight: 8,
  },

  /* Navigation */
  nav: { display: "flex", alignItems: "center", marginTop: 36, gap: 14 },
  btnPrimary: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #c9a84c, #a88a3a)",
    color: "#0f0f12", fontWeight: 700, fontSize: 14,
    border: "none", borderRadius: 10, cursor: "pointer",
    letterSpacing: 0.3,
    boxShadow: "0 4px 16px rgba(201,168,76,0.2)",
    transition: "all 0.2s ease",
    display: "flex", alignItems: "center",
    fontFamily: "'Inter', sans-serif",
  },
  btnSecondary: {
    padding: "12px 24px", background: "transparent",
    color: "#999", fontWeight: 600, fontSize: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex", alignItems: "center",
    fontFamily: "'Inter', sans-serif",
  },
  btnSubmit: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #c9a84c, #e8cc6e)",
    color: "#0f0f12", fontWeight: 800, fontSize: 15,
    border: "none", borderRadius: 10, cursor: "pointer",
    letterSpacing: 0.3,
    boxShadow: "0 8px 24px rgba(201,168,76,0.25)",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },

  /* Success */
  successCard: {
    maxWidth: 480,
    background: "rgba(255,255,255,0.03)",
    borderRadius: 24, padding: "56px 42px",
    textAlign: "center",
    boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
    marginTop: 60, position: "relative", zIndex: 1,
    border: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
  },
  successIconWrap: {
    width: 80, height: 80, borderRadius: "50%",
    background: "rgba(201,168,76,0.1)",
    border: "1px solid rgba(201,168,76,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 24px",
  },
  successTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 26, color: "#fff", margin: "0 0 16px",
    fontWeight: 700, letterSpacing: -0.3,
  },
  successText: {
    fontSize: 15, color: "#aaa", lineHeight: 1.8, fontWeight: 400,
  },

  footer: {
    marginTop: 36, fontSize: 12, color: "#555",
    textAlign: "center", position: "relative", zIndex: 1,
    fontWeight: 400, letterSpacing: 0.2,
  },
};
