const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Server is Running smoothly!");
});

// मेन अपलोड API
app.post('/api/upload', async (req, res) => {
    const { directUrl, apis } = req.body; 
    // apis का फॉर्मेट: [{ provider: "Diskwala", key: "xyz", uploadUrl: "https://..." }]

    if (!directUrl || !apis || apis.length === 0) {
        return res.status(400).json({ error: "Direct URL and at least one API key are required." });
    }

    let results = [];

    try {
        console.log(`Starting download stream for: ${directUrl}`);
        
        // 1. रिमोट URL से डेटा स्ट्रीम लेना
        const fileStreamResponse = await axios({
            method: 'GET',
            url: directUrl,
            responseType: 'stream'
        });

        // फाइल का नाम URL से निकालना
        const fileName = directUrl.substring(directUrl.lastIndexOf('/') + 1) || 'uploaded_file.mp4';

        // 2. हर API पर डेटा अपलोड करना
        for (const api of apis) {
            try {
                const formData = new FormData();
                // API के अनुसार फॉर्म पैरामीटर्स सेट करें
                formData.append('key', api.key); 
                formData.append('file', fileStreamResponse.data, fileName);

                console.log(`Uploading to ${api.provider}...`);

                // 3. क्लाउड API पर स्ट्रीम भेजना (असली डिवाइस अपलोड की तरह)
                const uploadResponse = await axios.post(api.uploadUrl, formData, {
                    headers: { ...formData.getHeaders() }
                });

                results.push({
                    provider: api.provider,
                    status: "Success",
                    link: uploadResponse.data.link || uploadResponse.data // API के रिस्पॉन्स के अनुसार बदलें
                });

            } catch (apiError) {
                results.push({
                    provider: api.provider,
                    status: "Failed",
                    error: apiError.message
                });
            }
        }

        res.json({ message: "Upload Process Completed", results });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch Direct URL", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
