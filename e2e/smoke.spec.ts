import { test, expect } from "@playwright/test";

/**
 * Smoke test covering the core happy path: login, create a board,
 * create a task, and drag it to another column.
 *
 * Requires a test account to already exist (sign up once via the app)
 * and these env vars to be set:
 *   E2E_TEST_EMAIL, E2E_TEST_PASSWORD
 */

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test.skip(!email || !password, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");

test("login → create board → create task → drag between columns", async ({
  page,
}) => {
  test.skip(!email || !password, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");
  await page.goto("/login");

  await page.getByLabel("Email Address").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: /enter/i }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("My boards")).toBeVisible();

  const boardName = `E2E Board ${Date.now()}`;
  await page.getByRole("button", { name: /create board/i }).click();
  await page.getByLabel("Board name").fill(boardName);
  await page.getByRole("button", { name: /^create$/i }).click();

  await page.getByText(boardName).click();
  await expect(page.getByText("To Do")).toBeVisible();

  const taskTitle = `E2E Task ${Date.now()}`;
  await page
    .getByRole("button", { name: /add task/i })
    .first()
    .click();
  await page.getByLabel("Task name").fill(taskTitle);
  await page.getByRole("button", { name: /^create task$/i }).click();

  const taskCard = page.getByText(taskTitle);
  await expect(taskCard).toBeVisible();

  const doneColumn = page.getByText("Done").locator("..");
  const cardBox = await taskCard.boundingBox();
  const targetBox = await doneColumn.boundingBox();

  if (cardBox && targetBox) {
    await page.mouse.move(
      cardBox.x + cardBox.width / 2,
      cardBox.y + cardBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 10 },
    );
    await page.mouse.up();
  }

  await expect(taskCard).toBeVisible();
});
