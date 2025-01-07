const port = 3333;
const base = `http://localhost:${port}`;

/**
 * @param {string} url -
 * @param {RequestInit} [init] -
 * @return {Promise<any>}
 */
async function request (url, { method, body } = {}) {
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        ...(body ? {
            body: JSON.stringify(body),
        } : undefined),
    });
    if (response.ok) {
        return response.json();
    }

    throw new Error(`Fail to fetch ${response.url}`);
}

/**
 * @param {string} resource -
 * @param {Object} body -
 * @return {Promise<*>}
 */
async function post (resource, body) {
    return request(`${base}/${resource}`, {
        method: "POST",
        body,
    });
}

/**
 * @param {string} resource -
 * @param {string} [uuid] -
 * @param {Object} [params] -
 * @return {Promise<*>}
 */
async function get (resource, uuid, params) {
    return request(`${base}/${resource}${uuid ? `/${uuid}` : ""}${params ? `?${new URLSearchParams(params)}` : ""}`);
}

/**
 * @param {string} resource -
 * @param {string} uuid -
 * @param {Object} body -
 * @return {Promise<*>}
 */
async function update (resource, uuid, body) {
    return request(`${base}/${resource}/${uuid}`, {
        method: "PATCH",
        body,
    });
}

/**
 * @param {string} resource -
 * @param {string} uuid -
 * @return {Promise<*>}
 */
async function remove (resource, uuid) {
    return request(`${base}/${resource}/${uuid}`, {
        method: "DELETE",
    });
}

/**
 * @param {string} test -
 * @param {*} value -
 * @param {*} expected -
 */
function check (test, value, expected) {
    console.assert(value === expected, `${test} is ${value} instead of ${expected}`);
}

console.log(`Starting tests on port ${port}`);

const [alice, bob] = await Promise.all([
    post("users", {
        name: "Alice",
        age: 16,
    }),
    post("users", {
        name: "Bob",
        age: 42,
    }),
]);

{
    const users = await get("users");

    check("Number of users", users.length, 2);
    check("Alice's name", alice.name, "Alice");
    check("Bob's name", bob.name, "Bob");
}

{
    const minors = await get("users", undefined, {
        age: "<18",
    });
    check("Number of minors", minors.length, 1);
}

{
    const li = await get("users", undefined, {
        name: "*li*",
    });
    check("Number of person with 'li' in their name", li.length, 1);
    check("First person's name with a 'li' in their name", li[0].name, "Alice");
}

{
    const updated = await update("users", alice.uuid, {
        age: 22,
    });
    check("Alice's age", updated.age, 22);
    check("Alice's name", updated.name, "Alice");
}

{
    await remove("users", bob.uuid);
    const users = await get("users");
    check("Number of users", users.length, 1);
}

console.log("Tests done");
