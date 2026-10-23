const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/upload', async (req, res) => {
    const { directUrl, apis } = req.body; 

    if (!directUrl || !apis || apis.length === 0) {
        return res.status(400).json({ error: "URL and API required." });
    }

    let results = [];
    const fileName = directUrl.substring(directUrl.lastIndexOf('/') + 1) || 'video_file.mp4';

    for (const api of apis) {
        try {
            const fileStreamResponse = await axios({
                method: 'GET',
                url: directUrl,
                responseType: 'stream'
            });

            const formData = new FormData();
            formData.append('key', api.key); 
            formData.append('file', fileStreamResponse.data, fileName);

            // यह Headers API को बेवकूफ बनाएंगे कि अपलोड ब्राउज़र/मोबाइल से हो रहा है
            const customHeaders = {
                ...formData.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            };

            const uploadResponse = await axios.post(api.uploadUrl, formData, {
                headers: customHeaders
            });

            results.push({ provider: api.provider, status: "Success", link: uploadResponse.data.link || uploadResponse.data });
        } catch (apiError) {
            results.push({ provider: api.provider, status: "Failed", error: apiError.message });
        }
    }
    res.json({ message: "Upload Process Completed", results });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
