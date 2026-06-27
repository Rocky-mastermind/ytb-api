const ytsr = require("ytsr");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { songName } = req.query;
  if (!songName) return res.status(400).json({ error: "songName is required" });

  try {
    const results = await ytsr(songName, { limit: 10 });
    const videos = results.items
      .filter(i => i.type === "video")
      .map(v => ({
        id: v.id,
        title: v.title,
        url: v.url,
        duration: v.duration,
        author: v.author?.name || "Unknown",
        thumbnail: v.bestThumbnail?.url || "",
        views: v.views || 0
      }));

    if (!videos.length) return res.status(404).json({ error: "No results found" });

    return res.status(200).json(videos);
  } catch (err) {
    console.error("Search error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
