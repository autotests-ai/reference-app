const healthStatus = document.querySelector('[data-testid="health-status"]');
const itemsList = document.querySelector('[data-testid="items-list"]');
const welcomeMessage = document.querySelector('[data-testid="welcome-message"]');
const welcomePanel = document.querySelector('[data-testid="welcome-panel"]');
const logoutButton = document.getElementById('logout-button');

function renderPanelBar(title) {
  return `
    <div class="panel__bar">
      <div class="panel__dots" aria-hidden="true">
        <span class="panel__dot"></span>
        <span class="panel__dot"></span>
        <span class="panel__dot"></span>
      </div>
      <div class="panel__trail">
        <span class="panel__title">${title}</span>
      </div>
    </div>`;
}

function renderContentPanel(title, bodyHtml, testId) {
  const testAttr = testId ? ` data-testid="${testId}"` : '';
  return `
    <div class="panel panel--content"${testAttr}>
      ${renderPanelBar(title)}
      <div class="panel__body">
        ${bodyHtml}
      </div>
    </div>`;
}

function renderItems(items) {
  if (!items.length) {
    itemsList.innerHTML = renderContentPanel(
      'Items',
      '<p class="text text--muted">No items found.</p>'
    );
    return;
  }

  itemsList.innerHTML = items
    .map((item) =>
      renderContentPanel(
        item.name,
        `<p class="text text--muted">${item.description}</p>`,
        'item-row'
      )
    )
    .join('');
}

async function loadHealth() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    healthStatus.textContent = `→ ${payload.status} | service: ${payload.service}`;
  } catch (error) {
    healthStatus.textContent = `✗ health: ${error.message}`;
    healthStatus.classList.add('reference-app__error');
  }
}

async function loadItems() {
  try {
    const response = await fetch('/api/items');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    renderItems(payload.items || []);
  } catch (error) {
    itemsList.innerHTML = renderContentPanel(
      'Items',
      `<p class="reference-app__error">✗ items: ${error.message}</p>`
    );
  }
}

async function loadSession() {
  if (!window.ReferenceAuth || !ReferenceAuth.getToken()) {
    return;
  }

  try {
    const profile = await ReferenceAuth.fetchProfile();
    welcomeMessage.textContent = 'Welcome, ' + profile.username + '!';
    welcomePanel.hidden = false;
  } catch (error) {
    ReferenceAuth.clearSession();
  }
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await ReferenceAuth.logout();
    window.location.href = '/login';
  });
}

loadHealth();
loadItems();
loadSession();
