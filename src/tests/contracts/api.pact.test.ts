/**
 * Consumer-driven contract tests for the StellarPOS surface ↔ backend API.
 *
 * These tests use Pact to record the expectations the frontend has of the
 * backend.  Running `npm run test:contract` generates a pact file in
 * `pacts/` that the backend can verify independently, so a contract-breaking
 * change in the backend fails here before it ever reaches staging.
 *
 * Issue #113
 */

import path from "path";
import { PactV3, MatchersV3 } from "@pact-foundation/pact";

const { like, eachLike, string, integer, boolean, regex } = MatchersV3;

// ─── Pact provider ────────────────────────────────────────────────────────────

const provider = new PactV3({
  consumer: "stellarpos-surface",
  provider: "stellarpos-backend",
  dir: path.resolve(__dirname, "../../../pacts"),
  logLevel: "warn",
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("Auth contract", () => {
  it("POST /auth/login → 200 with token and user", async () => {
    await provider
      .given("a registered merchant exists with email merchant@example.com")
      .uponReceiving("a valid login request")
      .withRequest({
        method: "POST",
        path: "/auth/login",
        headers: { "Content-Type": "application/json" },
        body: {
          email: "merchant@example.com",
          password: "correct-password",
        },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          token: string("eyJhbGciOiJIUzI1NiJ9.test"),
          user: like({
            id: string("usr_01"),
            email: string("merchant@example.com"),
            name: string("Test Merchant"),
            role: string("merchant"),
          }),
        },
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "merchant@example.com",
            password: "correct-password",
          }),
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty("token");
        expect(body).toHaveProperty("user.email");
      });
  });

  it("POST /auth/login → 401 for wrong password", async () => {
    await provider
      .given("a registered merchant exists with email merchant@example.com")
      .uponReceiving("a login request with wrong password")
      .withRequest({
        method: "POST",
        path: "/auth/login",
        headers: { "Content-Type": "application/json" },
        body: {
          email: "merchant@example.com",
          password: "wrong-password",
        },
      })
      .willRespondWith({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: like({ message: string("Invalid credentials") }),
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "merchant@example.com",
            password: "wrong-password",
          }),
        });
        expect(res.status).toBe(401);
      });
  });

  it("POST /auth/register → 201 with new user", async () => {
    await provider
      .given("no merchant exists with email newmerchant@example.com")
      .uponReceiving("a valid registration request")
      .withRequest({
        method: "POST",
        path: "/auth/register",
        headers: { "Content-Type": "application/json" },
        body: {
          email: "newmerchant@example.com",
          password: "secure-pass-123",
          name: "New Merchant",
        },
      })
      .willRespondWith({
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: like({
          id: string("usr_02"),
          email: string("newmerchant@example.com"),
          name: string("New Merchant"),
        }),
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "newmerchant@example.com",
            password: "secure-pass-123",
            name: "New Merchant",
          }),
        });
        expect(res.status).toBe(201);
      });
  });
});

// ─── Inventory ────────────────────────────────────────────────────────────────

describe("Inventory contract", () => {
  const authHeader = { Authorization: "Bearer test-token" };

  it("GET /inventory → 200 with array of products", async () => {
    await provider
      .given("the authenticated merchant has inventory items")
      .uponReceiving("a request to list inventory")
      .withRequest({
        method: "GET",
        path: "/inventory",
        headers: authHeader,
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: eachLike({
          id: string("item_01"),
          name: string("Widget"),
          sku: string("WGT-001"),
          price: integer(1000),
          quantity: integer(50),
          category: string("hardware"),
        }),
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/inventory`, {
          headers: authHeader,
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body[0]).toHaveProperty("sku");
      });
  });

  it("POST /inventory → 201 with the created product", async () => {
    await provider
      .given("the merchant is authenticated")
      .uponReceiving("a request to create an inventory item")
      .withRequest({
        method: "POST",
        path: "/inventory",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: {
          name: "Gadget",
          sku: "GDG-001",
          price: 2500,
          quantity: 10,
          category: "electronics",
        },
      })
      .willRespondWith({
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: like({
          id: string("item_02"),
          name: string("Gadget"),
          sku: string("GDG-001"),
          price: integer(2500),
        }),
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/inventory`, {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Gadget",
            sku: "GDG-001",
            price: 2500,
            quantity: 10,
            category: "electronics",
          }),
        });
        expect(res.status).toBe(201);
      });
  });
});

// ─── Transactions ─────────────────────────────────────────────────────────────

describe("Transactions contract", () => {
  const authHeader = { Authorization: "Bearer test-token" };

  it("GET /transactions → 200 with paginated transaction list", async () => {
    await provider
      .given("the authenticated merchant has transactions")
      .uponReceiving("a request to list transactions")
      .withRequest({
        method: "GET",
        path: "/transactions",
        headers: authHeader,
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: like({
          data: eachLike({
            id: string("txn_01"),
            amount: integer(5000),
            currency: string("XLM"),
            status: string("completed"),
            createdAt: string("2024-01-01T00:00:00Z"),
          }),
          total: integer(1),
          page: integer(1),
          pageSize: integer(20),
        }),
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/transactions`, {
          headers: authHeader,
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty("data");
        expect(body).toHaveProperty("total");
      });
  });

  it("POST /transactions → 201 with new transaction", async () => {
    await provider
      .given("the merchant is authenticated and has sufficient balance")
      .uponReceiving("a request to create a POS transaction")
      .withRequest({
        method: "POST",
        path: "/transactions",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: {
          items: [{ inventoryId: "item_01", quantity: 2, unitPrice: 1000 }],
          paymentMethod: "stellar",
          customerPublicKey: "GABC1234",
        },
      })
      .willRespondWith({
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: like({
          id: string("txn_02"),
          amount: integer(2000),
          status: string("pending"),
          stellarTxHash: string("abc123"),
        }),
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/transactions`, {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [{ inventoryId: "item_01", quantity: 2, unitPrice: 1000 }],
            paymentMethod: "stellar",
            customerPublicKey: "GABC1234",
          }),
        });
        expect(res.status).toBe(201);
      });
  });
});

// ─── Customers ────────────────────────────────────────────────────────────────

describe("Customers contract", () => {
  const authHeader = { Authorization: "Bearer test-token" };

  it("GET /customers → 200 with array of customers", async () => {
    await provider
      .given("the authenticated merchant has customers")
      .uponReceiving("a request to list customers")
      .withRequest({
        method: "GET",
        path: "/customers",
        headers: authHeader,
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: eachLike({
          id: string("cust_01"),
          name: string("Alice"),
          email: string("alice@example.com"),
          stellarPublicKey: string("GABC1234"),
          totalSpent: integer(10000),
        }),
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/customers`, {
          headers: authHeader,
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
      });
  });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe("Dashboard contract", () => {
  const authHeader = { Authorization: "Bearer test-token" };

  it("GET /dashboard/summary → 200 with key metrics", async () => {
    await provider
      .given("the authenticated merchant has activity data")
      .uponReceiving("a request for the dashboard summary")
      .withRequest({
        method: "GET",
        path: "/dashboard/summary",
        headers: authHeader,
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: like({
          totalRevenue: integer(500000),
          totalTransactions: integer(42),
          totalCustomers: integer(15),
          revenueChange: like(5.2),
        }),
      })
      .executeTest(async (mockServer) => {
        const res = await fetch(`${mockServer.url}/dashboard/summary`, {
          headers: authHeader,
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty("totalRevenue");
        expect(body).toHaveProperty("totalTransactions");
      });
  });
});
