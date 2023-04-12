/**
 * Analyze the Web IDL extracted during a crawl and create an anomalies report.
 *
 * Returned report is a list of anomalies. Each anomaly follows the following
 * object structure:
 * 
 * {
 *   "category": "webidl",
 *   "name": "type of anomaly",
 *   "message": "Description of the anomaly",
 *   "specs": [
 *     { spec that contains or triggers the anomaly },
 *     { another spec that contains or triggers the anomaly },
 *     ...
 *   ]
 * }
 *
 * All anomalies will be associated with at least one spec (so specs.length > 0)
 * but some of them may be associated with more than one, when the code cannot
 * tell which of them needs to be fixed (e.g. when checking duplicates while
 * merging partials).
 *
 * The spec object returned in the "specs" array is the spec object provided in
 * the crawl results parameter.
 */

const { expandCrawlResult } = require("reffy");
const fetch = require("node-fetch");
const WebIDL2 = require("webidl2");

const getSpecs = list => [...new Set(list.map(({spec}) => spec))];
const specName = spec => spec.shortname ?? spec.url;

const possibleAnomalies = [
  "invalid",
  "redefined",
  "redefinedIncludes",
  "redefinedWithDifferentTypes",
  "noExposure",
  "unknownExposure",
  "incompatiblePartialIdlExposure",
  "noOriginalDefinition",
  "unexpectedEventHandler",
  "singleEnumValue",
  "wrongCaseEnumValue",
  "wrongKind",
  "unknownType",
  "unknownExtAttr"
];

const basicTypes = new Set([
  // Types defined by Web IDL itself:
  "any", // https://heycam.github.io/webidl/#idl-any
  "ArrayBuffer", // https://heycam.github.io/webidl/#idl-ArrayBuffer
  "bigint", // https://heycam.github.io/webidl/#idl-bigint
  "boolean", // https://heycam.github.io/webidl/#idl-boolean
  "byte", // https://heycam.github.io/webidl/#idl-byte
  "ByteString", // https://heycam.github.io/webidl/#idl-ByteString
  "DataView", // https://heycam.github.io/webidl/#idl-DataView
  "DOMString", // https://heycam.github.io/webidl/#idl-DOMString
  "double", // https://heycam.github.io/webidl/#idl-double
  "float", // https://heycam.github.io/webidl/#idl-float
  "Float32Array", // https://heycam.github.io/webidl/#idl-Float32Array
  "Float64Array", // https://heycam.github.io/webidl/#idl-Float64Array
  "Int16Array", // https://heycam.github.io/webidl/#idl-Int16Array
  "Int32Array", // https://heycam.github.io/webidl/#idl-Int32Array
  "Int8Array", // https://heycam.github.io/webidl/#idl-Int8Array
  "long long", // https://heycam.github.io/webidl/#idl-long-long
  "long", // https://heycam.github.io/webidl/#idl-long
  "object", // https://heycam.github.io/webidl/#idl-object
  "octet", // https://heycam.github.io/webidl/#idl-octet
  "short", // https://heycam.github.io/webidl/#idl-short
  "symbol", // https://heycam.github.io/webidl/#idl-symbol
  "BigUint64Array", // https://heycam.github.io/webidl/#idl-BigUint64Array
  "BigInt64Array", // https://heycam.github.io/webidl/#idl-BigInt64Array
  "Uint16Array", // https://heycam.github.io/webidl/#idl-Uint16Array
  "Uint32Array", // https://heycam.github.io/webidl/#idl-Uint32Array
  "Uint8Array", // https://heycam.github.io/webidl/#idl-Uint8Array
  "Uint8ClampedArray", // https://heycam.github.io/webidl/#idl-Uint8ClampedArray
  "unrestricted double", // https://heycam.github.io/webidl/#idl-unrestricted-double
  "unrestricted float", // https://heycam.github.io/webidl/#idl-unrestricted-float
  "unsigned long long", // https://heycam.github.io/webidl/#idl-unsigned-long-long
  "unsigned long", // https://heycam.github.io/webidl/#idl-unsigned-long
  "unsigned short", // https://heycam.github.io/webidl/#idl-unsigned-short
  "USVString", // https://heycam.github.io/webidl/#idl-USVString
  "undefined", // https://heycam.github.io/webidl/#idl-undefined

  // Types defined by other specs:
  "CSSOMString", // https://drafts.csswg.org/cssom/#cssomstring-type
  "WindowProxy" // https://html.spec.whatwg.org/multipage/window-object.html#windowproxy
]);


const knownExtAttrs = new Set([
  // Extended attributes defined by Web IDL itself:
  "AllowShared", // https://heycam.github.io/webidl/#AllowShared
  "Clamp", // https://heycam.github.io/webidl/#Clamp
  "CrossOriginIsolated", // https://heycam.github.io/webidl/#CrossOriginIsolated
  "Default", // https://heycam.github.io/webidl/#Default
  "EnforceRange", // https://heycam.github.io/webidl/#EnforceRange
  "Exposed", // https://heycam.github.io/webidl/#Exposed
  "Global", // https://heycam.github.io/webidl/#Global
  "LegacyFactoryFunction", // https://heycam.github.io/webidl/#LegacyFactoryFunction
  "LegacyLenientSetter", // https://heycam.github.io/webidl/#LegacyLenientSetter
  "LegacyLenientThis", // https://heycam.github.io/webidl/#LegacyLenientThis
  "LegacyNamespace", // https://heycam.github.io/webidl/#LegacyNamespace
  "LegacyNoInterfaceObject", // https://heycam.github.io/webidl/#LegacyNoInterfaceObject
  "LegacyNullToEmptyString", // https://heycam.github.io/webidl/#LegacyNullToEmptyString
  "LegacyOverrideBuiltIns", // https://heycam.github.io/webidl/#LegacyOverrideBuiltIns
  "LegacyTreatNonObjectAsNull", // https://heycam.github.io/webidl/#LegacyTreatNonObjectAsNull
  "LegacyUnenumerableNamedProperties", // https://heycam.github.io/webidl/#LegacyUnenumerableNamedProperties
  "LegacyUnforgeable", // https://heycam.github.io/webidl/#LegacyUnforgeable
  "LegacyWindowAlias", // https://heycam.github.io/webidl/#LegacyWindowAlias
  "NewObject", // https://heycam.github.io/webidl/#NewObject
  "PutForwards", // https://heycam.github.io/webidl/#PutForwards
  "Replaceable", // https://heycam.github.io/webidl/#Replaceable
  "SameObject", // https://heycam.github.io/webidl/#SameObject
  "SecureContext", // https://heycam.github.io/webidl/#SecureContext
  "Unscopable", // https://heycam.github.io/webidl/#Unscopable

  // Extended attributes defined by other specs:
  "CEReactions", // https://html.spec.whatwg.org/multipage/custom-elements.html#cereactions
  "HTMLConstructor", // https://html.spec.whatwg.org/multipage/dom.html#htmlconstructor
  "Serializable", // https://html.spec.whatwg.org/multipage/structured-data.html#serializable
  "StringContext", // https://w3c.github.io/webappsec-trusted-types/dist/spec/#webidl-string-context-xattr
  "Transferable", // https://html.spec.whatwg.org/multipage/structured-data.html#transferable
  "WebGLHandlesContextLoss" // https://registry.khronos.org/webgl/specs/latest/1.0/##5.14
]);


async function studyWebIdl(edResults) {
  const report = [];              // List of anomalies to report
  const dfns = {};                // Index of IDL definitions (save includes)
  const includesStatements = {};  // Index of "includes" statements
  const globals = {};             // Index of globals defined in the IDL
  const objectTypes = {};         // Index of interface types
  const usedTypes = {};           // Index of types used in the IDL
  const usedExtAttrs = {};        // Index of extended attributes

  // Record an anomaly for the given spec(s).
  function recordAnomaly(specs, name, message) {
    if (!specs) {
      throw new Error(`Cannot record an anomaly without also recording an offending spec`);
    }
    specs = Array.isArray(specs) ? specs : [specs];
    specs = [...new Set(specs)];
    if (!possibleAnomalies.includes(name)) {
      throw new Error(`Cannot record an anomaly with name "${name}"`);
    }
    report.push({ category: "webidl", name, message, specs });
  }

  function inheritsFrom(iface, ancestor) {
    if (!iface.inheritance) return false;
    if (iface.inheritance === ancestor) return true;
    const parentInterface = dfns[iface.inheritance].find(({idl}) => !idl.partial)?.idl;
    if (!parentInterface) return false;
    return inheritsFrom(parentInterface, ancestor);
  }

  // TODO: a full check of event handlers would require:
  // - checking if the interface doesn't include a mixin with eventhandlers
  function checkEventHandlers(spec, memberHolder, iface = memberHolder) {
    const eventHandler = memberHolder.members.find(m => m?.name?.startsWith("on") && m.type === "attribute" && m.idlType?.idlType === "EventHandler");
    if (eventHandler && !inheritsFrom(iface, "EventTarget")) {
      recordAnomaly(spec, "unexpectedEventHandler", `The interface "${iface.name}" defines an event handler "${eventHandler.name}" but does not inherit from EventTarget`);
    }
  }

  function getExposure(iface) {
    let exposure = iface.extAttrs.find(ea => ea.name === "Exposed")?.rhs;
    if (!exposure) {
      return [];
    }
    if (exposure.type === "*") {
      return ["*"];
    }
    if (exposure.type === "identifier-list") {
      exposure = exposure.value.map(({value}) => value);
    }
    else if (exposure.type === "identifier") {
      exposure = [exposure.value];
    }
    // Expand encompassing globals to facilitate comparison
    let additionalExposures = [];
    for (let value of exposure) {
      if (globals[value]?.subrealms.length) {
        additionalExposures = additionalExposures.concat(globals[value].subrealms);
      }
    }
    // remove duplicate values
    exposure = [...new Set(exposure.concat(additionalExposures))];
    return exposure;
  }

  function checkExposure(spec, iface, mainInterface) {
    // Make sure that the interface is defined somewhere
    const ifaceExposure = getExposure(iface);
    if (ifaceExposure.length === 0 && !iface.partial) {
      recordAnomaly(spec, "noExposure", `The interface "${iface.name}" has no [Exposed] extended attribute`);
    }
    // Make sure that the interface is exposed on known globals
    else if (ifaceExposure.length > 0 && ifaceExposure[0] !== "*") {
      const unknown = ifaceExposure.filter(e => !Object.keys(globals).includes(e));
      if (unknown.length > 0) {
        recordAnomaly(spec, "unknownExposure", `The [Exposed] extended attribute of the interface "${iface.name}" references unknown global(s): ${unknown.join(", ")}`);
      }
    }

    // Make sure that exposure of partial is compatible with original
    if (iface.partial) {
      const mainExposure = getExposure(mainInterface);
      if (ifaceExposure[0] === "*" && mainExposure[0] !== "*") {
        recordAnomaly(spec, "incompatiblePartialIdlExposure", `The partial interface "${iface.name}" is exposed on all globals but the original interface is not (${mainExposure.join(", ")})`);
      }
      else if (ifaceExposure.length > 0 && mainExposure.length > 0 && mainExposure[0] !== "*") {
        const problematic = ifaceExposure.filter(x => !mainExposure.includes(x));
        if (problematic.length > 0) {
          recordAnomaly(spec, "incompatiblePartialIdlExposure", `The [Exposed] extended attribute of the partial interface "${iface.name}" references globals on which the original interface is not exposed: ${problematic.join(", ")} (original exposure: ${mainExposure.join(", ")})`);
        }
      }
    }
  }

  function checkEnumMultipleValues(spec, idl) {
    if (idl.values.length <= 1) {
      recordAnomaly(spec, "singleEnumValue", `The enum "${idl.name}" has fewer than 2 possible values`);
    }
  }

  function checkSyntaxOfEnumValue(spec, idl) {
    idl.values.forEach(({value}) => {
      if (value.match(/[A-Z_]/)) {
        recordAnomaly(spec, "wrongCaseEnumValue", `The value "${value}" of the enum "${idl.name}" does not match the expected conventions (lower case, hyphen separated words)`);
      }
    });
  }

  function checkInheritance(spec, idl) {
    if (!idl.inheritance) return;
    const parent = dfns[idl.inheritance];
    if (!parent) {
      recordAnomaly(spec, "unknownType", `"${idl.name}" inherits from "${idl.inheritance}" which is not defined anywhere`);
    }
    else if (parent[0].idl.type !== idl.type) {
      recordAnomaly(spec, "wrongKind", `"${idl.name}" is of kind "${idl.type}" but inherits from "${idl.inheritance}" which is of kind "${parent[0].idl.type}"`);
    }
  }

  // Parse an AST node to extract the list of types and extended attributes
  // that the node uses. Note that, in the indexes, we only store the root
  // definition, not the exact method or parameter where the type or extended
  // attribute is found.
  function parseIdlNode(node, spec, dfn) {
    dfn = dfn ?? node;
    for (const [key, value] of Object.entries(node)) {
      if (key === "idlType") {
        if (!usedTypes[value.idlType]) {
          usedTypes[value.idlType] = [];
        }
        usedTypes[value.idlType].push({ spec, idl: dfn });
      }
      else if (key === "extAttrs" && Array.isArray(value)) {
        for (const extAttr of value) {
          if (!usedExtAttrs[extAttr.name]) {
            usedExtAttrs[extAttr.name] = [];
          }
          usedExtAttrs[extAttr.name].push({ spec, idl: dfn });
        }
      }
      else if (typeof value === "object" && value !== null) {
        // Recurse into methods and parameters
        parseIdlNode(value, spec, dfn);
      }
    }
  }

  edResults
    // We're only interested in specs that define Web IDL content
    .filter(spec => !!spec.idl)

    // Parse the Web IDL into AST trees,
    // reporting invalid IDL content as anomalies
    .map(spec => {
      try {
        const ast = WebIDL2.parse(spec.idl);
        return { spec, ast };
      }
      catch (e) {
        recordAnomaly(spec, "invalid", e.message);
        return { spec };
      }
    })

    // Filter out specs that contain invalid Web IDL content
    .filter(res => !!res.ast)

    // Populate internal indexes from AST trees
    .forEach(({ spec, ast }) => {
      for (let dfn of ast) {
        if (dfn.name) {
          // Basically all definitions except includes statements:
          // https://webidl.spec.whatwg.org/#index-prod-Definition
          if (!dfns[dfn.name]) {
            dfns[dfn.name] = [];
          }
          dfns[dfn.name].push({spec, idl: dfn});
          let globalEA;
          if (dfn.type === "interface" && (globalEA = dfn?.extAttrs?.find(ea => ea.name === "Global"))) {
            // mostly copied from webidlpedia - DRY?
            const globalValues = Array.isArray(globalEA.rhs.value) ? globalEA.rhs.value.map(({value}) => value) : [globalEA.rhs.value];
            for (const value of globalValues)  {
              // "*" is not a name
              if (value === "*") break;
              if (!globals[value]) {
                globals[value] = {components: []};
              }
              globals[value].components.push(dfn.name);
            }
          }
          parseIdlNode(dfn, spec);
        }
        else if (dfn.type === "includes") {
          // Includes statement:
          // https://webidl.spec.whatwg.org/#index-prod-IncludesStatement
          const key = `${dfn.target} includes ${dfn.includes}`;
          if (!includesStatements[key]) {
            includesStatements[key] = [];
             }
          includesStatements[key].push({spec, idl: dfn});
        }
        else {
          // Apart from includes statements, all valid Web IDL definitions have
          // a name. We should only ever reach this point if the WebIDL parser
          // has a bug or if the WebIDL grammar starts supporting a new type of
          // construct that would require updating the above logic.
          throw new Error(`Unknown definition in parsed Web IDL: ${JSON.stringify(dfn)}`);
        }
      }
    });

  // A global may either be a real realm definition of a grouping of realms,
  // depending on how many interfaces use the global name.
  // TODO: mostly copied from webidlpedia - DRY?
  for (const global of Object.keys(globals)) {
    let subrealms = [];
    if (globals[global].components.length > 1) {
      subrealms = Object.keys(globals).filter(g => globals[g].components.length === 1 && globals[global].components.includes(globals[g].components[0]));
    }
    globals[global].subrealms = subrealms;
  }

  // Time to run checks on IDL definitions
  for (const name in dfns) {
    const types = new Set(dfns[name].map(({idl}) => idl.type));
    const specs = getSpecs(dfns[name]);
    if (types.size > 1) {
      recordAnomaly(specs, "redefinedWithDifferentTypes", `"${name}" is defined multiple times with different types (${[...types].join(', ')}) in ${specs.map(specName).join(', ')}`);
      continue;
    }
    const type = [...types][0];
    let mainDef;
    const allowPartials = ["interface", "dictionary", "namespace", "interface mixin"];
    if (allowPartials.includes(type)) {
      const mainDefs = dfns[name].filter(({idl}) => !idl.partial);
      if (mainDefs.length === 0) {
        recordAnomaly(specs, "noOriginalDefinition", `"${name}" is only defined as a partial ${type} (in ${specs.map(specName).join(', ')})`);
        continue;
      }
      else if (mainDefs.length > 1) {
        recordAnomaly(getSpecs(mainDefs), "redefined", `"${name}" is defined as a non-partial ${type} mutiple times in ${getSpecs(mainDefs).map(specName).join(', ')}`);
      }
      mainDef = mainDefs[0].idl;
    }
    else {
      if (dfns[name].length > 1) {
        recordAnomaly(dfns[name].map(({spec}) => spec), "redefined", `"${name}" is defined multiple times (with type ${type}) in ${specs.map(specName).join(', ')}`);
      }
      else {
        mainDef = dfns[name][0].idl;
      }
    }
    for (let {spec, idl} of dfns[name]) {
      switch(idl.type) {
      case "dictionary":
        checkInheritance(spec, mainDef);
        break;
      case "interface":
        checkEventHandlers(spec, idl, mainDef);
        checkExposure(spec, idl, mainDef);
        checkInheritance(spec, mainDef);
        break;
      case "enum":
        checkEnumMultipleValues(spec, idl);
        checkSyntaxOfEnumValue(spec, idl);
        break;
      }
    }
  }

  // Check includes statements
  for (const key in includesStatements) {
    const statements = includesStatements[key];
    if (statements.length > 1) {
      const specs = getSpecs(statements);
      recordAnomaly(specs, "redefinedIncludes", `The includes statement "${key}" is defined more than once in ${specs.map(specName).join(', ')}`);
    }
    else {
      const statement = statements[0];
      includesStatements[key] = statement;

      // Check target exists and is an interface
      const target = dfns[statement.idl.target];
      if (!target) {
        recordAnomaly(statement.spec, "unknownType", `Target "${statement.idl.target}" in includes statement "${key}" is not defined anywhere`);
      }
      else if (target[0].idl.type !== "interface") {
        recordAnomaly(statement.spec, "wrongKind", `Target "${statement.idl.target}" in includes statement "${key}" must be of kind "interface", not "${target[0].idl.type}"`);
      }

      // Check mixin exists and is an interface mixin
      const mixin = dfns[statement.idl.includes];
      if (!mixin) {
        recordAnomaly(statement.spec, "unknownType", `Mixin "${statement.idl.includes}" in includes statement "${key}" is not defined anywhere`);
      }
      else if (mixin[0].idl.type !== "interface mixin") {
        recordAnomaly(statement.spec, "wrongKind", `Mixin "${statement.idl.includes}" in includes statement "${key}" must be of kind "interface mixin", not "${mixin[0].idl.type}"`);
      }
    }
  }

  // Report unknown used types
  for (const name in usedTypes) {
    if (!basicTypes.has(name) && !dfns[name]) {
      for (const { spec, idl } of usedTypes[name]) {
        recordAnomaly(spec, "unknownType", `Unknown type "${name}" used in definition of "${idl.name}"`);
      }
    }
  }

  // Report unknown extended attributes
  for (const name in usedExtAttrs) {
    if (!knownExtAttrs.has(name)) {
      for (const { spec, idl } of usedExtAttrs[name]) {
        recordAnomaly(spec, "unknownExtAttr", `Unknown extended attribute "${name}" used in definition of "${idl.name}"`);
      }
    }
  }


  return report;
}

/**************************************************
Export methods for use as module
**************************************************/
module.exports = { studyWebIdl };
