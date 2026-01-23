const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const User = require('./models/User');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = "mongodb+srv://digloo:navnit@cluster0.lox2si6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes

// Register Endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { name, mobile, gender, age, address } = req.body;

        // Validation
        if (!name || !mobile || !gender) {
            return res.status(400).json({ success: false, message: 'Name, Mobile and Gender are required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ mobile });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already registered with this mobile number' });
        }

        // Create new user
        const newUser = new User({
            name,
            mobile,
            gender,
            age: age ? parseInt(age) : null,
            address
        });

        await newUser.save();

        res.status(201).json({ success: true, message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

// Get User Profile
app.get('/api/user/:mobile', async (req, res) => {
    try {
        const user = await User.findOne({ mobile: req.params.mobile });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error("Fetch Profile Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update User Profile
app.put('/api/user/:mobile', async (req, res) => {
    try {
        const { name, gender, age, address } = req.body;
        const updatedUser = await User.findOneAndUpdate(
            { mobile: req.params.mobile },
            { name, gender, age, address },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ success: false, message: 'Server error copy' });
    }
});

// Bus Live Tracking Routes
const Bus = require('./models/Bus');

// Driver App: Send Location Update
app.post('/api/bus/location', async (req, res) => {
    try {
        const { bus_id, lat, lng, speed } = req.body;

        if (!bus_id || !lat || !lng) {
            return res.status(400).json({ success: false, message: 'Missing bus_id, lat, or lng' });
        }

        // Upsert: Update if exists, Create if not
        await Bus.findOneAndUpdate(
            { busId: bus_id },
            {
                lat,
                lng,
                speed,
                lastUpdated: Date.now()
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'Location updated' });
    } catch (error) {
        console.error("Bus Location Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Passenger App: Get Active Buses
app.get('/api/buses', async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeBuses = await Bus.find({ lastUpdated: { $gte: fiveMinutesAgo } });
        res.json({ success: true, buses: activeBuses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Specific Bus State (Poll/Init)
app.get('/api/bus/:busId', async (req, res) => {
    try {
        const bus = await Bus.findOne({ busId: req.params.busId });
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
        res.json({ success: true, bus });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Bus Account & Authentication Routes
const BusAccount = require('./models/BusAccount');

// Conductor Auth Routes
const Conductor = require('./models/Conductor');
const Route = require('./models/Route');

// 1. Send OTP (Simulated)
app.post('/api/conductor/login', async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile) return res.status(400).json({ success: false, message: 'Mobile number required' });

        // Generate Mock OTP
        const otp = "1234";

        // Upsert Conductor
        await Conductor.findOneAndUpdate(
            { mobile },
            { otp, isVerified: false }, // Reset verification
            { upsert: true, new: true }
        );

        console.log(`OTP for ${mobile}: ${otp}`);
        res.json({ success: true, message: 'OTP Sent (Use 1234)', otp }); // Returning OTP for easy testing
    } catch (error) {
        console.error("Conductor Login Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 2. Verify OTP
app.post('/api/conductor/verify', async (req, res) => {
    try {
        const { mobile, otp } = req.body;
        const conductor = await Conductor.findOne({ mobile });

        if (!conductor || conductor.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Mark verified
        conductor.isVerified = true;
        conductor.otp = null; // Clear OTP
        await conductor.save();

        res.json({ success: true, message: 'Login Successful', conductor });
    } catch (error) {
        console.error("OTP Verify Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 3. Update Profile
app.post('/api/conductor/profile', async (req, res) => {
    try {
        const { mobile, name, age, gender, address } = req.body;
        const conductor = await Conductor.findOneAndUpdate(
            { mobile },
            { name, age, gender, address },
            { new: true }
        );
        res.json({ success: true, conductor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Conductor App: Update Crowd Level & Passenger Count
app.post('/api/bus/crowd', async (req, res) => {
    try {
        const { busId, crowdLevel, passengerCount } = req.body;

        if (!busId) {
            return res.status(400).json({ success: false, message: 'Bus ID required' });
        }

        // Auto-calculate Crowd Level if count is provided
        let newCrowdLevel = crowdLevel;
        let finalCount = passengerCount;

        if (passengerCount !== undefined) {
            if (passengerCount < 30) newCrowdLevel = 'Low';
            else if (passengerCount < 50) newCrowdLevel = 'Medium';
            else newCrowdLevel = 'High';
        }

        const allowedLevels = ['Low', 'Medium', 'High'];
        if (newCrowdLevel && !allowedLevels.includes(newCrowdLevel)) {
            // Fallback if provided level is invalid but count wasn't
            newCrowdLevel = 'Low';
        }

        const updateData = { lastUpdated: Date.now() };
        if (newCrowdLevel) updateData.crowdLevel = newCrowdLevel;
        if (finalCount !== undefined) updateData.currentPassengers = finalCount;

        const updatedBus = await Bus.findOneAndUpdate(
            { busId: busId },
            updateData,
            { new: true, upsert: true } // Upsert to ensure bus exists
        );

        res.json({
            success: true,
            message: `Count updated to ${finalCount}. Level: ${newCrowdLevel}`,
            bus: updatedBus
        });
    } catch (error) {
        console.error("Crowd Update Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Conductor App: Verify Ticket (Mock)
app.post('/api/ticket/verify', (req, res) => {
    const { ticketId, busId } = req.body;
    // Mock Logic: If ticket ID starts with "VALID", it's valid.
    if (ticketId && ticketId.startsWith("TICKET")) {
        res.json({ success: true, message: "Ticket Verified Successfully", valid: true });
    } else {
        res.json({ success: false, message: "Invalid or Expired Ticket", valid: false });
    }
});

// Route Visualization (Real Data)
app.get('/api/routes', async (req, res) => {
    try {
        const routes = await Route.find();
        res.json({ success: true, routes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Seed Routes (Vadodara)
app.get('/api/routes/seed', async (req, res) => {
    try {
        // Route 1A: Vadodara Junction -> Waghodia GIDC
        const routePoints1A = [
            { lat: 22.310107655753864, lng: 73.18211593528066, name: "Vadodara Junction" },
            { lat: 22.30863684679467, lng: 73.18841724821846, name: "Kala Ghoda Circle" },
            { lat: 22.300094254370055, lng: 73.20553592280895, name: "Sur Sagar lake" },
            { lat: 22.300246486254412, lng: 73.21096677203695, name: "Mandvi Gate" },
            { lat: 22.300850675414004, lng: 73.23032173473486, name: "Umma Chowkadi" },
            { lat: 22.300178192711872, lng: 73.23868661694327, name: "Vrundavan Chowkadi" },
            { lat: 22.296264437767192, lng: 73.25546737367722, name: "Waghodia Chowkdi" },
            { lat: 22.293104890196275, lng: 73.32095502801857, name: "Sumandeep" },
            { lat: 22.287538347164414, lng: 73.36499295939116, name: "Parul University Main Gate" },
            { lat: 22.293686752482376, lng: 73.38832022372544, name: "Waghodia GIDC" }
        ];

        const routes = [
            {
                routeId: "1A",
                name: "Vadodara Junction -> Waghodia GIDC",
                source: "Vadodara Junction",
                destination: "Waghodia GIDC",
                checkpoints: routePoints1A
            },
            {
                routeId: "1A-R",
                name: "Waghodia GIDC -> Vadodara Junction",
                source: "Waghodia GIDC",
                destination: "Vadodara Junction",
                // Reverse the points for the return trip
                checkpoints: [...routePoints1A].reverse()
            }
        ];

        // Clear existing routes and insert new ones
        await Route.deleteMany({});
        await Route.insertMany(routes);

        res.json({ success: true, message: 'Seeded Route 1A & 1A-R successfully', routes });
    } catch (error) {
        console.error("Seed Route Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Smart Route Suggestion API
app.post('/api/routes/suggest', async (req, res) => {
    try {
        const { origin, dest } = req.body; // Expects { lat, lng } objects

        // 1. Get Active Buses
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeBuses = await Bus.find({ lastUpdated: { $gte: fiveMinutesAgo } });

        if (activeBuses.length === 0) {
            return res.json({ success: true, routes: [], message: "No active buses found" });
        }

        // 2. Mock Duration/Distance Calculation (In real app, use Google Matrix API)
        // We will simulate variability based on bus speed
        const suggestions = activeBuses.map(bus => {
            const speed = bus.speed || 30; // km/h
            const distKm = 5.2; // Mock distance for Vadodara demo
            const manualDurationMins = Math.round((distKm / speed) * 60);

            // Crowd Score (0-100)
            let crowdScore = 0;
            let crowdLabel = "High Crowd";
            if (bus.crowdLevel === 'Low') { crowdScore = 100; crowdLabel = "Low Crowd"; }
            else if (bus.crowdLevel === 'Medium') { crowdScore = 50; crowdLabel = "Medium Crowd"; }
            else { crowdScore = 0; crowdLabel = "High Crowd"; }

            // Speed Score (0-100)
            // Baseline: 60km/h = 100pts. 
            let speedScore = Math.min(100, (speed / 60) * 100);


            // Random ETA between 2-20 mins for demo
            const etaMins = Math.floor(Math.random() * 18) + 2;
            let etaScore = etaMins < 5 ? 100 : (etaMins < 15 ? 50 : 0);

            // Final Smart Score
            // Weights: Crowd(40%), Speed(40%), ETA(20%)
            const totalScore = (crowdScore * 0.4) + (speedScore * 0.4) + (etaScore * 0.2);

            return {
                busId: bus.busId,
                totalScore: Math.round(totalScore),
                crowdLevel: bus.crowdLevel,
                duration: `${manualDurationMins} min`,
                eta: `${etaMins} min`,
                speed: speed,
                badges: [
                    crowdScore === 100 ? "Low Crowd" : null,
                    speedScore > 80 ? "Fastest" : null,
                    etaMins < 5 ? "Arriving Soon" : null
                ].filter(Boolean)
            };
        });

        // 3. Sort by Smart Score
        suggestions.sort((a, b) => b.totalScore - a.totalScore);

        // 4. Mark Best Choice
        if (suggestions.length > 0) {
            suggestions[0].isBestChoice = true;
        }

        res.json({ success: true, routes: suggestions });

    } catch (error) {
        console.error("Smart Route Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Seed Bus Accounts (bus001 to bus020)
app.get('/api/admin/seed-buses', async (req, res) => {
    try {
        const busAccounts = [];
        for (let i = 1; i <= 20; i++) {
            const id = `bus${String(i).padStart(3, '0')}`;
            busAccounts.push({ busId: id, password: id });
        }

        // Reset and Seed
        await BusAccount.deleteMany({});
        await BusAccount.insertMany(busAccounts);

        res.json({ success: true, message: 'Seeded 20 bus accounts (bus001 - bus020)', accounts: busAccounts });
    } catch (error) {
        console.error("Seed Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Driver App: Login
app.post('/api/bus/login', async (req, res) => {
    try {
        const { busId, password } = req.body;

        if (!busId || !password) {
            return res.status(400).json({ success: false, message: 'Bus ID and Password required' });
        }

        const bus = await BusAccount.findOne({ busId });
        if (!bus || bus.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid Credentials' });
        }

        res.json({ success: true, message: 'Login Successful' });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get All Buses (for Conductor App Selection)
app.get('/api/buses/all', async (req, res) => {
    try {
        const buses = await BusAccount.find({}, 'busId'); // fetch only busId field
        const busIds = buses.map(b => b.busId);
        res.json({ success: true, buses: busIds });
    } catch (error) {
        console.error("Get Buses Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Bus Stand Routes
const BusStand = require('./models/BusStand');

// Seed Vadodara Bus Stands (Run via Browser or Postman)
app.get('/api/seed-stands', async (req, res) => {
    try {
        const vadodaraStands = [

            { name: "Parul University Main Gate", lat: 22.287538347164414, lng: 73.36499295939116, isDepot: false },
            { name: "Waghodia Chowkdi", lat: 22.296264437767192, lng: 73.25546737367722, isDepot: false },
            { name: "Waghodia GIDC", lat: 22.293686752482376, lng: 73.38832022372544, isDepot: false },
            { name: "Limda", lat: 22.281620492187294, lng: 73.36495973188809, isDepot: false },
            { name: "Madheli", lat: 22.267171123976684, lng: 73.37669189425795, isDepot: false },
            { name: "Sumandeep", lat: 22.293104890196275, lng: 73.32095502801857, isDepot: false },
            { name: "Vadodara Junction", lat: 22.310107655753864, lng: 73.18211593528066, isDepot: true },
            { name: "Vrundavan Chowkadi", lat: 22.300178192711872, lng: 73.23868661694327, isDepot: false },
            { name: "Umma Chowkadi", lat: 22.300850675414004, lng: 73.23032173473486, isDepot: false },
            { name: "Mandvi Gate", lat: 22.300246486254412, lng: 73.21096677203695, isDepot: false },
            { name: "Sur Sagar lake", lat: 22.300094254370055, lng: 73.20553592280895, isDepot: false },
            { name: "Kala Ghoda Circle", lat: 22.30863684679467, lng: 73.18841724821846, isDepot: false },
            { name: "Pavagadh Hills", lat: 22.462859111546006, lng: 73.52515166322463, isDepot: false }
        ];

        // Clear existing and insert new (reset)
        await BusStand.deleteMany({});
        await BusStand.insertMany(vadodaraStands);

        res.json({ success: true, message: "Vadodara Bus Stands seeded successfully!", count: vadodaraStands.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Bus Stands
app.get('/api/bus-stands', async (req, res) => {
    try {
        const stands = await BusStand.find();
        res.json({ success: true, stands });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/', (req, res) => {
    res.send('Passenger App Backend is Running');
});

// Export for Vercel
module.exports = app;

// Start Server locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}
