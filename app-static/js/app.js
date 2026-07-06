const healthStatus = document.querySelector('[data-testid="health-status"]');
const itemsList = document.querySelector('[data-testid="items-list"]');
const welcomeMessage = document.querySelector('[data-testid="welcome-message"]');
const sessionPanel = document.querySelector('[data-testid="session-panel"]');
const logoutButton = document.getElementById('logout-button');

function renderItems(items) {
  if (!items.length) {
    itemsList.innerHTML = '<p class="text text--muted">No items found.</p>';
    return;
  }
  itemsList.innerHTML = items
    .map(
      (item) => `
        <article class="reference-app__item" data-testid="item-row">
          <h2 class="reference-app__item-name">${item.name}</h2>
          <p class="reference-app__item-desc">${item.description}</p>
        </article>`
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
    itemsList.innerHTML = `<p class="reference-app__error">✗ items: ${error.message}</p>`;
  }
}

async function loadSession() {
  if (!window.ReferenceAuth || !ReferenceAuth.getToken()) {
    return;
  }

  try {
    const profile = await ReferenceAuth.fetchProfile();
    welcomeMessage.textContent = 'Welcome, ' + profile.username + '!';
    sessionPanel.hidden = false;
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
