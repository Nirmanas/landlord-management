import { beforeEach, describe, expect, mock, test } from "bun:test";

let user;
const revalidatePath = mock(() => {});
const prisma = {
  property: { findFirst: mock(), findMany: mock() },
  lease: { findFirst: mock(), findMany: mock(), create: mock() },
  period: { findFirst: mock(), findMany: mock() },
  tenant: { findUnique: mock(), findFirst: mock(), count: mock(), update: mock() },
  payment: { findFirst: mock(), findMany: mock(), updateMany: mock() },
  $transaction: mock(),
};

mock.module("server-only", () => ({}));
mock.module("next/cache", () => ({ revalidatePath }));
mock.module("@/lib/auth/auth", () => ({ default: async () => user }));
mock.module("@/lib/prisma", () => ({ prisma }));

const landlordApartments = await import("@/app/api/landlord/apartments/route");
const landlordLeases = await import("@/app/api/landlord/apartments/[apartment]/leases/route");
const landlordLease = await import("@/app/api/landlord/apartments/[apartment]/leases/[lease]/route");
const landlordPeriods = await import("@/app/api/landlord/apartments/[apartment]/leases/[lease]/periods/route");
const landlordPeriod = await import("@/app/api/landlord/apartments/[apartment]/leases/[lease]/periods/[period]/route");
const landlordTenant = await import("@/app/api/landlord/tenants/[id]/route");
const confirm = await import("@/app/api/landlord/payments/[id]/confirm/route");
const landlordPayments = await import("@/app/api/landlord/payments/route");
const { todayISO } = await import("@/lib/domain");
const tenantApartments = await import("@/app/api/tenant/apartments/route");
const tenantLeases = await import("@/app/api/tenant/apartments/[apartment]/leases/route");
const tenantLease = await import("@/app/api/tenant/apartments/[apartment]/leases/[lease]/route");
const tenantPeriods = await import("@/app/api/tenant/apartments/[apartment]/leases/[lease]/periods/route");
const tenantPeriod = await import("@/app/api/tenant/apartments/[apartment]/leases/[lease]/periods/[period]/route");
const report = await import("@/app/api/tenant/payments/[id]/report/route");

const invoke = (handler, params = {}, method = "GET", body, headers = {}) => handler(
  new Request("http://localhost:3000/api/test", {
    method, headers: { "Content-Type": "application/json", ...headers },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  }), { params: Promise.resolve(params) },
);

beforeEach(() => {
  user = { id: 7, email: "landlord@example.test", role: "LANDLORD" };
  revalidatePath.mockClear();
  for (const model of Object.values(prisma)) {
    if (typeof model === "function") model.mockReset();
    else for (const fn of Object.values(model)) fn.mockReset();
  }
  prisma.property.findFirst.mockResolvedValue({ id: 1, archivedAt: null });
  prisma.lease.findFirst.mockResolvedValue({ id: 2, propertyId: 1 });
  prisma.period.findFirst.mockResolvedValue({ id: 3, leaseId: 2 });
  prisma.tenant.findUnique.mockResolvedValue({ id: 8 });
  prisma.payment.findFirst.mockResolvedValue({ id: 4 });
  prisma.payment.updateMany.mockResolvedValue({ count: 1 });
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
});

describe("role-specific API contracts", () => {
  const routes = [
    [landlordApartments.GET, "LANDLORD", "GET"], [landlordApartments.POST, "LANDLORD", "POST"],
    [landlordLeases.GET, "LANDLORD", "GET"], [landlordLeases.POST, "LANDLORD", "POST"],
    [landlordLease.GET, "LANDLORD", "GET"], [landlordLease.PUT, "LANDLORD", "PUT"],
    [landlordLease.DELETE, "LANDLORD", "DELETE"], [landlordPeriod.DELETE, "LANDLORD", "DELETE"],
    [landlordTenant.PUT, "LANDLORD", "PUT"], [landlordTenant.DELETE, "LANDLORD", "DELETE"],
    [confirm.POST, "LANDLORD", "POST"], [tenantApartments.GET, "TENANT", "GET"],
    [landlordPayments.GET, "LANDLORD", "GET"],
    [tenantLeases.GET, "TENANT", "GET"], [tenantPeriods.GET, "TENANT", "GET"],
    [tenantLease.GET, "TENANT", "GET"], [tenantPeriod.GET, "TENANT", "GET"],
    [report.POST, "TENANT", "POST"],
  ];

  test("all protected routes reject anonymous requests before database access", async () => {
    user = null;
    for (const [handler, , method] of routes) {
      const response = await invoke(handler, {}, method);
      expect(response.status).toBe(401);
      expect(response.headers.get("WWW-Authenticate")).toBe("Bearer");
    }
    expect(prisma.property.findFirst).not.toHaveBeenCalled();
    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
  });

  test("all protected routes reject the other account role", async () => {
    for (const [handler, role, method] of routes) {
      user = { id: 7, role: role === "LANDLORD" ? "TENANT" : "LANDLORD" };
      expect((await invoke(handler, {}, method)).status).toBe(403);
    }
    expect(prisma.property.findFirst).not.toHaveBeenCalled();
  });

  test("tenant resource routes expose reads only", () => {
    for (const route of [tenantApartments, tenantLeases, tenantLease, tenantPeriods, tenantPeriod]) {
      for (const method of ["POST", "PUT", "PATCH", "DELETE"]) expect(route[method]).toBeUndefined();
    }
  });

  test("invalid and out-of-range parent IDs are rejected before queries", async () => {
    for (const apartment of ["0", "-1", "1.0", "01", "abc", "2147483648"]) {
      expect((await invoke(landlordLeases.GET, { apartment })).status).toBe(400);
    }
    expect(prisma.property.findFirst).not.toHaveBeenCalled();
  });

  test("foreign apartments are inaccessible", async () => {
    prisma.property.findFirst.mockResolvedValue(null);
    expect((await invoke(landlordLeases.GET, { apartment: "1" })).status).toBe(404);
    expect(prisma.property.findFirst.mock.calls[0][0].where.ownerId).toBe(7);
    expect(prisma.lease.findMany).not.toHaveBeenCalled();
  });

  test("a child lease from another apartment is rejected even during archiving", async () => {
    prisma.lease.findFirst.mockResolvedValue(null);
    expect((await invoke(landlordLease.DELETE, { apartment: "1", lease: "2" }, "DELETE")).status).toBe(404);
    expect(prisma.lease.findFirst.mock.calls[0][0].where.propertyId).toBe(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("a period from another lease is rejected before mutation", async () => {
    prisma.period.findFirst.mockResolvedValue(null);
    expect((await invoke(landlordPeriod.DELETE, { apartment: "1", lease: "2", period: "3" }, "DELETE")).status).toBe(404);
    expect(prisma.period.findFirst.mock.calls[0][0].where.leaseId).toBe(2);
  });

  test("nested lists query only the selected apartment or lease", async () => {
    prisma.lease.findMany.mockResolvedValue([]);
    prisma.period.findMany.mockResolvedValue([]);
    expect((await invoke(landlordLeases.GET, { apartment: "1" })).status).toBe(200);
    expect(prisma.lease.findMany.mock.calls[0][0].where.propertyId).toBe(1);
    expect((await invoke(landlordPeriods.GET, { apartment: "1", lease: "2" })).status).toBe(200);
    expect(prisma.period.findMany.mock.calls[0][0].where.leaseId).toBe(2);
  });

  test("tenant nested lists retain tenant-specific filtering", async () => {
    user = { id: 9, role: "TENANT" };
    prisma.lease.findMany.mockResolvedValue([]);
    const response = await invoke(tenantLeases.GET, { apartment: "1" });
    expect(response.status).toBe(200);
    const where = prisma.lease.findMany.mock.calls[0][0].where;
    expect(where.propertyId).toBe(1);
    expect(where.AND[0].OR).toEqual([{ tenants: { some: { id: 8 } } }, { payments: { some: { tenantId: 8 } } }]);
  });

  test("parent IDs in JSON cannot override the URL", async () => {
    const response = await invoke(landlordLeases.POST, { apartment: "1" }, "POST", { apartmentId: "99" });
    expect(response.status).toBe(422);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test("lease creation obtains its parent from the URL", async () => {
    prisma.tenant.count.mockResolvedValue(1);
    prisma.lease.findFirst.mockResolvedValue(null);
    prisma.lease.create.mockResolvedValue({ id: 2, propertyId: 1, startDate: new Date("2027-01-01"), endDate: new Date("2027-12-31"), rentalPrice: 120000n, tenants: [{ id: 8 }], archivedAt: null });
    const response = await invoke(landlordLeases.POST, { apartment: "1" }, "POST", {
      startDate: "2027-01-01", endDate: "2027-12-31", rentalPrice: 120000, tenantIds: ["8"],
    });
    expect(response.status).toBe(201);
    expect((await response.json()).data.apartmentId).toBe("1");
    expect(prisma.lease.create.mock.calls[0][0].data.propertyId).toBe(1);
    expect(revalidatePath).toHaveBeenCalledWith("/landlord", "layout");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  test("malformed JSON and non-object payloads produce client errors", async () => {
    expect((await invoke(landlordLeases.POST, { apartment: "1" }, "POST", "{")).status).toBe(400);
    expect((await invoke(landlordLeases.POST, { apartment: "1" }, "POST", [])).status).toBe(422);
  });

  test("cross-origin mutations cannot use cookie authentication", async () => {
    expect((await invoke(confirm.POST, { id: "4" }, "POST", undefined, { Origin: "https://elsewhere.test" })).status).toBe(403);
    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
  });

  test("reporting updates only the tenant's own pending or failed payment", async () => {
    user = { id: 9, role: "TENANT" };
    const response = await invoke(report.POST, { id: "4" }, "POST");
    expect(response.status).toBe(200);
    expect((await response.json()).data.status).toBe("pending");
    expect(prisma.payment.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 4, tenant: { userId: 9 }, status: { in: ["PENDING", "FAILED"] } }, data: { status: "REVIEW" },
    });
  });

  test("confirmation checks owner and review state in the atomic update", async () => {
    const response = await invoke(confirm.POST, { id: "4" }, "POST");
    expect(response.status).toBe(200);
    expect(prisma.payment.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 4, lease: { property: { ownerId: 7 } }, status: "REVIEW" }, data: { status: "COMPLETED" },
    });
  });

  test("inaccessible payments return 404 and stale state transitions return 409", async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    expect((await invoke(confirm.POST, { id: "4" }, "POST")).status).toBe(404);
    expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    prisma.payment.findFirst.mockResolvedValue({ id: 4 });
    prisma.payment.updateMany.mockResolvedValue({ count: 0 });
    expect((await invoke(confirm.POST, { id: "4" }, "POST")).status).toBe(409);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test("tenant edit validates input and refuses archived profiles", async () => {
    expect((await invoke(landlordTenant.PUT, { id: "8" }, "PUT", { name: "", phoneNumber: "1" })).status).toBe(422);
    prisma.tenant.findFirst.mockResolvedValue({ id: 8, archivedAt: new Date() });
    expect((await invoke(landlordTenant.PUT, { id: "8" }, "PUT", { name: "Tenant", phoneNumber: "1" })).status).toBe(409);
    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });
});

describe("landlord payment query filters", () => {
  const getPayments = (query = "") => landlordPayments.GET(
    new Request(`http://localhost:3000/api/landlord/payments${query ? `?${query}` : ""}`),
    { params: Promise.resolve({}) },
  );
  let fixtures;

  beforeEach(() => {
    const today = new Date(`${todayISO()}T00:00:00.000Z`);
    const yesterday = new Date(today.getTime() - 86400000);
    const fixture = (id, status, dueDate, extra = {}) => ({
      id, status, dueDate, ownerId: 7, apartmentId: 1, leaseId: 2, tenantId: 8,
      periodId: 3, amount: 120000n, ...extra,
    });
    fixtures = [
      fixture(1, "PENDING", yesterday), fixture(2, "PENDING", today),
      fixture(3, "REVIEW", yesterday), fixture(4, "COMPLETED", yesterday),
      fixture(5, "FAILED", yesterday), fixture(6, "PENDING", yesterday, { ownerId: 99 }),
      fixture(7, "REVIEW", today, { apartmentId: 9, leaseId: 10, tenantId: 11, periodId: 12 }),
    ];
    prisma.payment.findMany.mockImplementation(async ({ where }) => fixtures.filter((payment) =>
      payment.ownerId === where.lease.property.ownerId &&
      (where.lease.propertyId === undefined || payment.apartmentId === where.lease.propertyId) &&
      (where.leaseId === undefined || payment.leaseId === where.leaseId) &&
      (where.tenantId === undefined || payment.tenantId === where.tenantId) &&
      (where.periodId === undefined || payment.periodId === where.periodId) &&
      (where.status === undefined || payment.status === where.status) &&
      (!where.period?.dueDate?.lt || payment.dueDate < where.period.dueDate.lt) &&
      (!where.period?.dueDate?.gte || payment.dueDate >= where.period.dueDate.gte),
    ));
  });

  test("unfiltered results remain scoped to the signed-in landlord and serialize money", async () => {
    const response = await getPayments();
    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data.map((payment) => payment.id)).toEqual(["1", "2", "3", "4", "5", "7"]);
    expect(data[0].amountCents).toBe(120000);
    expect(data[0].paymentPeriodId).toBe("3");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  test("apartment, lease, tenant, period and status combine in the backend", async () => {
    const response = await getPayments("apartment=1&lease=2&tenant=8&period=3&status=pending");
    expect((await response.json()).data.map((payment) => payment.id)).toEqual(["3"]);
    expect(prisma.payment.findMany).toHaveBeenCalledTimes(1);
  });

  test("each record filter limits results independently", async () => {
    for (const query of ["apartment=9", "lease=10", "tenant=11", "period=12"]) {
      expect((await (await getPayments(query)).json()).data.map((payment) => payment.id)).toEqual(["7"]);
    }
  });

  test("foreign-owner and conflicting parent filters return an empty list", async () => {
    fixtures[5].apartmentId = 44;
    expect((await (await getPayments("apartment=44")).json()).data).toEqual([]);
    expect((await (await getPayments("apartment=1&lease=10")).json()).data).toEqual([]);
  });

  test("overdue includes only unpaid payments before today; due today remains unpaid", async () => {
    expect((await (await getPayments("status=overdue")).json()).data.map((payment) => payment.id)).toEqual(["1"]);
    expect((await (await getPayments("status=unpaid")).json()).data.map((payment) => payment.id)).toEqual(["2"]);
  });

  test("pending, confirmed and failed match their database states regardless of due date", async () => {
    for (const [status, ids] of [["pending", ["3", "7"]], ["confirmed", ["4"]], ["failed", ["5"]]]) {
      expect((await (await getPayments(`status=${status}`)).json()).data.map((payment) => payment.id)).toEqual(ids);
    }
  });

  test("invalid IDs, statuses, duplicate filters and unknown filters fail before querying", async () => {
    for (const query of ["apartment=0", "lease=-1", "tenant=01", "period=abc", "apartment=2147483648", "status=REVIEW", "status=pending&status=failed", "ownerId=99"]) {
      const response = await getPayments(query);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("Invalid payment filters.");
    }
    expect(prisma.payment.findMany).not.toHaveBeenCalled();
  });

  test("empty query values mean all payments", async () => {
    expect((await (await getPayments("apartment=&status=")).json()).data).toHaveLength(6);
  });
});
