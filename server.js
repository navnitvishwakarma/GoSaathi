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
            { name: "Vadodara Central Bus Station (GSRTC)", lat: 22.3129, lng: 73.1812, isDepot: true },
            { name: "Nyay Mandir", lat: 22.2994, lng: 73.2081, isDepot: false },
            { name: "Makarpura Bus Depot", lat: 22.2536, lng: 73.1947, isDepot: true },
            { name: "Amit Nagar Circle", lat: 22.3357, lng: 73.1950, isDepot: false },
            { name: "Airport Circle (Harni)", lat: 22.3361, lng: 73.2263, isDepot: false },
            { name: "Gotri", lat: 22.3243, lng: 73.1444, isDepot: false },
            { name: "Karelibaug", lat: 22.3175, lng: 73.1995, isDepot: false },
            { name: "Manjalpur", lat: 22.2746, lng: 73.1916, isDepot: false },
            // Parul University & Nearby
            { name: "Parul University Main Gate", lat: 22.287809577883444, lng: 73.36489100751052, isDepot: false },
            { name: "Limda Bus Stand", lat: 22.2910, lng: 73.3550, isDepot: false },
            { name: "Waghodia Chokdi", lat: 22.2980, lng: 73.2360, isDepot: false }
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
