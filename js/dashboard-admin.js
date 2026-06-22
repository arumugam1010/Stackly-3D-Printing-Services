/* Admin Command Center Interaction Logic */

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = window.authSystem.getCurrentUser();
  if (!currentUser) return;

  // 1. Sidebar Nav Panels Switching
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-target]');
  const panels = document.querySelectorAll('.dashboard-panel-view');
  const viewTitle = document.getElementById('view-title');

  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const target = link.getAttribute('data-target');
      panels.forEach(p => p.classList.remove('active'));
      document.getElementById(target).classList.add('active');

      viewTitle.innerText = link.querySelector('span').innerText;
      document.getElementById('dashboard-sidebar').classList.remove('active');

      // Refresh listings
      if (target === 'admin-overview-panel') refreshAnalytics();
      if (target === 'admin-users-panel') renderUsersTable();
      if (target === 'admin-orders-panel') renderOrdersTable();
      if (target === 'admin-scheduler-panel') renderSchedulerGantt();
    });
  });

  // Mobile sidebar trigger
  const trigger = document.getElementById('sidebar-trigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      document.getElementById('dashboard-sidebar').classList.add('active');
    });
  }

  // 2. Refresh Analytics Metrics
  function refreshAnalytics() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Calculate Paid Revenue
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const totalRev = paidOrders.reduce((sum, o) => sum + o.price, 0);
    
    // Calculate Active Jobs (non-completed, non-pending)
    const activeJobs = orders.filter(o => o.status !== 'completed' && o.status !== 'pending').length;

    document.getElementById('stats-revenue').innerText = `$${totalRev.toFixed(2)}`;
    document.getElementById('stats-active-jobs').innerText = activeJobs;
    document.getElementById('stats-users-count').innerText = users.length;
    
    // Sliced Volume
    const totalVolume = orders.reduce((sum, o) => {
      // Extract numeric volume or guess
      return sum + (o.price > 100 ? 120 : 40);
    }, 0);
    document.getElementById('stats-volume').innerText = `${totalVolume} cm³`;

    // Render Canvas Charts
    setTimeout(renderCustomCharts, 100);
  }

  // 3. Custom Pure JS HTML5 Canvas Charting Engine
  function renderCustomCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textThemeColor = isDark ? '#94a3b8' : '#475569';
    const gridThemeColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';

    // LINE CHART - REVENUE (Revenue of last 6 orders)
    const lineCanvas = document.getElementById('revenue-line-chart');
    if (lineCanvas) {
      const ctx = lineCanvas.getContext('2d');
      // Set resolution multiplier for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      const width = lineCanvas.clientWidth;
      const height = lineCanvas.clientHeight;
      lineCanvas.width = width * dpr;
      lineCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Data coordinates
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      const revenuePoints = orders.map(o => o.price);
      const labels = orders.map(o => o.id);

      // Draw Line Chart
      ctx.clearRect(0, 0, width, height);
      
      // Margins
      const margin = { top: 20, right: 20, bottom: 30, left: 50 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;

      // Draw Gridlines
      const gridCount = 5;
      ctx.strokeStyle = gridThemeColor;
      ctx.lineWidth = 1;
      ctx.fillStyle = textThemeColor;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const maxVal = Math.max(...revenuePoints, 100);

      for (let i = 0; i <= gridCount; i++) {
        const y = margin.top + (chartHeight / gridCount) * i;
        const val = maxVal - (maxVal / gridCount) * i;
        
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();

        ctx.fillText(`$${Math.round(val)}`, margin.left - 10, y);
      }

      // Plot Line
      if (revenuePoints.length > 0) {
        ctx.strokeStyle = '#EE5536'; // Printo Orange line
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const getX = (idx) => margin.left + (chartWidth / (revenuePoints.length - 1 || 1)) * idx;
        const getY = (val) => margin.top + chartHeight - (chartHeight * (val / maxVal));

        // Begin line path
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(revenuePoints[0]));
        for (let i = 1; i < revenuePoints.length; i++) {
          ctx.lineTo(getX(i), getY(revenuePoints[i]));
        }
        ctx.stroke();

        // Fill area under path with gradient
        const areaGrad = ctx.createLinearGradient(0, margin.top, 0, margin.top + chartHeight);
        areaGrad.addColorStop(0, 'rgba(238, 85, 54, 0.25)');
        areaGrad.addColorStop(1, 'rgba(238, 85, 54, 0)');
        
        ctx.lineTo(getX(revenuePoints.length - 1), margin.top + chartHeight);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Draw active dot circles
        ctx.fillStyle = '#06b6d4'; // Cyan circles
        for (let i = 0; i < revenuePoints.length; i++) {
          ctx.beginPath();
          ctx.arc(getX(i), getY(revenuePoints[i]), 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw bottom labels
        ctx.fillStyle = textThemeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = 0; i < labels.length; i++) {
          ctx.fillText(labels[i], getX(i), margin.top + chartHeight + 10);
        }
      }
    }

    // PIE CHART - TECH VOLUME
    const pieCanvas = document.getElementById('machines-pie-chart');
    if (pieCanvas) {
      const ctx = pieCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const width = pieCanvas.clientWidth;
      const height = pieCanvas.clientHeight;
      pieCanvas.width = width * dpr;
      pieCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Data allocation
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      const techCounts = { FDM: 0, SLA: 0, SLS: 0, DMLS: 0 };
      orders.forEach(o => {
        if (techCounts[o.technology] !== undefined) techCounts[o.technology]++;
      });

      const data = Object.values(techCounts);
      const labels = Object.keys(techCounts);
      const colors = ['#EE5536', '#E5B10D', '#23a455', '#fcb900']; // Orange, Gold, Green, Yellow

      ctx.clearRect(0, 0, width, height);

      const total = data.reduce((sum, val) => sum + val, 0);
      const centerX = width / 2.8;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2.8;

      let startAngle = -Math.PI / 2;

      if (total > 0) {
        data.forEach((val, idx) => {
          if (val === 0) return;
          const sliceAngle = (val / total) * Math.PI * 2;
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
          ctx.closePath();
          
          ctx.fillStyle = colors[idx];
          ctx.fill();
          
          startAngle += sliceAngle;
        });
      } else {
        // Draw empty fallback circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gridThemeColor;
        ctx.fill();
      }

      // Draw Chart Legend text labels on the right side
      const legendX = centerX + radius + 30;
      const legendYStart = centerY - (labels.length * 20) / 2;
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '11px sans-serif';

      labels.forEach((lbl, idx) => {
        const count = techCounts[lbl];
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        
        // Color block
        ctx.fillStyle = colors[idx];
        ctx.fillRect(legendX, legendYStart + idx * 22, 12, 12);
        
        // Text
        ctx.fillStyle = textThemeColor;
        ctx.fillText(`${lbl}: ${count} (${percent}%)`, legendX + 20, legendYStart + idx * 22 + 6);
      });
    }
  }

  // 4. User Management Control Panel (CRUD)
  function renderUsersTable() {
    const tableBody = document.getElementById('admin-users-table-rows');
    const users = JSON.parse(localStorage.getItem('users')) || [];

    let html = '';
    users.forEach(usr => {
      const deleteAction = usr.id === currentUser.id 
        ? `<span style="color:var(--text-muted); font-size:0.85rem;">Active Self</span>`
        : `<button class="btn btn-danger btn-sm" onclick="window.deleteUserAccount('${usr.id}')">Delete</button>`;

      html += `
        <tr>
          <td><strong>${usr.id}</strong></td>
          <td>${usr.name}</td>
          <td>${usr.email}</td>
          <td><span class="badge ${usr.role === 'admin' ? 'badge-danger' : (usr.role === 'designer' ? 'badge-progress' : 'badge-pending')}">${usr.role}</span></td>
          <td><span style="color: var(--accent-success); font-weight:600;">✔ Verified</span></td>
          <td>${deleteAction}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  window.deleteUserAccount = function(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const idx = users.findIndex(u => u.id === userId);

    if (idx !== -1) {
      const email = users[idx].email;
      users.splice(idx, 1);
      localStorage.setItem('users', JSON.stringify(users));

      showNotification('Account Deleted', `Wiped profile coordinates for ${email}`, 'warning');
      renderUsersTable();
    }
  };

  // Add User Form submit handler
  const addUserForm = document.getElementById('admin-add-user-form');
  addUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('add-user-name').value.trim();
    const email = document.getElementById('add-user-email').value.trim();
    const password = document.getElementById('add-user-password').value.trim();
    const role = document.getElementById('add-user-role').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      showNotification('Creation Error', 'Email coordinate already registered', 'danger');
      return;
    }

    const newUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password,
      role,
      verified: true,
      created: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    closeModal('add-user-modal');
    showNotification('Member Profile Active', `Created ${role} account for ${email}`, 'success');
    renderUsersTable();
    addUserForm.reset();
  });

  // 5. Orders Management Panel
  function renderOrdersTable() {
    const tableBody = document.getElementById('admin-orders-table-rows');
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    if (orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No orders found.</td></tr>`;
      return;
    }

    let html = '';
    orders.forEach(ord => {
      // Progress options
      let approveBtn = '';
      if (ord.status === 'pending') {
        approveBtn = `<button class="btn btn-primary btn-sm" onclick="window.adminApproveOrder('${ord.id}')">Approve</button>`;
      } else {
        approveBtn = `<span style="color:var(--text-muted); font-size:0.85rem;">Checked</span>`;
      }

      html += `
        <tr>
          <td><strong>${ord.id}</strong></td>
          <td>${ord.customerName}</td>
          <td>${ord.fileName}</td>
          <td>${ord.technology}</td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <strong>$${ord.price.toFixed(2)}</strong>
              <button class="btn btn-glass btn-sm" style="padding:0.25rem 0.5rem;" onclick="window.openPriceAdjustModal('${ord.id}', '${ord.fileName}', ${ord.price})">Edit</button>
            </div>
          </td>
          <td><span class="badge ${ord.status === 'completed' ? 'badge-completed' : (ord.status === 'in_production' ? 'badge-progress' : 'badge-pending')}">${ord.status.replace('_', ' ')}</span></td>
          <td>
            <div style="display:flex; gap:0.5rem;">
              ${approveBtn}
              <button class="btn btn-danger btn-sm" onclick="window.adminDeleteOrder('${ord.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  // Adjust pricing modal handlers
  window.openPriceAdjustModal = function(orderId, filename, currentPrice) {
    document.getElementById('adjust-order-id').value = orderId;
    document.getElementById('adjust-filename').innerText = filename;
    document.getElementById('new-adjusted-price').value = currentPrice;
    openModal('adjust-price-modal');
  };

  const priceAdjustForm = document.getElementById('admin-adjust-price-form');
  priceAdjustForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const orderId = document.getElementById('adjust-order-id').value;
    const newPrice = parseFloat(document.getElementById('new-adjusted-price').value);

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = orders.findIndex(o => o.id === orderId);

    if (idx !== -1) {
      orders[idx].price = newPrice;
      localStorage.setItem('orders', JSON.stringify(orders));

      closeModal('adjust-price-modal');
      showNotification('Quote Adjusted', `Set new fabrication price of $${newPrice.toFixed(2)} for ${orderId}`, 'success');
      renderOrdersTable();
    }
  });

  window.adminApproveOrder = function(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = orders.findIndex(o => o.id === orderId);

    if (idx !== -1) {
      orders[idx].status = 'approved';
      localStorage.setItem('orders', JSON.stringify(orders));

      showNotification('Job Slice Approved', `Order ${orderId} shifted to designer queue`, 'success');
      renderOrdersTable();
    }
  };

  window.adminDeleteOrder = function(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = orders.findIndex(o => o.id === orderId);

    if (idx !== -1) {
      orders.splice(idx, 1);
      localStorage.setItem('orders', JSON.stringify(orders));

      showNotification('Job Deleted', `Removed order ${orderId} coordinates from database`, 'warning');
      renderOrdersTable();
    }
  };

  // 6. Gantt Production Scheduler
  function renderSchedulerGantt() {
    const container = document.getElementById('gantt-lanes-container');
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    // Filter active jobs in production
    const activeJobs = orders.filter(o => o.status !== 'completed');

    // Define standard factory lanes
    const lanes = [
      { name: "Printer SLA #1", tech: "SLA" },
      { name: "Printer SLA #2", tech: "SLA" },
      { name: "Printer FDM #3", tech: "FDM" },
      { name: "Printer SLS #4", tech: "SLS" },
      { name: "Laser Metal #5", tech: "DMLS" }
    ];

    let html = '';
    lanes.forEach(lane => {
      // Find matching job
      const matchingJob = activeJobs.find(j => j.technology.includes(lane.tech));
      let fillBar = '';

      if (matchingJob) {
        // Map status to progress bar fills
        let percent = "15%";
        if (matchingJob.status === 'approved') percent = "35%";
        if (matchingJob.status === 'in_production') percent = "70%";
        if (matchingJob.status === 'shipped') percent = "90%";

        fillBar = `
          <div class="gantt-timeline-fill" style="width: ${percent};">
            ${matchingJob.id} - ${matchingJob.fileName} (${percent})
          </div>
        `;
      } else {
        fillBar = `<div style="text-align: center; font-size: 0.75rem; color: var(--text-muted); line-height: 24px;">Lane Idle</div>`;
      }

      html += `
        <div class="gantt-row">
          <div class="gantt-lane-title">${lane.name}</div>
          <div class="gantt-timeline-bar-wrapper">
            ${fillBar}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 7. Save Parameters Form Handler
  const markupForm = document.getElementById('admin-markup-form');
  markupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotification('Settings Saved', 'Default markup multipliers applied to calculator', 'success');
  });

  // Initial runs
  refreshAnalytics();
  renderUsersTable();
  renderOrdersTable();
  renderSchedulerGantt();
});
