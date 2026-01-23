const LIVE_URL = 'https://go-saathi.vercel.app';

async function checkLiveServer() {
    try {
        console.log("🌍 Checking Live Server at " + LIVE_URL);

        // Check /api/routes for femaleCount field
        const res = await fetch(`${LIVE_URL}/api/routes`);
        const data = await res.json();

        if (data.success && data.routes && data.routes.length > 0) {
            const firstRoute = data.routes[0]; // Take sample (e.g., matching bus001 logic might not work if seed is diff, but field check is enough)

            // Check specifically for the new 'femaleCount' field we added
            if (firstRoute.hasOwnProperty('femaleCount')) {
                console.log("✅ LIVE SERVER HAS updated code! (femaleCount found)");
            } else {
                console.log("❌ LIVE SERVER IS OLD. (femaleCount NOT found)");
                console.log("   Observed Keys:", Object.keys(firstRoute));
            }
        } else {
            console.log("⚠️ Could not fetch routes or empty list.");
        }
    } catch (e) {
        console.error("Connection Error:", e.message);
    }
}

checkLiveServer();
