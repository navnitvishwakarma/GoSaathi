const mongoose = require('mongoose');

// Trip History Schema
const TripSchema = new mongoose.Schema({
    busId: String,
    route: String,
    driver: String,
    date: Date,
    startTime: String,
    endTime: String,
    duration: Number, // minutes
    delay: Number, // minutes
    status: { type: String, enum: ['completed', 'delayed', 'cancelled', 'active'] },
    passengers: Number
});

// Driver Performance Schema
const DriverSchema = new mongoose.Schema({
    driverId: String,
    name: String,
    contact: String,
    rating: { type: Number, default: 5.0 },
    punctualityScore: { type: Number, default: 100 },
    totalTrips: { type: Number, default: 0 },
    onTimeTrips: { type: Number, default: 0 },
    violations: {
        speed: { type: Number, default: 0 },
        harshBraking: { type: Number, default: 0 },
        rashDriving: { type: Number, default: 0 }
    },
    status: { type: String, default: 'active' }
});

// Incident Schema
const IncidentSchema = new mongoose.Schema({
    type: { type: String, enum: ['Accident', 'Breakdown', 'Delay', 'Other'] },
    severity: { type: String, enum: ['Low', 'Medium', 'Critical'] },
    busId: String,
    driver: String,
    location: String,
    timestamp: { type: Date, default: Date.now },
    status: { type: String, default: 'Open' }, // Open, Resolved
    description: String
});

// Maintenance Schema
const MaintenanceSchema = new mongoose.Schema({
    busId: String,
    lastServiceDate: Date,
    nextServiceDate: Date,
    mileage: Number,
    status: { type: String, enum: ['Good', 'Due Soon', 'Overdue', 'In Service'] },
    notes: String
});

// Communication/Announcement Schema
const AnnouncementSchema = new mongoose.Schema({
    title: String,
    message: String,
    target: { type: String, enum: ['All', 'Drivers', 'Passengers'] },
    timestamp: { type: Date, default: Date.now },
    sender: String
});

module.exports = {
    Trip: mongoose.model('Trip', TripSchema),
    Driver: mongoose.model('Driver', DriverSchema),
    Incident: mongoose.model('Incident', IncidentSchema),
    Maintenance: mongoose.model('Maintenance', MaintenanceSchema),
    Announcement: mongoose.model('Announcement', AnnouncementSchema)
};
