import { createApp, createRouter, defineEventHandler, readBody, createError, toNodeListener } from "h3";
import { listen } from "listhen";
import { create, get, getAll, set, remove, notFound } from "./database.js";
import logger, { levels } from "./utils/logger.js";

/**
 * @throws {H3Error}
 */
function send404 () {
    throw createError({
        status: 404,
        message: notFound,
    });
}

/**
 * @typedef {Object} ResourceMeta
 * @prop {string[]} routes
 */
/**
 * @typedef {Object} Resource
 * @prop {ResourceMeta} meta
 */
/**
 * @typedef {Object} ResourceDefinition
 * @prop {Resource} [[key: string]] - The resource name
 */
/**
 * @typedef {Object} YaapiServer
 * @prop {(port: number) => void} start - Start the server on the given port
 * @prop {H3App} app - H3 app
 */
/**
 * Create a server with the given resources
 * @param {ResourceDefinition} resources - The resources to create the server with
 * @return { YaapiServer }
 */
export default function createServer (resources) {
    const app = createApp();
    const router = createRouter();

    app.use(router);

    Object.keys(resources).forEach((name) => {
        logger(`Creating [${name}] routes:`, levels.info);
        const { meta } = resources[name];

        const hasSoftDelete = meta.routes.includes("soft-delete");
        if (hasSoftDelete && meta.routes.includes("hard-delete")) {
            throw new Error("Cannot have both soft and hard delete");
        }

        meta.routes.forEach((route) => {
            const path = `/${name}`;
            const pathUuid = `${path}/:uuid`;

            switch (route) {
                case "create":
                    logger("  * create", levels.info);
                    router.post(path, defineEventHandler(async (event) => {
                        const body = await readBody(event);
                        return create(name, {
                            ...(hasSoftDelete ? {
                                active: true,
                            } : null),
                            ...body,
                        });
                    }));
                    break;
                case "get-list":
                    logger("  * get-list", levels.info);
                    router.get(path, defineEventHandler(() => {
                        const list = getAll(name);
                        if (hasSoftDelete) {
                            return list.filter(({ active }) => active);
                        }

                        return list;
                    }));
                    break;
                case "get-one":
                    logger("  * get-one", levels.info);
                    router.get(pathUuid, defineEventHandler((event) => {
                        try {
                            return get(name, event.context.params.uuid);
                        }
                        catch (error) {
                            if (error === notFound) {
                                return send404();
                            }

                            throw createError({
                                status: 500,
                            });
                        }
                    }));
                    break;
                case "update":
                    logger("  * update", levels.info);
                    router.patch(pathUuid, defineEventHandler(async (event) => {
                        try {
                            return set(name, event.context.params.uuid, await readBody(event));
                        }
                        catch (error) {
                            if (error === notFound) {
                                return send404();
                            }

                            throw createError({
                                status: 500,
                            });
                        }
                    }));
                    break;
                case "soft-delete":
                    logger("  * soft-delete", levels.info);
                    router.delete(pathUuid, defineEventHandler((event) => {
                        try {
                            return set(name, event.context.params.uuid, {
                                active: false,
                            });
                        }
                        catch (error) {
                            if (error === notFound) {
                                return send404();
                            }

                            throw createError({
                                status: 500,
                            });
                        }
                    }));
                    break;
                case "hard-delete":
                    logger("  * hard-delete", levels.info);
                    router.delete(pathUuid, defineEventHandler((event) => {
                        try {
                            return remove(name, event.context.params.uuid);
                        }
                        catch (error) {
                            if (error === notFound) {
                                return send404();
                            }

                            throw createError({
                                status: 500,
                            });
                        }
                    }));
                    break;
                default:
                    throw new Error(`Unknown route: ${route}`);
            }
        });
    });

    return {
        app,
        start (port) {
            return listen(toNodeListener(app), {
                port,
            });
        },
    };
}
