require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.DEEPSEEK_API_KEY;
const PORT = process.env.PORT || 3000;

app.post("/api/translate", async (req, res) => {
    const text = req.body.text;

    if (!text) {
        return res.status(400).json({ error: "No input text" });
    }

    const prompt = `
You are an English coach.

Return ONLY valid JSON:
{
  "english": "natural English translation",
  "alternatives": ["option1", "option2", "option3"],
  "explanation": "why this is correct"
}

Input:
${text}
`;

    try {
        const response = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const content = response.data.choices[0].message.content;

        // 提取 JSON（防止模型输出多余文本）
        const json = extractJSON(content);

        if (!json) {
            return res.json({
                english: "parse error",
                alternatives: [],
                explanation: content
            });
        }

        res.json(json);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// 提取 JSON
function extractJSON(text) {
    try {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");

        if (start === -1 || end === -1) return null;

        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        return null;
    }
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});