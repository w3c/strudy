/**
 * The definitions checker compares CSS, dfns, and IDL extracts created by Reffy
 * to detect CSS/IDL terms that do not have a corresponding dfn in the
 * specification.
 *
 * Note: CSS extraction already relies on dfns and reports missing dfns in a
 * "warnings" property. This checker simply looks at that list.
 *
 * @module checker
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import loadJSON from '../lib/load-json.js';


/**
 * List of spec shortnames that, so far, don't follow the dfns data model
 */
const specsWithObsoleteDfnsModel = [
  'svg-animations', 'svg-markers', 'svg-strokes', 'SVG2',
  'webgl1', 'webgl2',
  'webrtc-identity'
];


/**
 * Return true when provided arrays are "equal", meaning that they contain the
 * same items
 *
 * @function
 * @private
 * @param {Array} a First array to compare
 * @param {Array} b Second array to compare
 * @return {boolean} True when arrays are equal
 */
function arraysEqual(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}


/**
 * Return the list of expected definitions from the CSS extract
 *
 * @function
 * @private
 * @param {Object} css The root of the object that describes CSS terms in the
 *   CSS extract
 * @return {Array} An array of expected definitions
 */
function getExpectedDfnsFromCSS(css) {
  const expected = (css.warnings ?? [])
    .filter(warning => warning.msg === 'Missing definition')
    .map(warning => {
      return {
        linkingText: [warning.name],
        type: warning.type,
        'for': warning.for
      };
    });

  return expected;
}


/**
 * Return true when the given CSS definition matches the expected definition
 *
 * @function
 * @private
 * @param {Object} expected Expected definition
 * @param {Object} actual Actual definition to check
 * @return {Boolean} true when actual definition matches the expected one
 */
function matchCSSDfn(expected, actual) {
  return arraysEqual(expected.linkingText, actual.linkingText) &&
    (!expected.for || arraysEqual(expected.for, actual.for)) &&
    (!expected.type || (expected.type === actual.type));
}


/**
 * Return the list of expected definitions from the IDL extract
 *
 * @function
 * @private
 * @param {Object} idl The root of the object that describes IDL terms in the
 *   `idlparsed` extract.
 * @return {Array} An array of expected definitions
 */
function getExpectedDfnsFromIdl(idl = {}) {
  // Parse IDL names that the spec defines
  const idlNames = Object.values(idl.idlNames || {});
  let expected = idlNames.map(name => getExpectedDfnsFromIdlDesc(name)).flat();

  // Parse members of IDL names that the spec extends
  const idlExtendedNames = Object.values(idl.idlExtendedNames || {});
  expected = expected.concat(idlExtendedNames.map(extended =>
      extended.map(name => getExpectedDfnsFromIdlDesc(name, { excludeRoot: true })))
    .flat(2));
  return expected;
}


/**
 * Return true if the given parsed IDL object describes a default toJSON
 * operation that references:
 * https://webidl.spec.whatwg.org/#default-tojson-steps
 *
 * @function
 * @private
 * @param {Object} desc Parsed IDL object to check
 * @return {Boolean} true when object describes a default toJSON operation.
 */
function isDefaultToJSONOperation(desc) {
  return (desc.type === 'operation') &&
    (desc.name === 'toJSON') &&
    (desc.extAttrs && desc.extAttrs.find(attr => attr.name === "Default"));
}


/**
 * Return the expected definition for the given parsed IDL structure
 *
 * @function
 * @public
 * @param {Object} idl The object that describes the IDL term in the
 *   `idlparsed` extract.
 * @param {Object} parentIdl (optional) The object that describes the parent
 *   IDL term of the term to parse (used to compute the `for` property).
 * @return {Object} The expected definition, or null if no expected definition
 *   is defined.
 */
function getExpectedDfnFromIdlDesc(idl, parentIdl) {
  function serializeArgs(args = []) {
    return args
      .map(arg => arg.variadic ? `...${arg.name}` : arg.name)
      .join(', ');
  }

  let expected = {
    linkingText: [idl.name],
    type: idl.type,
    'for': parentIdl && (parentIdl !== idl) ? [parentIdl.name] : []
  };

  switch (idl.type) {
    case 'attribute':
    case 'const':
      break;

    case 'constructor':
      // Ignore constructors for HTML elements, the spec has a dedicated
      // section for them:
      // https://html.spec.whatwg.org/multipage/dom.html#html-element-constructors
      if (!parentIdl.name.startsWith('HTML')) {
        expected.linkingText = [`constructor(${serializeArgs(idl.arguments)})`];
      }
      else {
        expected = null;
      }
      break;

    case 'enum':
      break;

    case 'enum-value':
      // The enumeration could include the empty string as a value. There
      // cannot be a matching definition in that case.
      // Note: look for the quoted value and the unquoted value
      const value = idl.value.replace(/^"(.*)"$/, '$1');
      expected.linkingText = (value !== '') ? [`"${value}"`, value] : [`"${value}"`];
      break;

    case 'field':
      expected.type = 'dict-member';
      break;

    case 'callback':
    case 'callback interface':
    case 'dictionary':
    case 'interface':
    case 'interface mixin':
    case 'namespace':
      expected.type =
        (idl.type === 'callback interface') ? 'callback' :
        (idl.type === 'interface mixin') ? 'interface' :
        idl.type;
      // Ignore partial definition
      if (idl.partial) {
        expected = null;
      }
      break;

    case 'includes':
      expected = null;
      break;

    case 'iterable':
    case 'maplike':
    case 'setlike':
      // No definition expected for iterable, maplike and setlike members
      expected = null;
      break;

    case 'operation':
      // Stringification behavior is typically defined with a
      // "stringification behavior" definition scoped to the interface
      if (idl.special === 'stringifier') {
        expected.linkingText = ['stringification behavior', 'stringificationbehavior'];
        expected.type = 'dfn';
      }
      // Ignore special "getter", "setter", "deleter" operations when they don't
      // have an identifier. They should link to a definition in the prose, but
      // the labels seem arbitrary for now.
      // Also ignore default toJSON operations. Steps are defined in WebIDL.
      else if ((idl.name ||
            ((idl.special !== 'getter') &&
            (idl.special !== 'setter') &&
            (idl.special !== 'deleter'))) &&
          !isDefaultToJSONOperation(idl)) {
        expected.linkingText = [`${idl.name}(${serializeArgs(idl.arguments)})`];
        expected.type = 'method';
      }
      else {
        expected = null;
      }
      break;

    case 'typedef':
      break;

    case 'argument':
      expected = null;
      break;

    default:
      console.warn('Unsupported IDL type', idl.type, idl);
      expected = null;
      break;
  }

  return expected;
}


/**
 * Return the list of expected definitions from a parsed IDL extract entry.
 *
 * The function is recursive.
 *
 * @function
 * @private
 * @param {Object} idl The object that describes the IDL term in the
 *   `idlparsed` extract.
 * @return {Array} An array of expected definitions
 */
function getExpectedDfnsFromIdlDesc(idl, {excludeRoot} = {excludeRoot: false}) {
  const res = [];
  const parentIdl = idl;
  const idlToProcess = excludeRoot ? [] : [idl];

  switch (idl.type) {
    case 'enum':
      if (idl.values) {
        idlToProcess.push(...idl.values);
      }
      break;

    case 'callback':
    case 'callback interface':
    case 'dictionary':
    case 'interface':
    case 'interface mixin':
    case 'namespace':
      if (idl.members) {
        idlToProcess.push(...idl.members);
      }
      break;
  }

  idlToProcess.forEach(idl => {
    const expected = getExpectedDfnFromIdlDesc(idl, parentIdl);
    if (expected) {
      expected.access = 'public';
      expected.informative = false;
      res.push(expected);
    }
  });

  return res;
}


/**
 * Return true when the given IDL definition matches the expected definition.
 *
 * The function handles overloaded methods, though not properly. That is, it
 * will only find the "right" definition for an overloaded method if the number
 * and/or the name of the arguments differ between the overloaded definitions.
 * Otherwise it will just match the first definition that looks good.
 *
 * The function works around Respec's issue #3200 for methods and constructors
 * that take only optional parameters:
 * https://github.com/speced/respec/issues/3200
 *
 * @function
 * @private
 * @param {Object} expected Expected definition
 * @param {Object} actual Actual definition to check
 * @param {Object} options Comparison options
 * @return {Boolean} true when actual definition matches the expected one
 */
function matchIdlDfn(expected, actual,
    {skipArgs, skipFor, skipType} = {skipArgs: false, skipFor: false, skipType: false}) {
  const fixedLt = actual.linkingText
    .map(lt => lt.replace(/!overload-\d/, ''))
    .map(lt => lt.replace(/\(, /, '('));
  let found = expected.linkingText.some(val => fixedLt.includes(val));
  if (!found && skipArgs) {
    const names = fixedLt.map(lt => lt.replace(/\(.*\)/, ''));
    found = expected.linkingText.some(val => {
      const valname = val.replace(/\(.*\)/, '');
      return names.find(name => name === valname);
    });
  }
  return found &&
    (expected.for.every(val => actual.for.includes(val)) || skipFor) &&
    (expected.type === actual.type || skipType);
}


/**
 * Checks the CSS and IDL extracts against the dfns extract for the given spec
 *
 * @function
 * @public
 * @param {Object} spec Crawl result for the spec to parse
 * @return {Object} An object with a css and idl property, each of them holding
 *   an array of missing CSS or IDL definitions. The function returns null when
 *   there are no missing definitions.
 */
function checkSpecDefinitions(spec) {
  if (specsWithObsoleteDfnsModel.includes(spec.shortname)) {
    return { obsoleteDfnsModel: true };
  }

  const dfns = spec.dfns ?? [];
  const css = spec.css ?? {};
  const idl = spec.idlparsed ?? {};

  // Make sure that all expected CSS definitions exist in the dfns extract
  const expectedCSSDfns = getExpectedDfnsFromCSS(css);
  const missingCSSDfns = expectedCSSDfns.map(expected => {
    let actual = dfns.find(dfn => matchCSSDfn(expected, dfn));
    if (!actual && !expected.type) {
      // Right definition is missing. For valuespaces that define functions,
      // look for a function definition without the enclosing "<>" instead
      const altText = [expected.linkingText[0].replace(/^<(.*)\(\)>$/, '$1()')];
      actual = dfns.find(dfn => arraysEqual(altText, dfn.linkingText));
    }
    if (!actual && expected.value) {
      // Still missing? For valuespaces that define functions, this may be
      // because there is no definition without parameters, try to find the
      // actual value instead
      actual = dfns.find(dfn => arraysEqual([expected.value], dfn.linkingText));
    }
    if (actual) {
      // Right definition found
      return null;
    }
    else {
      // Right definition is missing, there may be a definition that looks
      // like the one we're looking for
      const found = dfns.find(dfn =>
        arraysEqual(dfn.linkingText, expected.linkingText));
      return { expected, found };
    }
  }).filter(missing => !!missing);

  // Make sure that all expected IDL definitions exist in the dfns extract
  const expectedIdlDfns = getExpectedDfnsFromIdl(idl);
  const missingIdlDfns = expectedIdlDfns.map(expected => {
    let actual = dfns.find(dfn => matchIdlDfn(expected, dfn));
    if (actual) {
      // Right definition found
      return null;
    }
    else {
      // Right definition is missing, include the interface's definitions to
      // be able to link to it in the report
      let parent = null;
      if (expected.for && expected.for[0]) {
        parent = dfns.find(dfn =>
          (dfn.linkingText[0] === expected.for[0]) &&
          ['callback', 'dictionary', 'enum', 'interface', 'namespace'].includes(dfn.type));
      }

      // Look for a definition that seems as close as possible to the one
      // we're looking for, in the following order:
      // 1. For operations, find a definition without taking arguments into
      // account and report possible match with a "warning" flag.
      // 2. For terms linked to a parent interface-like object, find a match
      // scoped to the same parent without taking the type into account.
      // 3. Look for a definition with the same name, neither taking the type
      // nor the parent into account.
      let found = dfns.find(dfn => matchIdlDfn(expected, dfn, { skipArgs: true }));
      if (found) {
        return { expected, found, for: parent, warning: true };
      }
      found = dfns.find(dfn => matchIdlDfn(expected, dfn,
        { skipArgs: true, skipType: true }));
      if (found) {
        return { expected, found, for: parent };
      }
      found = dfns.find(dfn => matchIdlDfn(expected, dfn,
        { skipArgs: true, skipType: true, skipFor: true }));
      return { expected, found, for: parent };
    }
  }).filter(missing => !!missing);

  // Report results
  return {
    css: missingCSSDfns,
    idl: missingIdlDfns
  };
}


/**
 * Format the anomaly message to report as Markdown
 *
 * @function
 * @private
 * @param {Object} missing Object that describes missing dfn
 */
function formatAnomalyMessage(missing) {
  const exp = missing.expected;
  const found = missing.found;
  const foundFor = (found && found.for && found.for.length > 0) ?
    ' for ' + found.for.map(f => `\`${f}\``).join(',') :
    '';
  return '`' + exp.linkingText[0] + '` ' +
    (exp.type ? `with type \`${exp.type}\`` : '') + 
    (missing.for ? ` for [\`${missing.for.linkingText[0]}\`](${missing.for.href})` : '') +
    (found ? `, but found [\`${found.linkingText[0]}\`](${found.href}) with type \`${found.type}\`${foundFor}` : '');
}


/**
 * Checks the CSS and IDL extracts against the dfns extract for all specs in
 * the report, and return a list of missing definitions.
 *
 * @function
 * @public
 */
export default function studyDefinitions(specs) {
  return specs
    .map(spec => {
      const missing = checkSpecDefinitions(spec);
      const res = [];
      if (!missing.obsoleteDfnsModel) {
        for (const type of ['css', 'idl']) {
          const anomalies = missing[type];
          for (const anomaly of anomalies) {
            res.push({
              name: 'missingDfns',
              message: formatAnomalyMessage(anomaly),
              spec
            });
          }
        }
      }
      return res;
    })
    .flat();
}
