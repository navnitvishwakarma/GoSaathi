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

// Passenger App: Get Active Buses (Updated in last 5 mins)
app.get('/api/buses', async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Find buses updated recently
        const activeBuses = await Bus.find({ lastUpdated: { $gte: fiveMinutesAgo } });

        res.json({ success: true, buses: activeBuses });
    } catch (error) {
        console.error("Fetch Buses Error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Bus Account & Authentication Routes
const BusAccount = require('./models/BusAccount');

// Conductor Auth Routes
const Conductor = require('./models/Conductor');

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

// Conductor App: Update Crowd Level
app.post('/api/bus/crowd', async (req, res) => {
    try {
        const { busId, crowdLevel } = req.body;

        if (!busId || !crowdLevel) {
            return res.status(400).json({ success: false, message: 'Bus ID and Crowd Level required' });
        }

        const allowedLevels = ['Low', 'Medium', 'High'];
        if (!allowedLevels.includes(crowdLevel)) {
            return res.status(400).json({ success: false, message: 'Invalid Crowd Level' });
        }

        const updatedBus = await Bus.findOneAndUpdate(
            { busId: busId },
            { crowdLevel: crowdLevel, lastUpdated: Date.now() },
            { new: true }
        );

        if (!updatedBus) {
            // If bus doesn't exist in live table (only instantiated via driver), usually we might want to create it or error.
            // For now, let's assume it exists or create placeholder
            return res.status(404).json({ success: false, message: 'Bus not found (Start Driver App first)' });
        }

        res.json({ success: true, message: `Crowd updated to ${crowdLevel}`, bus: updatedBus });
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

// Route Visualization (Mock Data)
app.get('/api/routes', (req, res) => {
    // Mock Route: Vadodara Central Bus Station -> Manjalpur (Approximate Tracing)
    // Detailed points to show "Turns" on the map
    const routePoints = [
        { lat: 22.3129, lng: 73.1812 }, // Start: Central Bus Station
        { lat: 22.3125, lng: 73.1815 }, // Exit Depot
        { lat: 22.3100, lng: 73.1815 }, // Go South
        { lat: 22.3100, lng: 73.1850 }, // Turn East (Turn 1)
        { lat: 22.3050, lng: 73.1850 }, // Go South
        { lat: 22.3000, lng: 73.1900 }, // Diagonal/Turn
        { lat: 22.2900, lng: 73.1900 }, // Keep South
        { lat: 22.2800, lng: 73.1920 }, // Slight Shift
        { lat: 22.2746, lng: 73.1916 }  // End: Manjalpur
    ];
    res.json({ success: true, points: routePoints });
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

// Bus Stand Routes
const BusStand = require('./models/BusStand');

// Seed Vadodara Bus Stands (Run via Browser or Postman)
app.get('/api/seed-stands', async (req, res) => {
    try {
        const vadodaraStands = [
            { name: "Parul University Main Gate", lat: 22.287752183364006, lng: 73.36460548199916, isDepot: false },
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
