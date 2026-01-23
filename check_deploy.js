const https = require('https');

const data = JSON.stringify({
    origin: { lat: 22.3129, lng: 73.1812 },
    dest: { lat: 22.2746, lng: 73.1916 }
});

const options = {
    hostname: 'go-saathi.vercel.app',
    port: 443,
    path: '/api/routes/suggest',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let body = '';
    res.on('data', (d) => {
        body += d;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ Success! Endpoint Routes/Suggest exists.');
            console.log('Response:', body.substring(0, 100) + '...');
        } else if (res.statusCode === 404) {
            console.log('❌ Failed. Endpoint Not Found (404). Not Deployed.');
        } else {
            console.log(`⚠️  Received Status ${res.statusCode}.`);
            console.log('Response:', body);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
