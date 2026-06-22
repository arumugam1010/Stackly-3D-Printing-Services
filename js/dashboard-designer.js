/* Designer Studio Workspace Logic */

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = window.authSystem.getCurrentUser();
  if (!currentUser) return;

  // 1. Tab Navigation Routing
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
      if (target === 'designer-queue-panel') renderDesignerQueue();
      if (target === 'designer-messages-panel') renderDesignerInbox();
      if (target === 'designer-records-panel') renderCompletedRecords();
    });
  });

  // Mobile sidebar trigger
  const trigger = document.getElementById('sidebar-trigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      document.getElementById('dashboard-sidebar').classList.add('active');
    });
  }

  // 2. Render Designer Queue List
  let selectedOrderId = null;

  function renderDesignerQueue() {
    const queueBox = document.getElementById('designer-orders-container');
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Non-completed orders
    const activeOrders = orders.filter(o => o.status !== 'completed');

    if (activeOrders.length === 0) {
      queueBox.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem 0;">No active print jobs in queue.</div>`;
      return;
    }

    let html = '';
    activeOrders.forEach(ord => {
      const isSelected = ord.id === selectedOrderId;
      const selectClass = isSelected ? 'border-color: var(--accent-primary); background: rgba(238, 85, 54, 0.04);' : '';
      
      let badgeClass = 'badge-pending';
      if (ord.status === 'in_production') badgeClass = 'badge-progress';
      if (ord.status === 'approved') badgeClass = 'badge-progress';

      html += `
        <div class="glass-card" style="padding: 1.25rem; cursor: pointer; transition: all var(--transition-fast); ${selectClass}" class="queue-order-card" onclick="window.selectQueueOrder('${ord.id}')">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong>${ord.id}</strong>
            <span class="badge ${badgeClass}">${ord.status.replace('_', ' ')}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            File: <strong>${ord.fileName}</strong>
          </p>
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color: var(--text-muted); margin-top:0.75rem;">
            <span>Client: ${ord.customerName}</span>
            <span style="font-weight:600; color: ${ord.paymentStatus === 'paid' ? 'var(--accent-success)' : 'var(--accent-warning)'}">${ord.paymentStatus.toUpperCase()}</span>
          </div>
        </div>
      `;
    });

    queueBox.innerHTML = html;
  }

  // Make globally selectable so onclick targets work
  window.selectQueueOrder = function(orderId) {
    selectedOrderId = orderId;
    renderDesignerQueue();

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const ord = orders.find(o => o.id === orderId);

    if (!ord) return;

    // Show validation checklist panels
    document.getElementById('val-placeholder-card').style.display = 'none';
    const checklistCard = document.getElementById('validation-checklist-card');
    checklistCard.style.display = 'block';

    // Populate data fields
    document.getElementById('val-order-id').innerText = ord.id;
    document.getElementById('val-filename').innerText = ord.fileName;
    document.getElementById('val-tech').innerText = ord.technology;
    document.getElementById('val-material').innerText = ord.material;
    
    const statusBadge = document.getElementById('val-order-status');
    statusBadge.innerText = ord.status.replace('_', ' ');
    statusBadge.className = `badge ${ord.status === 'completed' ? 'badge-completed' : (ord.status === 'in_production' ? 'badge-progress' : 'badge-pending')}`;

    const paymentText = document.getElementById('val-payment');
    paymentText.innerText = ord.paymentStatus;
    paymentText.style.color = ord.paymentStatus === 'paid' ? 'var(--accent-success)' : 'var(--accent-warning)';

    // Fill Checkboxes
    document.getElementById('check-thickness').checked = ord.validationChecks.thickness || false;
    document.getElementById('check-geometry').checked = ord.validationChecks.geometry || false;
    document.getElementById('check-volume').checked = ord.validationChecks.printVolume || false;

    // Fill Status selection
    document.getElementById('val-update-status-select').value = ord.status;
  };

  // Save Validation Checkbox changes & Status Updates
  const btnSaveVal = document.getElementById('btn-save-validation');
  if (btnSaveVal) {
    btnSaveVal.addEventListener('click', () => {
      if (!selectedOrderId) return;

      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      const idx = orders.findIndex(o => o.id === selectedOrderId);

      if (idx !== -1) {
        const thickness = document.getElementById('check-thickness').checked;
        const geometry = document.getElementById('check-geometry').checked;
        const volume = document.getElementById('check-volume').checked;
        const statusVal = document.getElementById('val-update-status-select').value;

        orders[idx].validationChecks = { thickness, geometry, printVolume: volume };
        orders[idx].status = statusVal;
        
        // Auto assign designer if unassigned
        if (!orders[idx].designerId) orders[idx].designerId = currentUser.id;

        localStorage.setItem('orders', JSON.stringify(orders));

        showNotification('Job Progress Updated', `Saved metrics for order ${selectedOrderId}`, 'success');
        
        // Refresh queue
        renderDesignerQueue();
        
        // Refresh detail card
        window.selectQueueOrder(selectedOrderId);
      }
    });
  }

  // Escalate order button handler
  const btnEscalate = document.getElementById('btn-escalate-order');
  if (btnEscalate) {
    btnEscalate.addEventListener('click', () => {
      if (!selectedOrderId) return;
      showNotification('Issue Escalated', `Order ${selectedOrderId} flagged for admin pricing/mesh resolution`, 'warning');
    });
  }

  // 3. Render Client Communication Threads (Designer Portal Inbox)
  let activeInboxTicketId = null;

  function renderDesignerInbox() {
    const threadList = document.getElementById('designer-inbox-thread-rows');
    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];

    if (tickets.length === 0) {
      threadList.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No chat tickets found.</div>`;
      return;
    }

    let html = '';
    tickets.forEach(tck => {
      const isActive = tck.id === activeInboxTicketId;
      const activeClass = isActive ? 'active' : '';
      const lastMsg = tck.messages[tck.messages.length - 1];

      html += `
        <div class="inbox-chat-item ${activeClass}" onclick="window.selectInboxThread('${tck.id}')">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <strong style="font-size:0.9rem;">${tck.id}</strong>
            <span class="badge ${tck.status === 'open' ? 'badge-progress' : 'badge-completed'}" style="font-size: 0.6rem; padding: 2px 6px;">${tck.status}</span>
          </div>
          <p style="font-size:0.8rem; color:var(--text-primary); margin-bottom:0.25rem; font-weight:500;">${tck.subject}</p>
          <p style="font-size:0.75rem; color:var(--text-secondary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">"${lastMsg.text}"</p>
        </div>
      `;
    });

    threadList.innerHTML = html;
  }

  window.selectInboxThread = function(ticketId) {
    activeInboxTicketId = ticketId;
    renderDesignerInbox();

    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const tck = tickets.find(t => t.id === ticketId);

    if (!tck) return;

    // Show Reply Form
    document.getElementById('inbox-reply-form').style.display = 'flex';
    document.getElementById('inbox-active-ticket-id').value = ticketId;
    document.getElementById('inbox-chat-header').innerText = `${tck.id} - ${tck.subject}`;

    const chatHist = document.getElementById('inbox-chat-history');
    let messagesHtml = '';
    
    tck.messages.forEach(m => {
      const isDesigner = m.sender === 'designer';
      messagesHtml += `
        <div class="chat-msg ${isDesigner ? 'msg-user' : 'msg-bot'}" style="margin-bottom: 0.5rem; align-self: ${isDesigner ? 'flex-end' : 'flex-start'}">
          <div>${m.text}</div>
          <div style="font-size: 0.65rem; opacity: 0.6; text-align: right; margin-top: 0.25rem;">${m.date}</div>
        </div>
      `;
    });

    chatHist.innerHTML = messagesHtml;
    chatHist.scrollTop = chatHist.scrollHeight;
  };

  // Reply submit inside communication panel
  const inboxReplyForm = document.getElementById('inbox-reply-form');
  inboxReplyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const tckId = document.getElementById('inbox-active-ticket-id').value;
    const replyText = document.getElementById('inbox-reply-text').value.trim();

    if (!replyText) return;

    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    const idx = tickets.findIndex(t => t.id === tckId);

    if (idx !== -1) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);

      const newMsg = {
        sender: "designer",
        text: replyText,
        date: dateStr
      };

      tickets[idx].messages.push(newMsg);
      localStorage.setItem('tickets', JSON.stringify(tickets));

      // Append visually
      const chatHist = document.getElementById('inbox-chat-history');
      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-msg msg-user';
      msgDiv.style.marginBottom = '0.5rem';
      msgDiv.style.alignSelf = 'flex-end';
      msgDiv.innerHTML = `
        <div>${replyText}</div>
        <div style="font-size: 0.65rem; opacity: 0.6; text-align: right; margin-top: 0.25rem;">${dateStr}</div>
      `;
      chatHist.appendChild(msgDiv);
      chatHist.scrollTop = chatHist.scrollHeight;

      document.getElementById('inbox-reply-text').value = '';
      renderDesignerInbox();
    }
  });

  // 4. Completed Production Records Table
  function renderCompletedRecords() {
    const tableBody = document.getElementById('designer-records-table-rows');
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const completed = orders.filter(o => o.status === 'completed');

    if (completed.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No completed projects recorded.</td></tr>`;
      return;
    }

    let html = '';
    completed.forEach(ord => {
      html += `
        <tr>
          <td><strong>${ord.id}</strong></td>
          <td>${ord.customerName}</td>
          <td>${ord.fileName}</td>
          <td>${ord.material}</td>
          <td><span class="badge badge-completed">${ord.status}</span></td>
          <td>${ord.estimatedDate}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  // Initial runs
  renderDesignerQueue();
  renderCompletedRecords();
});
