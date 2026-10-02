const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const resolvedApiUrl = new URL(API_BASE_URL, window.location.origin);
const isLocalDevelopmentHost = [
  "localhost",
  "127.0.0.1",
  "[::1]",
].includes(resolvedApiUrl.hostname);

if (resolvedApiUrl.protocol !== "https:" && !isLocalDevelopmentHost) {
  throw new Error("The BDPS API must use HTTPS outside local development.");
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Unable to reach the BDPS API at ${API_BASE_URL}. Check that the backend is running.`,
    );
  }

  const responseText = await response.text();
  let payload;

  try {
    payload = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `The BDPS API returned an invalid response (${response.status}).`,
    );
  }

  if (!response.ok || payload.success === false) {
    const error = new Error(
      payload.error?.message ||
        payload.message ||
        `The request failed (${response.status}).`,
    );
    error.code = payload.error?.code;
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function getCollection(path) {
  const payload = await request(path);

  if (!Array.isArray(payload.data)) {
    throw new Error(`The BDPS API returned an invalid collection for ${path}.`);
  }

  return payload.data;
}

export const api = {
  getAdminStatus: async () => (await request("/auth/status")).data,
  getSession: async () => (await request("/auth/me")).data,
  registerAdmin: async (admin) => (await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(admin),
  })).data,
  login: async (credentials) => (await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })).data,
  logout: () => request("/auth/logout", { method: "POST" }),
  getSummary: async () => {
    const summary = (await request("/dashboard/summary")).data;
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      throw new Error("The BDPS API returned an invalid dashboard summary.");
    }
    return summary;
  },
  getInvoices: () => getCollection("/invoices"),
  getInvoiceById: async (invoiceId) =>
    (await request(`/invoices/${invoiceId}`)).data,
  getCustomers: () => getCollection("/customers"),
  getBikeByNumber: async (bikeNumber) => {
    try {
      return (
        await request(`/bikes/number/${encodeURIComponent(bikeNumber)}`)
      ).data;
    } catch (error) {
      if (error.code === "BIKE_NOT_FOUND") return null;
      throw error;
    }
  },
  getProducts: () => getCollection("/products"),
  createInvoice: (invoice) =>
    request("/invoices", {
      method: "POST",
      body: JSON.stringify(invoice),
    }),
  updateInvoice: (invoiceId, invoice) =>
    request(`/invoices/${invoiceId}`, {
      method: "PUT",
      body: JSON.stringify(invoice),
    }),
  createCustomer: (customer) =>
    request("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    }),
  createBike: (bike) =>
    request("/bikes", {
      method: "POST",
      body: JSON.stringify(bike),
    }),
  createProduct: (product) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),
  updateProduct: (productId, product) =>
    request(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),
  adjustStock: (productId, quantity, direction) =>
    request(`/products/${productId}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity, direction }),
    }),
  deleteProduct: (productId) =>
    request(`/products/${productId}`, { method: "DELETE" }),
};
