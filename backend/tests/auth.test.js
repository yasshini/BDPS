const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, test } = require("node:test");
const { hashPassword, isValidPassword } = require("../src/utils/passwordHash");

let server;
let baseUrl;
let admin;
let invoiceFindAllOptions;
let invoiceFindByPkOptions;
const sessions = new Map();

before(async () => {
  process.env.NODE_ENV = "test";
  process.env.DB_PASSWORD = "test-only-not-a-real-secret";
  process.env.CORS_ORIGINS =
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5178,http://127.0.0.1:5178";

  const { sequelize } = require("../models");
  sequelize.transaction = async (callback) =>
    callback({ LOCK: { UPDATE: "UPDATE" } });

  const repository = require("../src/repositories/adminRepository");
  repository.findAdmin = async () => admin;
  repository.createAdmin = async (data) => {
    if (admin) {
      const error = new Error("Duplicate administrator");
      error.name = "SequelizeUniqueConstraintError";
      throw error;
    }

    admin = {
      id: 1,
      ...data,
      async update(values) {
        Object.assign(this, values);
      },
    };
    return admin;
  };
  repository.createSession = async (session) => {
    sessions.set(session.token_hash, {
      ...session,
      admin,
      async update(values) {
        Object.assign(this, values);
      },
    });
  };
  repository.findSession = async (tokenHash) => {
    const session = sessions.get(tokenHash);
    if (!session || session.expires_at <= new Date()) return null;
    return session;
  };
  repository.refreshSession = async (session, expiresAt) => {
    session.expires_at = expiresAt;
  };
  repository.deleteSession = async (tokenHash) => sessions.delete(tokenHash);
  const productRepository = require("../src/repositories/productRepository");
  productRepository.findAll = async () => [];
  const dashboardRepository = require("../src/repositories/dashboardRepository");
  dashboardRepository.getSummary = async () => ({
    total_customers: 0,
    total_bikes: 0,
    total_products: 0,
    low_stock_products: 0,
    today_invoices: 0,
    today_sales: 0,
  });
  const { Invoice } = require("../models");
  Invoice.findAll = async (options) => {
    invoiceFindAllOptions = options;
    return [];
  };
  Invoice.findByPk = async (id, options) => {
    invoiceFindByPkOptions = options;
    return { id };
  };
  const app = require("../src/app");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(
  () =>
    new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
);

function jsonRequest(path, body, cookie) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:5173",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

test("password policy accepts 6–64 character passwords with the required character classes", () => {
  assert.equal(isValidPassword("Bdps@1"), true);
  assert.equal(isValidPassword("Bike@12"), true);
  assert.equal(isValidPassword("Y@shini2003"), true);
  assert.equal(isValidPassword(`Aa@1${"b".repeat(60)}`), true);
  assert.equal(isValidPassword(`Aa@1${"b".repeat(61)}`), false);
  assert.equal(isValidPassword("BDPS@123"), false);
  assert.equal(isValidPassword("bdps123"), false);
  assert.equal(isValidPassword("BDPS123"), false);
  assert.equal(isValidPassword("BDPS@12345"), false);
});

test("admin sessions default created_at before Sequelize validation", () => {
  const { AdminSession } = require("../models");
  const session = AdminSession.build({
    token_hash: "a".repeat(64),
    admin_id: 1,
    expires_at: new Date(Date.now() + 60_000),
  });

  assert.ok(session.created_at instanceof Date);
});

test("admin registration validates, creates only one account, and returns no hash", async () => {
  const firstResponse = await jsonRequest("/api/auth/register", {
    username: " shop-admin ",
    email: "ADMIN@example.com",
    password: "Long@Pass123",
  });
  const firstPayload = await firstResponse.json();

  assert.equal(firstResponse.status, 201);
  assert.match(firstResponse.headers.get("set-cookie"), /bdps_session=/);
  assert.deepEqual(firstPayload.data, { username: "shop-admin" });
  assert.equal(JSON.stringify(firstPayload).includes("password_hash"), false);
  assert.notEqual(admin.password_hash, "Long@Pass123");

  const secondResponse = await jsonRequest("/api/auth/register", {
    username: "another-admin",
    email: "other@example.com",
    password: "Bike@12",
  });

  assert.equal(secondResponse.status, 409);
  assert.equal(
    (await secondResponse.json()).error.code,
    "ADMIN_ALREADY_EXISTS",
  );
});

test("data-changing endpoints reject requests without an admin session", async () => {
  const response = await jsonRequest("/api/products", {
    item_name: "Unauthorized product",
  });

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "AUTHENTICATION_REQUIRED");
});

test("business data reads require an admin session", async () => {
  const [
    summaryResponse,
    productResponse,
    invoiceListResponse,
    invoiceResponse,
    customerResponse,
    bikeResponse,
  ] =
    await Promise.all([
      fetch(`${baseUrl}/api/dashboard/summary`),
      fetch(`${baseUrl}/api/products`),
      fetch(`${baseUrl}/api/invoices`),
      fetch(`${baseUrl}/api/invoices/1`),
      fetch(`${baseUrl}/api/customers`),
      fetch(`${baseUrl}/api/bikes/number/TEST-1`),
    ]);

  for (const response of [
    summaryResponse,
    productResponse,
    invoiceListResponse,
    invoiceResponse,
    customerResponse,
    bikeResponse,
  ]) {
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(
      (await response.json()).error.code,
      "AUTHENTICATION_REQUIRED",
    );
  }
  assert.equal(invoiceFindAllOptions, undefined);
  assert.equal(invoiceFindByPkOptions, undefined);
});

test("login issues an HttpOnly session cookie and session lookup accepts it", async () => {
  const loginResponse = await jsonRequest("/api/auth/login", {
    username: "shop-admin",
    password: "Long@Pass123",
  });
  const setCookie = loginResponse.headers.get("set-cookie");
  const cookie = setCookie?.split(";", 1)[0];

  assert.equal(loginResponse.status, 200);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  assert.match(setCookie, /Max-Age=2592000/i);
  assert.ok(cookie?.startsWith("bdps_session="));

  const sessionResponse = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: cookie },
  });

  assert.equal(sessionResponse.status, 200);
  assert.match(sessionResponse.headers.get("set-cookie"), /Max-Age=/i);
  assert.deepEqual((await sessionResponse.json()).data, {
    username: "shop-admin",
  });

  const refreshedSessionResponse = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: cookie },
  });
  assert.equal(refreshedSessionResponse.status, 200);

  const [summaryResponse, productResponse, invoiceListResponse] =
    await Promise.all([
      fetch(`${baseUrl}/api/dashboard/summary`, {
        headers: { Cookie: cookie },
      }),
      fetch(`${baseUrl}/api/products`, {
        headers: { Cookie: cookie },
      }),
      fetch(`${baseUrl}/api/invoices`, {
        headers: { Cookie: cookie },
      }),
    ]);
  assert.equal(summaryResponse.status, 200);
  assert.equal(productResponse.status, 200);
  assert.equal(invoiceListResponse.status, 200);
  assert.equal(summaryResponse.headers.get("cache-control"), "no-store");
  assert.equal(productResponse.headers.get("cache-control"), "no-store");
  assert.equal(invoiceListResponse.headers.get("cache-control"), "no-store");

  const invoiceResponse = await fetch(`${baseUrl}/api/invoices/1`, {
    headers: { Cookie: cookie },
  });
  assert.equal(invoiceResponse.status, 200);
  const customer = invoiceFindByPkOptions.include.find(
    (include) => include.as === "customer",
  );
  const bike = invoiceFindByPkOptions.include.find(
    (include) => include.as === "bike",
  );
  assert.equal(customer.attributes, undefined);
  assert.equal(bike.attributes, undefined);
  assert.equal(
    invoiceFindAllOptions.include.find((include) => include.as === "customer")
      .attributes,
    undefined,
  );
});

test("invalid credentials use a generic error", async () => {
  const response = await jsonRequest("/api/auth/login", {
    username: "unknown-admin",
    password: "Wrong@1",
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.error.message, "Invalid username or password.");
});

test("logout invalidates the server session", async () => {
  const loginResponse = await jsonRequest("/api/auth/login", {
    username: "shop-admin",
    password: "Long@Pass123",
  });
  const cookie = loginResponse.headers.get("set-cookie")?.split(";", 1)[0];
  const logoutResponse = await jsonRequest("/api/auth/logout", {}, cookie);

  assert.equal(logoutResponse.status, 200);

  const sessionResponse = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: cookie },
  });
  assert.equal(sessionResponse.status, 401);
});

test("logout clears the cookie when the session cookie is missing", async () => {
  const response = await jsonRequest("/api/auth/logout", {});

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /bdps_session=;/);
});

test("mutating auth routes reject requests without a trusted Origin", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "shop-admin", password: "Long@Pass123" }),
  });

  assert.equal(response.status, 403);
});

test("local Vite fallback origin on port 5178 is allowed for development", async () => {
  const response = await fetch(`${baseUrl}/api/auth/status`, {
    headers: { Origin: "http://127.0.0.1:5178" },
  });

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://127.0.0.1:5178",
  );
});

test("authentication status is never cached", async () => {
  const response = await fetch(`${baseUrl}/api/auth/status`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("API documentation is available only outside production", async () => {
  const response = await fetch(`${baseUrl}/api-docs/`);

  assert.equal(response.status, 200);
});

test("password recovery endpoints are removed", async () => {
  const forgotResponse = await jsonRequest("/api/auth/forgot-password", {
    email: "admin@example.com",
  });
  const resetResponse = await jsonRequest("/api/auth/reset-password", {
    token: "A".repeat(43),
    password: "Changed@123",
    confirmPassword: "Changed@123",
  });

  assert.equal(forgotResponse.status, 404);
  assert.equal(resetResponse.status, 404);
});
