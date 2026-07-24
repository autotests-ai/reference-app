const { expect } = require('@playwright/test');
const { test } = require('../src/helpers/fixtures/fixture');
const { UserBuilder } = require('../src/helpers/builders');

const LOGIN_REQUIRED = 'Login is required (minimum 3 characters)';
const PASSWORD_REQUIRED = 'Password is required (minimum 6 characters)';
const WRONG_CREDENTIALS = 'Wrong login or password';

test('Пользователь может войти с валидными credentials', async ({ webApp }) => {
  const user = new UserBuilder().withSeededUser().build();
  await webApp.login.open();
  await webApp.login.login(user.username, user.password);
  await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
});

test('Пустой логин показывает ошибку валидации', async ({ webApp }) => {
  await webApp.login.open();
  await webApp.login.typePassword('password1');
  await webApp.login.submitExpectingError();
  await expect(webApp.login.errorMessage).toContainText(LOGIN_REQUIRED);
});

test('Пустой пароль показывает ошибку валидации', async ({ webApp }) => {
  await webApp.login.open();
  await webApp.login.typeUsername('user1');
  await webApp.login.submitExpectingError();
  await expect(webApp.login.errorMessage).toContainText(PASSWORD_REQUIRED);
});

test('Неверный пароль показывает читаемую ошибку', async ({ webApp }) => {
  await webApp.login.open();
  await webApp.login.typeUsername('user1');
  await webApp.login.typePassword('wrongpassword');
  await webApp.login.submitExpectingError();
  await expect(webApp.login.errorMessage).toContainText(WRONG_CREDENTIALS);
});

test('Новый пользователь может зарегистрироваться', async ({ webApp }) => {
  const user = new UserBuilder().withUsername().withPassword().build();
  await webApp.register.open();
  await webApp.register.signup(user.username, user.password);
  await expect(webApp.home.getWelcomeText()).toContainText(
    `Welcome, ${user.username}!`,
  );
});

test('Пользователь может выйти после логина', async ({ webApp }) => {
  const user = new UserBuilder().withSeededUser().build();
  await webApp.login.open();
  await webApp.login.login(user.username, user.password);
  await expect(webApp.home.getWelcomeText()).toContainText('Welcome, user1!');
  await webApp.home.logout();
  await expect(webApp.login.formTitle).toContainText('Login Form');
});

test('Home загружает health и items', async ({ webApp }) => {
  await webApp.home.open();
  await expect(webApp.home.layout).toBeVisible({ timeout: 10_000 });
  await expect(webApp.home.healthStatus).toContainText('service: reference-app');
  await expect(webApp.home.itemsList).toContainText('Alpha');
});

test('Прямой /login подсвечивает Login в header', async ({ webApp }) => {
  await webApp.login.open();
  await expect(webApp.header.activeNav('header-nav-login')).toHaveClass(/is-active/);
  await expect(webApp.header.activeNav('header-nav-login')).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(webApp.header.currentPageLinks()).toHaveCount(1);
});

test('Ссылка Login → Register синхронизирует active nav', async ({ webApp }) => {
  await webApp.login.open();
  await expect(webApp.header.activeNav('header-nav-login')).toHaveClass(/is-active/);
  await webApp.login.clickRegisterLink();
  await expect(webApp.register.registerForm).toBeVisible();
  await expect(webApp.header.activeNav('header-nav-register')).toHaveClass(/is-active/);
});
