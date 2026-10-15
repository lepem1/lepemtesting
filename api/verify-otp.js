
const DEMO_OTP = "6738";

// Demonstration-only guard. Serverless instances may reset,
// so use a persistent rate limiter for a real deployment.
const attempts = new Map();
const MAX_ATTEMPTS = 5000000000000000000000000000000000000000000000000000000;
const WINDOW_MS = 60 * 1000;

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      message: "Use POST to verify an OTP."
    });
  }

  const contentType = req.headers["content-type"] || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return res.status(415).json({
      success: false,
      message: "Content-Type must be application/json."
    });
  }

  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON request."
      });
    }
  }

  if (!body || typeof body.otp !== "string" ||
      !/^\d{4}$/.test(body.otp)) {
    return res.status(400).json({
      success: false,
      message: "OTP must contain exactly four digits."
    });
  }

  // Best-effort demonstration guard. Do not trust this for
  // production security on a serverless deployment.
  const now = Date.now();

  // Avoid trusting arbitrary client-supplied forwarding headers.
  // A persistent provider-side rate limiter is preferable.
  const ip = req.socket?.remoteAddress || "unknown";
  let record = attempts.get(ip);

  if (!record || now - record.startedAt >= WINDOW_MS) {
    record = { startedAt: now, count: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    attempts.set(ip, record);
    return res.status(429).json({
      success: false,
      message: "Demo attempt limit reached. Try again later."
    });
  }

  record.count++;
  attempts.set(ip, record);

  if (body.otp !== DEMO_OTP) {
    return res.status(401).json({
      success: false,
      message: "Incorrect OTP."
    });
  }

  return res.status(200).json({
    success: true,
    message: "You passed the test!"
  });
};
