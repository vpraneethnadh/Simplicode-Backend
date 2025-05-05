require('dotenv').config();

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const systemPrompt = `
Generate code strictly based on this input: {text}.  

### Output Format Rules:  
1. **Provide ONLY the functional, executable code or relevant output.**  
2. **Any non-executable text, logs, or output** must:  
   - Be enclosed in /* */  
   - Example: /* Server running on port 3000 */  
3. **Terminal commands** must:  
   - Be enclosed in /* */  
   - Example: /* npm install express */  
4. **Do NOT include any explanations, descriptions, or comments** except within /* */
`;

function getTimeStamp() {
  return new Date().toLocaleString();
}

async function callGemini(text) {
  const prompt = systemPrompt.replace('{text}', text);
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const cleaned = raw.replace(/```(java|python|c\+\+|c|typescript|javascript|go|ruby|php)?/g, '').trim();
  const timestamp = `// Generated on: ${getTimeStamp()}\n`;
  return timestamp + cleaned;
}

app.post('/generate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send('Missing text');

  try {
    const output = await callGemini(text);
    res.setHeader('Content-Type', 'text/plain');
    res.send(output);
  } catch (err) {
    res.status(500).send('Error generating content');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  /* Server running on port ${PORT} */
});
