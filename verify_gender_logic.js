const BASE_URL = 'http://localhost:3000'; // Assuming local server is running
const BUS_ID = 'bus001';

async function runTest() {
    try {
        console.log("🚀 Starting Gender Logic Verification...");

        // 1. Simulate Conductor Updating Crowd (2 Males, 3 Females)
        console.log(`\n1. Conductor updates ${BUS_ID} with 2 Males, 3 Females...`);
        const updatePayload = {
            busId: BUS_ID,
            crowdLevel: 'Low',
            passengerCount: 5,
            maleCount: 2,
            femaleCount: 3
        };

        try {
            const updateRes = await fetch(`${BASE_URL}/api/bus/crowd`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });
            const updateData = await updateRes.json();

            if (updateData.success) {
                console.log("✅ Conductor Update Successful!");
                console.log("   Stored Bus Data:", updateData.bus.maleCount, "Males,", updateData.bus.femaleCount, "Females");
            } else {
                console.error("❌ Conductor Update Failed:", updateData.message);
                return;
            }
        } catch (e) {
            console.log("Error updating crowd: ", e.message);
        }

        // 2. Simulate Passenger Requesting Routes
        console.log(`\n2. Passenger requests route suggestions...`);
        const routePayload = {
            origin: { lat: 22.3129, lng: 73.1812 },
            dest: { lat: 22.2876, lng: 73.3650 }
        };

        try {
            const suggestRes = await fetch(`${BASE_URL}/api/routes/suggest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(routePayload)
            });
            const suggestData = await suggestRes.json();

            if (suggestData.success) {
                console.log("✅ Suggestion API Response Received");
                const busRoute = suggestData.routes.find(r => r.busId === BUS_ID);

                if (busRoute) {
                    console.log(`   Found ${BUS_ID} in suggestions.`);
                    console.log(`   Female Count in Response: ${busRoute.femaleCount}`);

                    if (busRoute.femaleCount === 3) {
                        console.log("✅ SUCCESS: Female Count matches verified data!");
                    } else {
                        console.error("❌ FAILURE: Female Count mismatch. Expected 3, got", busRoute.femaleCount);
                    }
                } else {
                    console.error(`❌ ${BUS_ID} not found in suggestions.`);
                }
            } else {
                console.error("❌ Suggestion API Failed");
            }
        } catch (e) {
            console.log("Error fetching routes: ", e.message);
        }

    } catch (error) {
        console.error("⚠️ Test Error (Is server running?):", error.message);
    }
}

runTest();
