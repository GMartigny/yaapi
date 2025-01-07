import { v4 as createUuid } from "uuid";

const cache = {};
export const notFound = Symbol("Not Found");

/**
 * @typedef {Object} Resource
 * @prop {string} uuid -
 * @prop {number} createdAt -
 * @prop {number} updatedAt -
 * @prop {*} [...field]
 */
/**
 * @param {string} resource -
 * @param {Object} item -
 * @return {Resource}
 */
export function create (resource, item) {
    if (!cache[resource]) {
        cache[resource] = [];
    }

    const created = {
        uuid: createUuid().toString(),
        createAt: Date.now(),
        updateAt: Date.now(),
        ...item,
    };

    cache[resource].push(created);

    return created;
}

/**
 * @param {string} resource -
 * @param {string} uuid -
 * @return {Resource}
 */
export function get (resource, uuid) {
    return cache[resource].find(item => item.uuid === uuid && item.active);
}

/**
 * @param {string} resource -
 * @return {Resource[]}
 */
export function getAll (resource) {
    return cache[resource] ?? [];
}

/**
 * @param {string} resource -
 * @param {string} uuid -
 * @param {Object} changes -
 * @return {Resource}
 */
export function set (resource, uuid, changes) {
    const previous = get(resource, uuid);
    if (!previous) {
        throw notFound;
    }
    return Object.assign(previous, {
        updateAt: Date.now(),
        ...changes,
    });
}

/**
 * @param {string} resource -
 * @param {string} uuid -
 */
export function remove (resource, uuid) {
    const item = get(resource, uuid);
    cache[resource].splice(cache[resource].indexOf(item), 1);
}
