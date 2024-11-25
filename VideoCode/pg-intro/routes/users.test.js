// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testUser;

beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO users (name, type) VALUES ('Peanut', 'admin') RETURNING id, name, type`
  );
  testUser = result.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM users`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /users", () => {
  test("Get a list with one user", async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ users: [testUser] });
  });
});

describe("GET /users/:id", () => {
  test("Get a user", async () => {
    const res = await request(app).get(`/users/${testUser.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ user: testUser });
  });

  test("Try to get an invalid user", async () => {
    const res = await request(app).get(`/users/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /users", () => {
  test("Creates a single user", async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Billybob', type: 'admin' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      user: {
        id: expect.any(Number),
        name: 'Billybob',
        type: 'admin',
      },
    });
  });
});

describe("PATCH /users", () => {
  test("Updates a single user", async () => {
    const res = await request(app)
      .patch(`/users/${testUser.id}`)
      .send({ name: 'Billybob', type: 'admin' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      user: {
        id: testUser.id, // Use dynamic testUser.id
        name: 'Billybob',
        type: 'admin',
      },
    });
  });
});

describe("DELETE /users", () => {
  test("Deletes a single user", async () => {
    const res = await request(app).delete(`/users/${testUser.id}`);
    expect(res.statusCode).toBe(200);

    // Confirm the user was deleted
    const check = await db.query(`SELECT * FROM users WHERE id = $1`, [
      testUser.id,
    ]);
    expect(check.rows.length).toBe(0);
  });
});
