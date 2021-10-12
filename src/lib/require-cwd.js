/**
 * Wrapper around the "require" function to require files relative to the
 * current working directory (CWD), instead of relative to the current JS
 * file.
 *
 * This is typically needed to be able to use "require" to load JSON config
 * files provided as command-line arguments.
 *
 * @function
 * @param {String} filename The path to the file to require
 * @return {Object} The result of requiring the file relative to the current
 *   working directory.
 */
const path = require('path');

module.exports = function requireFromWorkingDirectory(filename) {
  try {
    return require(path.resolve(filename));
  }
  catch (err) {
    return null;
  }
}