const ytdl = require("ytdl-core");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { link, format } = req.query;
  if (!link) return res.status(400).json({ error: "link (video ID) is required" });

  const videoUrl = link.startsWith("http")
    ? link
    : `https://www.youtube.com/watch?v=${link}`;

  try {
    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title;
    const thumbnail = info.videoDetails.thumbnails.slice(-1)[0]?.url || "";
    const author = info.videoDetails.author.name;
    const duration = info.videoDetails.lengthSeconds;

    let downloadLink = "";
    let quality = "";

    if (format === "mp3" || format === "audio") {
      // Audio only
      const audioFormat = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
        filter: "audioonly"
      });
      downloadLink = audioFormat.url;
      quality = `${audioFormat.audioBitrate || 128}kbps`;
    } else {
      // Video (mp4)
      const videoFormat = ytdl.chooseFormat(info.formats, {
        quality: "highest",
        filter: format => format.container === "mp4" && format.hasAudio && format.hasVideo
      });

      if (videoFormat) {
        downloadLink = videoFormat.url;
        quality = videoFormat.qualityLabel || "360p";
      } else {
        // Fallback — any mp4
        const fallback = info.formats.find(f => f.container === "mp4" && f.hasAudio);
        if (!fallback) throw new Error("No suitable format found");
        downloadLink = fallback.url;
        quality = fallback.qualityLabel || "360p";
      }
    }

    return res.status(200).json({
      title,
      downloadLink,
      quality,
      thumbnail,
      author,
      duration,
      videoId: info.videoDetails.videoId
    });

  } catch (err) {
    console.error("Download error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
