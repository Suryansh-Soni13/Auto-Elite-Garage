// Core Application Logic
let generatedOTP = '';
let currentBookingInProgress = null;
let currentServiceJobId = null;

// --- AUTH LOGIC ---
function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    const role = document.getElementById('loginRole').value;
    const errorEl = document.getElementById('loginError');

    const users = Storage.get('users');
    const user = users.find(u => u.email === email && u.pass === pass && u.role === role);

    if (user) {
        localStorage.setItem('autoelite_session', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        errorEl.innerText = 'Invalid credentials or role selection.';
    }
}

function handleRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPass').value;

    if (!name || !email || !pass) return alert('Please fill all fields');

    const users = Storage.get('users');
    if (users.find(u => u.email === email)) return alert('Email already exists');

    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        pass,
        role: 'customer'
    };

    users.push(newUser);
    Storage.save('users', users);
    alert('Registration successful! Please login.');
}

function logout() {
    localStorage.removeItem('autoelite_session');
    window.location.href = 'index.html';
}

// --- DASHBOARD LOGIC ---
function initDashboard() {
    const user = Storage.currentUser();
    if (!user) {
        if (window.location.pathname.includes('dashboard.html')) window.location.href = 'login.html';
        return;
    }

    if (document.getElementById('userName')) {
        document.getElementById('userName').innerText = user.name;
        document.getElementById('userRole').innerText = user.role;
    }

    // Role-based Nav
    const navBook = document.getElementById('nav-book');
    const navMech = document.getElementById('nav-mechanic');
    const navAdmin = document.getElementById('nav-admin');
    const navDaily = document.getElementById('nav-daily-report');
    const navReports = document.getElementById('nav-reports');

    if (user.role === 'admin') {
        if (navAdmin) navAdmin.style.display = 'block';
        if (navDaily) navDaily.style.display = 'block';
    } else if (user.role === 'mechanic') {
        if (navMech) navMech.style.display = 'block';
    } else {
        if (navBook) navBook.style.display = 'block';
        if (navReports) navReports.style.display = 'block';
    }

    loadOverviewStats();
    loadActivityTable();

    if (document.getElementById('analysisDate')) {
        document.getElementById('analysisDate').valueAsDate = new Date();
    }
}

function showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const viewEl = document.getElementById(viewName + 'View');
    if (viewEl) viewEl.style.display = 'block';

    document.getElementById('viewTitle').innerText = viewName.charAt(0).toUpperCase() + viewName.slice(1) + (viewName === 'mechanic' ? ' Jobs' : ' Analysis');

    const links = document.querySelectorAll('.nav-link');
    links.forEach(l => {
        if (l.innerText.toLowerCase().includes(viewName)) l.classList.add('active');
    });

    if (viewName === 'admin') loadAdminPanel();
    if (viewName === 'mechanic') loadMechanicPanel();
    if (viewName === 'daily') loadDailyAnalysis();
    if (viewName === 'reports') loadReportsTable();
    if (viewName === 'overview') {
        loadOverviewStats();
        loadActivityTable();
    }
}

function loadOverviewStats() {
    const user = Storage.currentUser();
    const bookings = Storage.get('bookings');
    const myBookings = user.role === 'customer' ? bookings.filter(b => b.userId === user.id) : bookings;

    const grid = document.getElementById('statGrid');
    if (!grid) return;

    const confirmed = myBookings.filter(b => b.status === 'confirmed').length;
    const underService = myBookings.filter(b => b.status === 'under service').length;
    const done = myBookings.filter(b => b.status === 'service done').length;
    const pending = myBookings.filter(b => b.status === 'pending').length;

    grid.innerHTML = `
        <div class="stat-card animate">
            <h3>Total Bookings</h3>
            <div class="value">${myBookings.length}</div>
        </div>
        <div class="stat-card animate" style="animation-delay:0.1s">
            <h3>Active Jobs</h3>
            <div class="value" style="color:var(--primary)">${confirmed + underService}</div>
        </div>
        <div class="stat-card animate" style="animation-delay:0.2s">
            <h3>Completed</h3>
            <div class="value" style="color:var(--secondary)">${done}</div>
        </div>
        <div class="stat-card animate" style="animation-delay:0.3s">
            <h3>Unverified</h3>
            <div class="value" style="color:var(--accent)">${pending}</div>
        </div>
    `;
}

function loadActivityTable() {
    const user = Storage.currentUser();
    const bookings = Storage.get('bookings');
    const table = document.getElementById('activityTable');
    if (!table) return;

    let displayBookings = user.role === 'customer' ? bookings.filter(b => b.userId === user.id) : bookings;

    table.innerHTML = displayBookings.length > 0 ? '' : '<tr><td colspan="5" style="text-align:center;">No recent activity</td></tr>';

    displayBookings.slice().reverse().forEach(b => {
        const tr = document.createElement('tr');
        tr.className = 'animate';

        let actionBtn = '';
        if (b.status === 'pending' && user.role === 'customer') {
            actionBtn = `<button class="btn btn-primary" style="padding:0.4rem 1rem; font-size:0.8rem;" onclick="openPaymentModal(${b.id})">Verify Now</button>`;
        } else if (b.status === 'service done') {
            actionBtn = `<button class="btn btn-outline" style="padding:0.4rem 1rem; font-size:0.8rem;" onclick="downloadPDF(${b.id})">Get Report</button>`;
        } else {
            actionBtn = `<span style="color:var(--text-muted); font-size:0.8rem;">Processing</span>`;
        }

        const priceText = b.amount ? `₹${b.amount}` : "TBD";

        tr.innerHTML = `
            <td>#${b.id}</td>
            <td><strong>${b.car}</strong><br><small style="color:var(--text-muted)">${b.plate}</small></td>
            <td>${b.date}</td>
            <td><span class="badge badge-${b.status.replace(' ', '-')}">${b.status}</span></td>
            <td>${actionBtn}<br><small>${priceText}</small></td>
        `;
        table.appendChild(tr);
    });
}

function loadReportsTable() {
    const user = Storage.currentUser();
    const bookings = Storage.get('bookings');
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;

    const myBookings = bookings.filter(b => b.userId === user.id && b.status === 'service done');
    tbody.innerHTML = myBookings.length > 0 ? '' : '<tr><td colspan="5" style="text-align:center;">No completed service reports found.</td></tr>';

    myBookings.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${b.id}</td>
            <td>${b.type}</td>
            <td>${b.date}</td>
            <td>₹${b.amount || 0}</td>
            <td><button class="btn btn-primary" style="padding:4px 12px; font-size:0.8rem;" onclick="downloadPDF(${b.id})">Download PDF</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- ADMIN DAILY ANALYSIS ---
function loadDailyAnalysis() {
    const bookings = Storage.get('bookings');
    const selectedDate = document.getElementById('analysisDate').value;
    const tbody = document.getElementById('dailyTableBody');
    const dailyStats = document.getElementById('dailyStats');
    if (!tbody || !selectedDate) return;

    const dayJobs = bookings.filter(b => b.date === selectedDate);
    const uniqueOwners = new Set(dayJobs.map(b => b.userId)).size;
    const revenue = dayJobs.filter(b => b.status !== 'pending').reduce((s, b) => s + (parseInt(b.amount) || 0), 0);

    dailyStats.innerHTML = `
        <div class="stat-card">
            <h3>Total Visits Today</h3>
            <div class="value">${dayJobs.length}</div>
        </div>
         <div class="stat-card">
            <h3>Unique Owners</h3>
            <div class="value">${uniqueOwners}</div>
        </div>
         <div class="stat-card">
            <h3>Daily Revenue</h3>
            <div class="value" style="color:var(--secondary)">₹${revenue}</div>
        </div>
    `;

    tbody.innerHTML = dayJobs.length > 0 ? '' : '<tr><td colspan="5" style="text-align:center;">No records for this date.</td></tr>';

    dayJobs.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${b.customerName}</td>
            <td><strong>${b.car}</strong></td>
            <td>${b.date}</td>
            <td>${b.type}</td>
            <td><span class="badge badge-${b.status.replace(' ', '-')}">${b.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- MECHANIC LOGIC ---
function loadMechanicPanel() {
    const bookings = Storage.get('bookings');
    const tbody = document.getElementById('mechanicTableBody');
    if (!tbody) return;

    const jobs = bookings.filter(b => ['confirmed', 'under service', 'service done'].includes(b.status));
    tbody.innerHTML = jobs.length > 0 ? '' : '<tr><td colspan="5" style="text-align:center;">No active jobs found.</td></tr>';

    jobs.reverse().forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${b.id}</td>
            <td>${b.customerName}</td>
            <td>${b.car}</td>
            <td><span class="badge badge-${b.status.replace(' ', '-')}">${b.status}</span></td>
            <td><button class="btn btn-primary" style="padding:4px 12px; font-size:0.8rem;" onclick="openServiceModal(${b.id})">Update</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function openServiceModal(id) {
    currentServiceJobId = id;
    const bookings = Storage.get('bookings');
    const job = bookings.find(b => b.id === id);
    const services = Storage.get('services');

    document.getElementById('serviceModal').style.display = 'flex';
    document.getElementById('serviceModalTitle').innerText = `${job.car} - #${job.id}`;
    document.getElementById('serviceInfo').innerText = `Owner: ${job.customerName} | License: ${job.plate}`;
    document.getElementById('jobStatusSelect').value = job.status;
    document.getElementById('jobCostInput').value = job.amount || '';

    const checklist = document.getElementById('serviceChecklist');
    checklist.innerHTML = '';

    services.forEach((s, i) => {
        const isChecked = job.tasks && job.tasks.includes(s);
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '0.5rem';
        div.innerHTML = `
            <input type="checkbox" id="task-${i}" value="${s}" ${isChecked ? 'checked' : ''}>
            <label for="task-${i}" style="font-size:0.85rem; cursor:pointer;">${s}</label>
        `;
        checklist.appendChild(div);
    });
}

function saveServiceJob() {
    const bookings = Storage.get('bookings');
    const jobIdx = bookings.findIndex(b => b.id === currentServiceJobId);

    if (jobIdx > -1) {
        const selectedTasks = [];
        document.querySelectorAll('#serviceChecklist input:checked').forEach(input => {
            selectedTasks.push(input.value);
        });

        bookings[jobIdx].tasks = selectedTasks;
        bookings[jobIdx].status = document.getElementById('jobStatusSelect').value;
        bookings[jobIdx].amount = document.getElementById('jobCostInput').value || 0;

        Storage.save('bookings', bookings);
        alert('Service progress updated.');
        document.getElementById('serviceModal').style.display = 'none';
        loadMechanicPanel();
    }
}

function closeServiceModal() {
    document.getElementById('serviceModal').style.display = 'none';
}

// --- BOOKING LOGIC ---
function checkSlots() {
    const date = document.getElementById('bookDate').value;
    if (!date) return;
    const bookings = Storage.get('bookings');
    const dayBookings = bookings.filter(b => b.date === date).length;
    const available = 20 - dayBookings;
    const counter = document.getElementById('slotCounter');
    if (counter) {
        counter.innerText = `${available} slots remaining.`;
        counter.style.color = available > 5 ? 'var(--secondary)' : 'var(--danger)';
    }
    return available > 0;
}

function requestBooking() {
    const user = Storage.currentUser();
    const car = document.getElementById('bookCar').value;
    const plate = document.getElementById('bookPlate').value;
    const type = document.getElementById('bookType').value;
    const date = document.getElementById('bookDate').value;

    if (!car || !plate || !date) return alert('Please fill missing fields.');
    if (!checkSlots()) return alert('Full bookings for this date.');

    const bookings = Storage.get('bookings');
    const newBooking = {
        id: 100 + bookings.length + 1,
        userId: user.id,
        customerName: user.name,
        car, plate, date, type,
        status: 'pending',
        amount: 0, // Set by mechanic later
        tasks: []
    };

    currentBookingInProgress = newBooking;
    openPaymentModal();
}

function openPaymentModal(existingId = null) {
    if (existingId) {
        const bookings = Storage.get('bookings');
        currentBookingInProgress = bookings.find(b => b.id === existingId);
    }
    const user = Storage.currentUser();
    const pEl = document.getElementById('phoneLast4');
    if (pEl) pEl.innerText = user.phone ? user.phone.slice(-4) : '0000';
    document.getElementById('paymentModal').style.display = 'flex';
    document.getElementById('paymentStep1').style.display = 'block';
    document.getElementById('paymentStep2').style.display = 'none';
}

function sendOTP() {
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    document.getElementById('generatedOTP').innerText = generatedOTP;
    document.getElementById('paymentStep1').style.display = 'none';
    document.getElementById('paymentStep2').style.display = 'block';
    document.getElementById('otpPopup').style.display = 'block';
    setTimeout(() => { document.getElementById('otpPopup').style.display = 'none'; }, 10000);
}

function verifyBooking() {
    const entered = ['otp1', 'otp2', 'otp3', 'otp4'].map(id => document.getElementById(id).value).join('');
    if (entered === generatedOTP) {
        const bookings = Storage.get('bookings');
        const idx = bookings.findIndex(b => b.id === currentBookingInProgress.id);
        if (idx > -1) bookings[idx].status = 'confirmed';
        else {
            currentBookingInProgress.status = 'confirmed';
            bookings.push(currentBookingInProgress);
        }
        Storage.save('bookings', bookings);
        alert('Booking Confirmed! Mechanic will provide cost details.');
        closeModal();
        showView('overview');
    } else {
        alert('Invalid OTP.');
    }
}

function closeModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('otpPopup').style.display = 'none';
}

function loadAdminPanel() {
    const bookings = Storage.get('bookings');
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    const confirmedBookings = bookings.filter(b => ['confirmed', 'under service', 'service done'].includes(b.status));
    const totalEarned = confirmedBookings.reduce((sum, b) => sum + (parseInt(b.amount) || 0), 0);

    document.getElementById('totalEarned').innerText = `₹${totalEarned}`;
    document.getElementById('totalBookings').innerText = bookings.length;

    tbody.innerHTML = '';
    bookings.slice().reverse().forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${b.id}</td>
            <td>${b.customerName}</td>
            <td>${b.car}</td>
            <td>${b.date}</td>
            <td>₹${b.amount || 0}</td>
            <td><span class="badge badge-${b.status.replace(' ', '-')}">${b.status}</span></td>
            <td><button class="btn btn-outline" style="padding:2px 8px; font-size:0.75rem;" onclick="cancelBooking(${b.id})">Cancel</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function cancelBooking(id) {
    if (confirm('Cancel this booking?')) {
        const bookings = Storage.get('bookings');
        const i = bookings.findIndex(b => b.id === id);
        if (i > -1) {
            bookings[i].status = 'cancelled';
            Storage.save('bookings', bookings);
            loadAdminPanel();
        }
    }
}

function downloadPDF(id) {
    const b = Storage.get('bookings').find(x => x.id === id);
    if (!b) return;
    let tl = (b.tasks && b.tasks.length > 0) ? b.tasks.map(t => "✔ " + t).join("\n") : "Standard service check.";
    const report = `
========================================
       AUTOELITE GARAGE - SERVICE REPORT
========================================
Invoice #: AE-${b.id}
Customer: ${b.customerName}
Vehicle: ${b.car} | Plate: ${b.plate}
Date: ${b.date}
----------------------------------------
SERVICES PERFORMED:
${tl}
----------------------------------------
AMOUNT PAID: ₹${b.amount || 0}
========================================
    `;
    const blob = new Blob([report], { type: 'text/plain' });
    const u = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `Invoice_AE_${id}.txt`;
    a.click();
}

function moveFocus(current, nextId) {
    if (current.value.length >= 1) {
        document.getElementById(nextId).focus();
    }
}

function backupData() {
    const data = {
        users: Storage.get('users'),
        bookings: Storage.get('bookings'),
        services: Storage.get('services')
    };
    const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autoelite_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    alert('System Data exported! Save this file in your "data" folder for backup.');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.users && data.bookings) {
                Storage.save('users', data.users);
                Storage.save('bookings', data.bookings);
                if (data.services) Storage.save('services', data.services);
                alert('Data imported successfully! The dashboard will now reload.');
                window.location.reload();
            } else {
                alert('Invalid data format.');
            }
        } catch (err) {
            alert('Error reading file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', initDashboard);
