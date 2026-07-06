(function () {
  const AUTH_TOKEN_KEY = "authToken";
  const MIN_LOGIN_LENGTH = 3;
  const MIN_PASSWORD_LENGTH = 6;

  function readLocalStorage(name) {
    try {
      return localStorage.getItem(name);
    } catch (e) {
      return null;
    }
  }

  function writeLocalStorage(name, value) {
    try {
      localStorage.setItem(name, value);
    } catch (e) {}
  }

  function removeFromLocalStorage(name) {
    try {
      localStorage.removeItem(name);
    } catch (e) {}
  }

  function formatMessage(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
  }

  function validateCredentials(login, password, messages) {
    if (!login && !password) {
      return formatMessage(messages.errorBothRequired, {
        minLogin: MIN_LOGIN_LENGTH,
        minPassword: MIN_PASSWORD_LENGTH,
      });
    }
    if (!login) {
      return formatMessage(messages.errorLoginRequired, { minLogin: MIN_LOGIN_LENGTH });
    }
    if (login.length < MIN_LOGIN_LENGTH) {
      return formatMessage(messages.errorLoginMinLength, { minLogin: MIN_LOGIN_LENGTH });
    }
    if (!password) {
      return formatMessage(messages.errorPasswordRequired, { minPassword: MIN_PASSWORD_LENGTH });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return formatMessage(messages.errorPasswordMinLength, { minPassword: MIN_PASSWORD_LENGTH });
    }
    return null;
  }

  function createNetworkError() {
    const error = new Error("");
    error.network = true;
    return error;
  }

  function resolveAuthErrorMessage(error, messages, fallbackMessage) {
    if (error?.network) {
      return messages.errorNetwork;
    }
    if (error?.message) {
      return error.message;
    }
    return fallbackMessage;
  }

  async function apiRequest(path, options) {
    let response;
    try {
      response = await fetch(path, {
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
        ...options,
      });
    } catch (e) {
      throw createNetworkError();
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body.message || "Request failed";
      throw new Error(message);
    }
    return body;
  }

  async function login(username, password) {
    return apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async function register(username, password) {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async function fetchProfile() {
    const token = readLocalStorage(AUTH_TOKEN_KEY);
    if (!token) {
      throw new Error("Missing auth token");
    }
    return apiRequest("/api/auth/me", {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });
  }

  async function logout() {
    const token = readLocalStorage(AUTH_TOKEN_KEY);
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      }).catch(() => {});
    }
    removeFromLocalStorage(AUTH_TOKEN_KEY);
  }

  function saveSession(token) {
    writeLocalStorage(AUTH_TOKEN_KEY, token);
  }

  function getToken() {
    return readLocalStorage(AUTH_TOKEN_KEY);
  }

  function clearSession() {
    removeFromLocalStorage(AUTH_TOKEN_KEY);
  }

  window.ReferenceAuth = {
    AUTH_TOKEN_KEY,
    MIN_LOGIN_LENGTH,
    MIN_PASSWORD_LENGTH,
    validateCredentials,
    resolveAuthErrorMessage,
    login,
    register,
    fetchProfile,
    logout,
    saveSession,
    getToken,
    clearSession,
    formatMessage,
  };
})();
