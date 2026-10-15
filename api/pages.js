
const fs = require("fs");
const path = require("path");

const pagesDirectory = path.join(process.cwd(), "pages");

function getMetadata(content, filename) {
  const titleMatch = content.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch = content.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/i
  );

  const stripTags = value =>
    value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  return {
    title: titleMatch
      ? stripTags(titleMatch[1])
      : filename.replace(/\.html$/i, "").replace(/[-_]/g, " "),
    description: descriptionMatch ? descriptionMatch[1].trim() : ""
  };
}

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!fs.existsSync(pagesDirectory)) {
      return res.status(200).json({ pages: [] });
    }

    const files = fs.readdirSync(pagesDirectory, {
      withFileTypes: true
    });

    const pages = files
      .filter(file =>
        file.isFile() &&
        /\.html$/i.test(file.name) &&
        !file.name.startsWith(".") &&
        file.name.toLowerCase() !== "index.html"
      )
      .map(file => {
        const filename = file.name;
        const content = fs.readFileSync(
          path.join(pagesDirectory, filename),
          "utf8"
        );

        const metadata = getMetadata(content, filename);

        return {
          filename,
          url: "/pages/" + encodeURIComponent(filename),
          title: metadata.title,
          description: metadata.description
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    return res.status(200).json({ pages });
  } catch (error) {
    console.error("Failed to read testing pages:", error);
    return res.status(500).json({ error: "Could not load pages" });
  }
};
