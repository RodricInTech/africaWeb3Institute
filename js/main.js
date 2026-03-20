(function () {
  "use strict";

  const form = document.getElementById("applicationForm");
  if (!form) return;

  const statusEl = document.getElementById("formStatus");

  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");
  const countryEl = document.getElementById("country");
  const linkedinEl = document.getElementById("linkedin");

  const hint = {
    name: document.getElementById("nameHint"),
    email: document.getElementById("emailHint"),
    country: document.getElementById("countryHint"),
    linkedin: document.getElementById("linkedinHint"),
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\//i;

  function setStatus(message, tone) {
    statusEl.textContent = message;
    statusEl.dataset.visible = "true";
    statusEl.style.borderColor = tone === "error" ? "rgba(239, 68, 68, 0.35)" : "rgba(16, 185, 129, 0.35)";
    statusEl.style.background =
      tone === "error" ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)";
  }

  function clearHints() {
    Object.values(hint).forEach((el) => {
      if (el) el.textContent = "";
    });
  }

  function validate() {
    clearHints();

    const name = (nameEl.value || "").trim();
    const email = (emailEl.value || "").trim();
    const country = (countryEl.value || "").trim();
    const linkedin = (linkedinEl.value || "").trim();

    if (!name) {
      hint.name && (hint.name.textContent = "Please enter your name.");
      return { ok: false };
    }
    if (!email || !emailRegex.test(email)) {
      hint.email && (hint.email.textContent = "Please enter a valid email address.");
      return { ok: false };
    }
    if (!country) {
      hint.country && (hint.country.textContent = "Please enter your country.");
      return { ok: false };
    }
    if (!linkedin || !linkedinRegex.test(linkedin)) {
      hint.linkedin && (hint.linkedin.textContent = "Please enter a valid LinkedIn URL.");
      return { ok: false };
    }

    return {
      ok: true,
      data: {
        name,
        email,
        country,
        linkedin,
        submittedAt: new Date().toISOString(),
      },
    };
  }

  function saveLocalSubmission(payload) {
    const key = "aw3i_fellowship_submissions";
    try {
      const raw = localStorage.getItem(key);
      const existing = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(existing)) return;
      existing.unshift(payload);
      // Keep last 50 entries to prevent unbounded growth.
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
    } catch (_) {
      // localStorage may be blocked (private mode). Ignore; still show confirmation.
    }
  }

  async function postIfConfigured(payload) {
    // Optional hook: if someone adds an endpoint later, this will try to use it.
    // It must remain non-blocking; the page is a static demo.
    const endpoint = (window.location.origin || "") + "/api/fellowship";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res && res.ok ? { remoteSaved: true } : { remoteSaved: false };
    } catch (_) {
      return { remoteSaved: false };
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.dataset.visible = "false";
    statusEl.style.borderColor = "";
    statusEl.style.background = "";

    const result = validate();
    if (!result.ok) {
      setStatus("Please fix the highlighted fields and try again.", "error");
      return;
    }

    const payload = result.data;

    saveLocalSubmission(payload);
    const remote = await postIfConfigured(payload);

    const name = payload.name.split(/\s+/)[0] || payload.name;
    setStatus(
      remote.remoteSaved
        ? `Thanks, ${name}! Your application was captured successfully.`
        : `Thanks, ${name}! Your application was captured locally in your browser.`,
      "success"
    );

    form.reset();
  });
})();

