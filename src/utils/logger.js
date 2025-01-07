export const levels = {
    log: "log",
    warn: "warn",
    error: "error",
    info: "info",
    debug: "debug",
};

/**
 * @param {string} message -
 * @param {string} [level="log"] -
 */
export default function logger (message, level = levels.log) {
    // eslint-disable-next-line no-console
    console[level](`${new Date().toISOString()} - ${message}`);
}
