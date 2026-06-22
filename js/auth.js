/* Simulated LocalStorage Database and Auth Routines */

// 1. Initialize Mock Users Database
const DEFAULT_USERS = [
  {
    id: "usr_1",
    name: "Alex Johnson",
    email: "customer@stackly3d.com",
    password: "password",
    role: "customer",
    verified: true,
    created: "2026-01-10"
  },
  {
    id: "usr_2",
    name: "Marcus Vance",
    email: "designer@stackly3d.com",
    password: "password",
    role: "designer",
    verified: true,
    created: "2026-02-14"
  },
  {
    id: "usr_3",
    name: "Sarah Croft",
    email: "admin@stackly3d.com",
    password: "password",
    role: "admin",
    verified: true,
    created: "2025-12-01"
  }
];

if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
}

// 2. Initialize default orders, tasks, support tickets in DB if empty (to give a rich visual state to dashboards)
const INITIAL_ORDERS = [
  {
    id: "STK-9402",
    customerName: "Alex Johnson",
    customerId: "usr_1",
    fileName: "drone_propeller_v4.stl",
    fileSize: "14.2 MB",
    technology: "SLA (Stereolithography)",
    material: "Tough Resin (Grey)",
    infill: "80%",
    layerHeight: "50 microns",
    quantity: 4,
    price: 185.00,
    status: "in_production", // pending, approved, in_production, shipped, completed
    paymentStatus: "paid", // unpaid, paid, refunded
    submittedDate: "2026-06-20",
    estimatedDate: "2026-06-25",
    designerId: "usr_2",
    validationChecks: { thickness: true, geometry: true, printVolume: true }
  },
  {
    id: "STK-8319",
    customerName: "Alex Johnson",
    customerId: "usr_1",
    fileName: "prosthetic_hand_joint.obj",
    fileSize: "8.7 MB",
    technology: "FDM (Fused Deposition)",
    material: "ABS (Black)",
    infill: "40%",
    layerHeight: "150 microns",
    quantity: 1,
    price: 45.50,
    status: "completed",
    paymentStatus: "paid",
    submittedDate: "2026-06-12",
    estimatedDate: "2026-06-15",
    designerId: "usr_2",
    validationChecks: { thickness: true, geometry: true, printVolume: true }
  },
  {
    id: "STK-1104",
    customerName: "Emily Davis",
    customerId: "usr_temp",
    fileName: "engine_manifold_flow.cad",
    fileSize: "44.9 MB",
    technology: "DMLS (Direct Metal Laser)",
    material: "Titanium Alloy (Grade 5)",
    infill: "100%",
    layerHeight: "30 microns",
    quantity: 1,
    price: 1450.00,
    status: "pending",
    paymentStatus: "unpaid",
    submittedDate: "2026-06-22",
    estimatedDate: "2026-06-28",
    designerId: null,
    validationChecks: { thickness: false, geometry: false, printVolume: false }
  }
];

const INITIAL_TICKETS = [
  {
    id: "TCK-402",
    customerId: "usr_1",
    subject: "Mesh optimization support query",
    category: "Design Advice",
    status: "open", // open, closed
    messages: [
      { sender: "customer", text: "Hi, I uploaded a drone propeller mesh, but it gives a wall thickness warning. Can you help fix it?", date: "2026-06-21 14:22" },
      { sender: "designer", text: "Hello Alex. Yes, the thin edges on the outer blades are below 0.8mm. I will review and thicken them for printing.", date: "2026-06-21 16:45" }
    ]
  }
];

if (!localStorage.getItem('orders')) {
  localStorage.setItem('orders', JSON.stringify(INITIAL_ORDERS));
}
if (!localStorage.getItem('tickets')) {
  localStorage.setItem('tickets', JSON.stringify(INITIAL_TICKETS));
}

// 3. Authentication Functions
function registerUser(name, email, password, role) {
  const users = JSON.parse(localStorage.getItem('users'));
  
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: "Email is already registered" };
  }

  const newUser = {
    id: "usr_" + Math.random().toString(36).substr(2, 9),
    name,
    email,
    password,
    role,
    verified: false, // Must verify email
    created: new Date().toISOString().split('T')[0]
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  // Set temporary user in sessionStorage for verification
  sessionStorage.setItem('pendingVerifyUser', JSON.stringify(newUser));
  
  return { success: true, message: "Registration successful. Please verify email." };
}

function loginUser(email, password, role) {
  const users = JSON.parse(localStorage.getItem('users'));
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Dynamically register a new verified user for this demo session
    user = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email: email,
      password: password,
      role: role || "customer",
      verified: true,
      created: new Date().toISOString().split('T')[0]
    };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  } else {
    // Update existing user credentials and role to allow seamless login
    user.password = password;
    if (role) {
      user.role = role;
    }
    user.verified = true;
    
    // Update matching user inside users array
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
    }
    localStorage.setItem('users', JSON.stringify(users));
  }

  // Set active session
  sessionStorage.setItem('currentUser', JSON.stringify(user));
  
  // Redirect link based on role
  let redirectUrl = "";
  if (user.role === 'customer') redirectUrl = "dashboard-customer.html";
  else if (user.role === 'designer') redirectUrl = "dashboard-designer.html";
  else if (user.role === 'admin') redirectUrl = "dashboard-admin.html";

  return { success: true, redirect: redirectUrl, message: "Login successful" };
}

function verifyUserEmail(email) {
  const users = JSON.parse(localStorage.getItem('users'));
  const userIdx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

  if (userIdx !== -1) {
    users[userIdx].verified = true;
    localStorage.setItem('users', JSON.stringify(users));
    
    // Log user in directly
    sessionStorage.setItem('currentUser', JSON.stringify(users[userIdx]));
    sessionStorage.removeItem('pendingVerifyUser');
    
    let redirectUrl = "";
    if (users[userIdx].role === 'customer') redirectUrl = "dashboard-customer.html";
    else if (users[userIdx].role === 'designer') redirectUrl = "dashboard-designer.html";
    else if (users[userIdx].role === 'admin') redirectUrl = "dashboard-admin.html";
    
    return { success: true, redirect: redirectUrl };
  }
  return { success: false, message: "Verification failed. User not found." };
}

function getCurrentUser() {
  const user = sessionStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

function logoutUser() {
  sessionStorage.removeItem('currentUser');
  window.location.href = "login.html";
}

// 4. Role Guards (Check access on dashboards)
function checkDashboardAccess(allowedRole) {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    // Redirect to login if not logged in
    window.location.href = "login.html";
    return;
  }

  if (currentUser.role !== allowedRole) {
    // Redirect wrong role access to their own page or 404
    let dest = "login.html";
    if (currentUser.role === "customer") dest = "dashboard-customer.html";
    else if (currentUser.role === "designer") dest = "dashboard-designer.html";
    else if (currentUser.role === "admin") dest = "dashboard-admin.html";
    window.location.href = dest;
  }
}

// Expose functions globally
window.authSystem = {
  registerUser,
  loginUser,
  verifyUserEmail,
  getCurrentUser,
  logoutUser,
  checkDashboardAccess
};
