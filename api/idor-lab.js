
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const { testId, mode } = req.body || {};

  const cases = {
    0: { type: "Numeric IDOR", resource: "profile-200" },
    1: { type: "UUID IDOR", resource: "document-b7" },
    2: { type: "Nested resource IDOR", resource: "comment-b" },
    3: { type: "API object access", resource: "settings-200" },
    4: { type: "File access", resource: "report-b" },
    5: { type: "Order access", resource: "order-b" },
    6: { type: "Admin function access", resource: "admin-report" },
    7: { type: "Export access", resource: "export-b" }
  };

  if (!Object.hasOwn(cases, testId) ||
      !["secure", "vulnerable"].includes(mode)) {
    return res.status(400).json({
      error: "Invalid testId or mode."
    });
  }

  const test = cases[testId];

  // Fictional response data. No database or real user records are accessed.
  const demoRecord = {
    owner: "user-200",
    resource: test.resource,
    data: "FICTIONAL PRIVATE TEST DATA"
  };

  if (mode === "vulnerable") {
    return res.status(200).json({
      test: test.type,
      simulatedVulnerability: true,
      message: "Simulated IDOR: the other account's demo record was exposed.",
      record: demoRecord
    });
  }

  return res.status(403).json({
    test: test.type,
    simulatedVulnerability: false,
    message: "Access denied. Account A does not own this resource.",
    record: null
  });
};
