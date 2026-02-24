// Initial System Data if localStorage is empty
const INITIAL_DATA = {
    users: [
        { id: 1, name: 'Admin User', email: 'admin@test.com', pass: 'pass123', role: 'admin', phone: '9876543210' },
        { id: 2, name: 'Mike Mechanic', email: 'mech@test.com', pass: 'pass123', role: 'mechanic', phone: '9876543211' },
        { id: 3, name: 'John Customer', email: 'customer@test.com', pass: 'pass123', role: 'customer', phone: '9876543212' }
    ],
    bookings: [
        {
            id: 101,
            userId: 3,
            customerName: 'John Customer',
            car: 'Tesla Model S',
            plate: 'ELITE-01',
            date: '2026-02-14',
            type: 'Full Service',
            status: 'confirmed',
            amount: 299,
            tasks: []
        },
        {
            id: 102,
            userId: 3,
            customerName: 'John Customer',
            car: 'BMW M3',
            plate: 'SPEED-07',
            date: '2026-02-15',
            type: 'Oil Change',
            status: 'pending',
            amount: 99,
            tasks: []
        }
    ],
    services: [
        "Synthetic Oil Change",
        "Engine Diagnostics",
        "Brake Pad Replacement",
        "Tire Rotation & Balance",
        "Battery Health Check",
        "AC Refilling & Cleaning",
        "Transmission Fluid Flush",
        "Fuel System Cleaning",
        "Wheel Alignment",
        "Suspension Inspection",
        "Spark Plug Replacement",
        "Coolant System Service",
        "Air Filter Replacement",
        "Full Body Wax & Polish",
        "Interior Deep Detailing"
    ]
};

// Data Helpers
const Storage = {
    get: (key) => {
        const data = localStorage.getItem('autoelite_' + key);
        return data ? JSON.parse(data) : INITIAL_DATA[key];
    },
    save: (key, val) => {
        localStorage.setItem('autoelite_' + key, JSON.stringify(val));
    },
    currentUser: () => {
        const user = localStorage.getItem('autoelite_session');
        return user ? JSON.parse(user) : null;
    }
};

// Initialize if fresh
if (!localStorage.getItem('autoelite_users')) {
    Storage.save('users', INITIAL_DATA.users);
    Storage.save('bookings', INITIAL_DATA.bookings);
    Storage.save('services', INITIAL_DATA.services);
}
if (!localStorage.getItem('autoelite_services')) {
    Storage.save('services', INITIAL_DATA.services);
}
