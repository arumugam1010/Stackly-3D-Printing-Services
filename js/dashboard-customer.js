/* Customer Portal Interaction Logic */

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = window.authSystem.getCurrentUser();
  if (!currentUser) return;

  // Set Profile Initials & Name
  const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
  document.getElementById('user-avatar-initials').innerText = initials;
  document.getElementById('user-name-display').innerText = currentUser.name;

  // 1. Sidebar Nav Panel Splicing
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
      
      // Update header title
      viewTitle.innerText = link.querySelector('span').innerText;
      
      // Close sidebar on mobile
      document.getElementById('dashboard-sidebar').classList.remove('active');

      // Refresh data tables if switching
      if (target === 'tracking-panel') renderTrackingOrders();
      if (target === 'billing-panel') renderBillingInvoices();
      if (target === 'support-panel') renderSupportTickets();
    });
  });

  // Mobile sidebar burger toggler
  const trigger = document.getElementById('sidebar-trigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      document.getElementById('dashboard-sidebar').classList.add('active');
    });
  }

  // 2. Drag & Drop File Upload Simulator
  const dropZone = document.getElementById('drag-drop-zone');
  const fileInput = document.getElementById('file-uploader-input');
  
  const processingBox = document.getElementById('upload-processing-box');
  const estimatesBox = document.getElementById('upload-estimates-box');
  
  // Drag over states
  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) simulateMeshAnalysis(files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) simulateMeshAnalysis(fileInput.files[0]);
  });

  // Mock analysis metrics
  let uploadedFileDetails = { name: '', volume: 60, weight: 70, price: 35.00 };

  function simulateMeshAnalysis(file) {
    dropZone.style.display = 'none';
    processingBox.style.display = 'block';

    setTimeout(() => {
      processingBox.style.display = 'none';
      estimatesBox.style.display = 'block';

      // Generate realistic metrics
      const volume = Math.floor(Math.random() * 200) + 15; // 15 to 215 cm³
      const length = Math.floor(Math.random() * 120) + 40;
      const width = Math.floor(Math.random() * 80) + 30;
      const height = Math.floor(Math.random() * 80) + 20;
      
      uploadedFileDetails = {
        name: file.name,
        volume: volume,
        dims: `${length} x ${width} x ${height} mm`
      };

      document.getElementById('est-filename').innerText = file.name;
      document.getElementById('est-dims').innerText = `${length} x ${width} x ${height} mm`;
      document.getElementById('est-volume').innerText = `${volume} cm³`;

      // Trigger standard material population
      updateMaterialsList();
      recalculateOrderCosts();
    }, 1500);
  }

  // 3. Form Selections & Live Estimations
  const techSelect = document.getElementById('order-technology');
  const materialSelect = document.getElementById('order-material');
  const infillSelect = document.getElementById('order-infill');
  const resSelect = document.getElementById('order-resolution');
  const qtyInput = document.getElementById('order-qty');

  const MAT_DATABASE = {
    FDM: [
      { name: "PLA Plus (Polymers)", cost: 0.15, density: 1.24 },
      { name: "ABS Industrial (Polymers)", cost: 0.18, density: 1.04 }
    ],
    SLA: [
      { name: "Tough Resin (Resins)", cost: 0.45, density: 1.18 },
      { name: "Clear Bio-Resin (Resins)", cost: 0.65, density: 1.20 }
    ],
    SLS: [
      { name: "Nylon PA12 (SLS Nylon)", cost: 0.35, density: 1.15 }
    ],
    DMLS: [
      { name: "316L Stainless Steel (Metals)", cost: 2.50, density: 8.00 },
      { name: "Titanium Alloy (Metals)", cost: 8.50, density: 4.43 }
    ]
  };

  function updateMaterialsList() {
    const tech = techSelect.value;
    materialSelect.innerHTML = '';
    
    MAT_DATABASE[tech].forEach(mat => {
      const opt = document.createElement('option');
      opt.value = mat.name;
      opt.innerText = mat.name;
      opt.setAttribute('data-cost', mat.cost);
      opt.setAttribute('data-density', mat.density);
      materialSelect.appendChild(opt);
    });
  }

  techSelect.addEventListener('change', () => {
    updateMaterialsList();
    recalculateOrderCosts();
  });
  [materialSelect, infillSelect, resSelect, qtyInput].forEach(ctrl => {
    ctrl.addEventListener('change', recalculateOrderCosts);
    ctrl.addEventListener('input', recalculateOrderCosts);
  });

  function recalculateOrderCosts() {
    if (!materialSelect.options.length) return;
    
    const matOption = materialSelect.options[materialSelect.selectedIndex];
    const costPerGram = parseFloat(matOption.getAttribute('data-cost'));
    const density = parseFloat(matOption.getAttribute('data-density'));

    const infill = parseInt(infillSelect.value, 10);
    const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    
    // Weight calculation
    const infillFrac = (infill / 100) * 0.8 + 0.2;
    const weight = uploadedFileDetails.volume * density * infillFrac;
    
    uploadedFileDetails.weight = weight;
    document.getElementById('est-weight').innerText = `${weight.toFixed(2)} g`;

    // Multipliers for layer height
    let resMult = 1.0;
    if (resSelect.value === '50 microns') resMult = 1.6;
    else if (resSelect.value === '100 microns') resMult = 1.25;

    // Estimate total
    let basePrice = weight * costPerGram;
    let machineRate = (uploadedFileDetails.volume * 0.15) * resMult * 2.50;
    let singlePartCost = basePrice + machineRate;
    
    if (singlePartCost < 15.00) singlePartCost = 15.00;

    let subtotal = singlePartCost * qty;
    
    // Bulk discounts
    let discPercent = 0;
    if (qty >= 50) discPercent = 20;
    else if (qty >= 10) discPercent = 10;

    let finalPrice = subtotal * (1 - discPercent/100);
    uploadedFileDetails.price = finalPrice;
    
    document.getElementById('est-total-quoted').innerText = `$${finalPrice.toFixed(2)}`;
  }

  // 4. Project Order Submission Handler
  const submitForm = document.getElementById('submit-project-form');
  submitForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const newOrder = {
      id: "STK-" + Math.floor(1000 + Math.random() * 9000),
      customerName: currentUser.name,
      customerId: currentUser.id,
      fileName: uploadedFileDetails.name,
      fileSize: "12.8 MB",
      technology: techSelect.value,
      material: materialSelect.value,
      infill: infillSelect.value,
      layerHeight: resSelect.value,
      quantity: parseInt(qtyInput.value, 10),
      price: parseFloat(uploadedFileDetails.price.toFixed(2)),
      status: "pending",
      paymentStatus: "unpaid",
      submittedDate: new Date().toISOString().split('T')[0],
      estimatedDate: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
      designerId: null,
      validationChecks: { thickness: false, geometry: false, printVolume: false }
    };

    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));

    showNotification('Order Submitted', `${newOrder.id} is queued for design review`, 'success');
    
    // Reset file zone
    dropZone.style.display = 'flex';
    estimatesBox.style.display = 'none';
    submitForm.reset();

    // Route view tab to orders tracking
    document.querySelector('.sidebar-link[data-target="tracking-panel"]').click();
  });

  // 5. Render Orders Tracking Timelines
  function renderTrackingOrders() {
    const container = document.getElementById('tracking-cards-container');
    const emptyMsg = document.getElementById('tracking-list-empty');
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    const clientOrders = orders.filter(o => o.customerId === currentUser.id);

    if (clientOrders.length === 0) {
      emptyMsg.style.display = 'block';
      container.innerHTML = '';
      return;
    }
    emptyMsg.style.display = 'none';
    
    let html = '';
    clientOrders.forEach(ord => {
      // Map status values to timeline indicators
      const steps = ['pending', 'approved', 'in_production', 'shipped', 'completed'];
      const activeIdx = steps.indexOf(ord.status);
      
      const stepLabels = ['Submitted', 'Review Approved', 'In Fabrication', 'Shipped', 'Completed'];

      let stepperHtml = '';
      stepLabels.forEach((label, idx) => {
        let activeClass = '';
        if (idx <= activeIdx) activeClass = 'active';
        stepperHtml += `
          <div class="timeline-item ${activeClass}">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-title">${label}</div>
            </div>
          </div>
        `;
      });

      // Status Badge translation
      let badgeClass = 'badge-pending';
      if (ord.status === 'in_production') badgeClass = 'badge-progress';
      if (ord.status === 'completed') badgeClass = 'badge-completed';
      if (ord.status === 'approved') badgeClass = 'badge-progress';

      html += `
        <div class="glass-card" style="margin-bottom: 2rem; border-color: rgba(255,255,255,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge ${badgeClass}">${ord.status.replace('_', ' ')}</span>
              <strong style="margin-left: 0.5rem; font-family: var(--font-display);">${ord.id}</strong>
              <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 1rem;">Submitted on ${ord.submittedDate}</span>
            </div>
            <div>
              <span style="font-size: 0.9rem; color: var(--text-secondary); margin-right: 1.5rem;">Est Delivery: <strong>${ord.estimatedDate}</strong></span>
              <span style="font-weight: 700; color: var(--accent-secondary);">${ord.quantity}x ${ord.material}</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem; align-items: start;">
            <div>
              <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">File: <strong>${ord.fileName}</strong></p>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Technology: ${ord.technology}</p>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Layer Height: ${ord.layerHeight}</p>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Infill: ${ord.infill}</p>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">Payment: <span style="text-transform: capitalize; font-weight: 600; color: ${ord.paymentStatus === 'paid' ? 'var(--accent-success)' : 'var(--accent-warning)'}">${ord.paymentStatus}</span></p>
            </div>
            
            <div>
              <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem; font-weight:700;">Progress Timeline</h4>
              <div class="timeline" style="padding-left: 1.5rem;">
                ${stepperHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // 6. Invoices & Billing Records
  function renderBillingInvoices() {
    const tableBody = document.getElementById('billing-orders-table-rows');
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const clientOrders = orders.filter(o => o.customerId === currentUser.id);

    if (clientOrders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No invoices found.</td></tr>`;
      return;
    }

    let html = '';
    clientOrders.forEach(ord => {
      let payAction = '';
      if (ord.paymentStatus === 'unpaid') {
        payAction = `<button class="btn btn-primary btn-sm pay-trigger-btn" data-id="${ord.id}" data-filename="${ord.fileName}" data-price="${ord.price}">Pay Now</button>`;
      } else {
        payAction = `<span style="color: var(--text-muted); font-size: 0.85rem;">Completed</span>`;
      }

      html += `
        <tr>
          <td><strong>${ord.id}</strong></td>
          <td>${ord.fileName}</td>
          <td>${ord.submittedDate}</td>
          <td><strong>$${ord.price.toFixed(2)}</strong></td>
          <td><span class="badge ${ord.paymentStatus === 'paid' ? 'badge-completed' : 'badge-pending'}">${ord.paymentStatus}</span></td>
          <td>${payAction}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    // Hook click handlers for Pay buttons
    document.querySelectorAll('.pay-trigger-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const file = btn.getAttribute('data-filename');
        const price = btn.getAttribute('data-price');
        
        document.getElementById('pay-order-id').value = id;
        document.getElementById('pay-filename').innerText = file;
        document.getElementById('pay-price').innerText = `$${parseFloat(price).toFixed(2)}`;
        
        openModal('payment-modal');
      });
    });
  }

  // Billing Form Pay Submission Handler
  const checkoutForm = document.getElementById('stripe-checkout-form');
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const orderId = document.getElementById('pay-order-id').value;

    showNotification('Processing', 'Contacting banking rails...', 'info');

    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      const idx = orders.findIndex(o => o.id === orderId);

      if (idx !== -1) {
        orders[idx].paymentStatus = 'paid';
        // Auto progress status to approved if it was pending
        if (orders[idx].status === 'pending') {
          orders[idx].status = 'approved';
        }
        localStorage.setItem('orders', JSON.stringify(orders));

        closeModal('payment-modal');
        showNotification('Payment Complete', `Order ${orderId} has been successfully funded`, 'success');
        renderBillingInvoices();
        checkoutForm.reset();
      }
    }, 1500);
  });

  // 7. Support Center - Create Tickets and Message Threads
  function renderSupportTickets() {
    const container = document.getElementById('tickets-list-container');
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const clientTickets = tickets.filter(t => t.customerId === currentUser.id);

    if (clientTickets.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem 0;">No active help tickets.</div>`;
      return;
    }

    let html = '';
    clientTickets.forEach(tck => {
      const lastMsg = tck.messages[tck.messages.length - 1];
      
      html += `
        <div class="glass-card ticket-card-item" style="padding: 1.25rem; border-color: rgba(255,255,255,0.05); cursor: pointer;" data-id="${tck.id}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="color: var(--accent-secondary);">${tck.id} - ${tck.subject}</strong>
            <span class="badge ${tck.status === 'open' ? 'badge-progress' : 'badge-completed'}">${tck.status}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            Latest: "${lastMsg.text}"
          </p>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-align: right;">Updated ${lastMsg.date}</div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Message click triggers
    document.querySelectorAll('.ticket-card-item').forEach(card => {
      card.addEventListener('click', () => {
        const tckId = card.getAttribute('data-id');
        openTicketChat(tckId);
      });
    });
  }

  function openTicketChat(tckId) {
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const ticket = tickets.find(t => t.id === tckId);
    if (!ticket) return;

    document.getElementById('ticket-modal-id').value = tckId;
    document.getElementById('ticket-modal-title').innerText = `${ticket.id} - ${ticket.subject}`;

    const historyBox = document.getElementById('ticket-chat-history');
    let historyHtml = '';
    ticket.messages.forEach(m => {
      const isSenderUser = m.sender === 'customer';
      historyHtml += `
        <div class="chat-msg ${isSenderUser ? 'msg-user' : 'msg-bot'}" style="margin-bottom: 0.5rem; align-self: ${isSenderUser ? 'flex-end' : 'flex-start'}">
          <div>${m.text}</div>
          <div style="font-size: 0.65rem; opacity: 0.6; text-align: right; margin-top: 0.25rem;">${m.date}</div>
        </div>
      `;
    });

    historyBox.innerHTML = historyHtml;
    openModal('ticket-messages-modal');
    historyBox.scrollTop = historyBox.scrollHeight;
  }

  // Reply Form Submit Handler
  const ticketReplyForm = document.getElementById('ticket-reply-form');
  ticketReplyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const tckId = document.getElementById('ticket-modal-id').value;
    const replyText = document.getElementById('ticket-reply-text').value.trim();

    if (!replyText) return;

    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const idx = tickets.findIndex(t => t.id === tckId);

    if (idx !== -1) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);
      
      const newMsg = {
        sender: "customer",
        text: replyText,
        date: dateStr
      };

      tickets[idx].messages.push(newMsg);
      localStorage.setItem('tickets', JSON.stringify(tickets));

      // Append visually directly
      const historyBox = document.getElementById('ticket-chat-history');
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-msg msg-user';
      msgDiv.style.marginBottom = '0.5rem';
      msgDiv.style.alignSelf = 'flex-end';
      msgDiv.innerHTML = `
        <div>${replyText}</div>
        <div style="font-size: 0.65rem; opacity: 0.6; text-align: right; margin-top: 0.25rem;">${dateStr}</div>
      `;
      historyBox.appendChild(msgDiv);
      historyBox.scrollTop = historyBox.scrollHeight;

      document.getElementById('ticket-reply-text').value = '';
      
      // Dynamic mock designer auto reply in 1 sec
      setTimeout(() => {
        const ticketsCopy = JSON.parse(localStorage.getItem('tickets')) || [];
        const tIdx = ticketsCopy.findIndex(t => t.id === tckId);
        
        const designerReply = {
          sender: "designer",
          text: "Understood. Our engineering desk is reviewing these mesh files and will sync on this ticket shortly.",
          date: dateStr
        };
        ticketsCopy[tIdx].messages.push(designerReply);
        localStorage.setItem('tickets', JSON.stringify(ticketsCopy));

        const replyDiv = document.createElement('div');
        replyDiv.className = 'chat-msg msg-bot';
        replyDiv.style.marginBottom = '0.5rem';
        replyDiv.style.alignSelf = 'flex-start';
        replyDiv.innerHTML = `
          <div>${designerReply.text}</div>
          <div style="font-size: 0.65rem; opacity: 0.6; text-align: right; margin-top: 0.25rem;">${dateStr}</div>
        `;
        historyBox.appendChild(replyDiv);
        historyBox.scrollTop = historyBox.scrollHeight;
        renderSupportTickets();
      }, 1000);
    }
  });

  // Ticket creation handler
  const ticketForm = document.getElementById('support-ticket-form');
  ticketForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('ticket-subject').value.trim();
    const category = document.getElementById('ticket-cat').value;
    const msgText = document.getElementById('ticket-msg').value.trim();

    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);

    const newTicket = {
      id: "TCK-" + Math.floor(100 + Math.random() * 900),
      customerId: currentUser.id,
      subject,
      category,
      status: "open",
      messages: [
        { sender: "customer", text: msgText, date: dateStr }
      ]
    };

    tickets.push(newTicket);
    localStorage.setItem('tickets', JSON.stringify(tickets));

    showNotification('Ticket Dispatched', `Ticket ID ${newTicket.id} created successfully`, 'success');
    ticketForm.reset();
    renderSupportTickets();
  });

  // 8. Profile Coordinates edit form
  const profileForm = document.getElementById('customer-profile-form');
  document.getElementById('prof-name').value = currentUser.name;
  document.getElementById('prof-email').value = currentUser.email;
  
  if (currentUser.address) {
    document.getElementById('prof-shipping').value = currentUser.address;
  }

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('prof-name').value.trim();
    const address = document.getElementById('prof-shipping').value.trim();

    const users = JSON.parse(localStorage.getItem('users'));
    const idx = users.findIndex(u => u.id === currentUser.id);

    if (idx !== -1) {
      users[idx].name = name;
      users[idx].address = address;
      localStorage.setItem('users', JSON.stringify(users));

      // Sync active session
      currentUser.name = name;
      currentUser.address = address;
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

      document.getElementById('user-name-display').innerText = name;
      document.getElementById('user-avatar-initials').innerText = name.split(' ').map(n => n[0]).join('').toUpperCase();

      showNotification('Profile Updated', 'Your contact coordinates are saved', 'success');
    }
  });

  // Initial load runs
  renderTrackingOrders();
  renderBillingInvoices();
  renderSupportTickets();
});
