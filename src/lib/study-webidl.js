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

const { recordCategorizedAnomaly } = require("./util");
const WebIDL2 = require("webidl2");

const getSpecs = list => [...new Set(list.map(({spec}) => spec))];
const specName = spec => spec.shortname ?? spec.url;
const dfnName = dfn => `${dfn.idl.partial ? 'partial ' : ''}${dfn.idl.type} "${dfn.idl.name}"`;

const possibleAnomalies = [
  "incompatiblePartialIdlExposure",
  "invalid",
  "noExposure",
  "noOriginalDefinition",
  "overloaded",
  "redefined",
  "redefinedIncludes",
  "redefinedMember",
  "redefinedWithDifferentTypes",
  "singleEnumValue",
  "unexpectedEventHandler",
  "unknownExposure",
  "unknownExtAttr",
  "unknownType",
  "wrongCaseEnumValue",
  "wrongKind",
  "wrongType"
];

const basicTypes = new Set([
  // Types defined by Web IDL itself:
  "any", // https://webidl.spec.whatwg.org/#idl-any
  "ArrayBuffer", // https://webidl.spec.whatwg.org/#idl-ArrayBuffer
  "bigint", // https://webidl.spec.whatwg.org/#idl-bigint
  "boolean", // https://webidl.spec.whatwg.org/#idl-boolean
  "byte", // https://webidl.spec.whatwg.org/#idl-byte
  "ByteString", // https://webidl.spec.whatwg.org/#idl-ByteString
  "DataView", // https://webidl.spec.whatwg.org/#idl-DataView
  "DOMString", // https://webidl.spec.whatwg.org/#idl-DOMString
  "double", // https://webidl.spec.whatwg.org/#idl-double
  "float", // https://webidl.spec.whatwg.org/#idl-float
  "Float32Array", // https://webidl.spec.whatwg.org/#idl-Float32Array
  "Float64Array", // https://webidl.spec.whatwg.org/#idl-Float64Array
  "Int16Array", // https://webidl.spec.whatwg.org/#idl-Int16Array
  "Int32Array", // https://webidl.spec.whatwg.org/#idl-Int32Array
  "Int8Array", // https://webidl.spec.whatwg.org/#idl-Int8Array
  "long long", // https://webidl.spec.whatwg.org/#idl-long-long
  "long", // https://webidl.spec.whatwg.org/#idl-long
  "object", // https://webidl.spec.whatwg.org/#idl-object
  "octet", // https://webidl.spec.whatwg.org/#idl-octet
  "short", // https://webidl.spec.whatwg.org/#idl-short
  "symbol", // https://webidl.spec.whatwg.org/#idl-symbol
  "BigUint64Array", // https://webidl.spec.whatwg.org/#idl-BigUint64Array
  "BigInt64Array", // https://webidl.spec.whatwg.org/#idl-BigInt64Array
  "Uint16Array", // https://webidl.spec.whatwg.org/#idl-Uint16Array
  "Uint32Array", // https://webidl.spec.whatwg.org/#idl-Uint32Array
  "Uint8Array", // https://webidl.spec.whatwg.org/#idl-Uint8Array
  "Uint8ClampedArray", // https://webidl.spec.whatwg.org/#idl-Uint8ClampedArray
  "unrestricted double", // https://webidl.spec.whatwg.org/#idl-unrestricted-double
  "unrestricted float", // https://webidl.spec.whatwg.org/#idl-unrestricted-float
  "unsigned long long", // https://webidl.spec.whatwg.org/#idl-unsigned-long-long
  "unsigned long", // https://webidl.spec.whatwg.org/#idl-unsigned-long
  "unsigned short", // https://webidl.spec.whatwg.org/#idl-unsigned-short
  "USVString", // https://webidl.spec.whatwg.org/#idl-USVString
  "undefined", // https://webidl.spec.whatwg.org/#idl-undefined

  // Types defined by other specs:
  "CSSOMString", // https://drafts.csswg.org/cssom/#cssomstring-type
  "WindowProxy" // https://html.spec.whatwg.org/multipage/window-object.html#windowproxy
]);


const knownExtAttrs = new Set([
  // Extended attributes defined by Web IDL itself:
  "AllowResizable", // https://webidl.spec.whatwg.org/#AllowResizable
  "AllowShared", // https://webidl.spec.whatwg.org/#AllowShared
  "Clamp", // https://webidl.spec.whatwg.org/#Clamp
  "CrossOriginIsolated", // https://webidl.spec.whatwg.org/#CrossOriginIsolated
  "Default", // https://webidl.spec.whatwg.org/#Default
  "EnforceRange", // https://webidl.spec.whatwg.org/#EnforceRange
  "Exposed", // https://webidl.spec.whatwg.org/#Exposed
  "Global", // https://webidl.spec.whatwg.org/#Global
  "LegacyFactoryFunction", // https://webidl.spec.whatwg.org/#LegacyFactoryFunction
  "LegacyLenientSetter", // https://webidl.spec.whatwg.org/#LegacyLenientSetter
  "LegacyLenientThis", // https://webidl.spec.whatwg.org/#LegacyLenientThis
  "LegacyNamespace", // https://webidl.spec.whatwg.org/#LegacyNamespace
  "LegacyNoInterfaceObject", // https://webidl.spec.whatwg.org/#LegacyNoInterfaceObject
  "LegacyNullToEmptyString", // https://webidl.spec.whatwg.org/#LegacyNullToEmptyString
  "LegacyOverrideBuiltIns", // https://webidl.spec.whatwg.org/#LegacyOverrideBuiltIns
  "LegacyTreatNonObjectAsNull", // https://webidl.spec.whatwg.org/#LegacyTreatNonObjectAsNull
  "LegacyUnenumerableNamedProperties", // https://webidl.spec.whatwg.org/#LegacyUnenumerableNamedProperties
  "LegacyUnforgeable", // https://webidl.spec.whatwg.org/#LegacyUnforgeable
  "LegacyWindowAlias", // https://webidl.spec.whatwg.org/#LegacyWindowAlias
  "NewObject", // https://webidl.spec.whatwg.org/#NewObject
  "PutForwards", // https://webidl.spec.whatwg.org/#PutForwards
  "Replaceable", // https://webidl.spec.whatwg.org/#Replaceable
  "SameObject", // https://webidl.spec.whatwg.org/#SameObject
  "SecureContext", // https://webidl.spec.whatwg.org/#SecureContext
  "Unscopable", // https://webidl.spec.whatwg.org/#Unscopable

  // Extended attributes defined by other specs:
  "CEReactions", // https://html.spec.whatwg.org/multipage/custom-elements.html#cereactions
  "HTMLConstructor", // https://html.spec.whatwg.org/multipage/dom.html#htmlconstructor
  "Serializable", // https://html.spec.whatwg.org/multipage/structured-data.html#serializable
  "StringContext", // https://w3c.github.io/webappsec-trusted-types/dist/spec/#webidl-string-context-xattr
  "Transferable", // https://html.spec.whatwg.org/multipage/structured-data.html#transferable
  "WebGLHandlesContextLoss" // https://registry.khronos.org/webgl/specs/latest/1.0/##5.14
]);

const listIdlTypes = type => {
  if (Array.isArray(type)) return type.map(listIdlTypes).flat();
  if (typeof type === "string") return [type];
  return listIdlTypes(type.idlType);
};

// Helper to test if two members define the same thing, such as the same
// attribute or the same method. Should match requirements in spec:
// https://heycam.github.io/webidl/#idl-overloading
function isOverloadedOperation(a, b) {
  if (a.type !== "constructor" && a.type !== "operation") {
    return false;
  }
  if (a.type !== b.type) {
    return false;
  }
  // Note that |name| or |special| could be null/undefined, but even then
  // they have to be the same for both members.
  if (a.name !== b.name) {
    return false;
  }
  if (a.special !== b.special) {
    return false;
  }
  return true;
}

// Helper to test if two members define an operation with the same identifier,
// one of them being a static operation and the other a regular one. This is
// allowed in Web IDL, see https://github.com/whatwg/webidl/issues/1097
function isAllowedOperationWithSameIdentifier(a, b) {
  if (a.type !== "operation") {
    return false;
  }
  if (a.type !== b.type) {
    return false;
  }
  if (a.name !== b.name) {
    return false;
  }
  if (a.special !== "static" && b.special !== "static") {
    return false;
  }
  if (a.special === b.special) {
    return false;
  }
  return true;
}

function describeMember(member) {
  let desc = member.type;
  if (member.name) {
    desc += " " + member.name;
  }
  if (member.special) {
    desc = member.special + " " + desc;
  }
  return desc;
}


function studyWebIdl(edResults, curatedResults) {
  const report = [];              // List of anomalies to report
  const dfns = {};                // Index of IDL definitions (save includes)
  const includesStatements = {};  // Index of "includes" statements
  const globals = {};             // Index of globals defined in the IDL
  const objectTypes = {};         // Index of interface types
  const usedTypes = {};           // Index of types used in the IDL
  const usedExtAttrs = {};        // Index of extended attributes

  // Record an anomaly for the given spec(s).
  const recordAnomaly = recordCategorizedAnomaly(report, "webidl", possibleAnomalies);

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
        const idlTypes = listIdlTypes(value);
        for (const idlType of idlTypes) {
                if (!usedTypes[idlType]) {
                  usedTypes[idlType] = [];
                }
                usedTypes[idlType].push({ spec, idl: dfn });
        }
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

  function checkMembers(target, source) {
    source = source ?? target;
    const selfCheck = source === target;
    const knownDuplicates = [];
    if (!target.idl.members || !source.idl.members) {
      return;
    }
    for (const targetMember of target.idl.members) {
      if (!targetMember.name) {
        continue;
      }

      for (const sourceMember of source.idl.members) {
        if (!sourceMember.name) {
          continue;
        }
        if (targetMember === sourceMember) {
          // Self check and same member, skip
          continue;
        }
        if (targetMember.name !== sourceMember.name) {
          continue;
        }

        // Prepare anomaly parameters
        let targetName = dfnName(target);
        let sourceName = dfnName(source);
        const specs = [target.spec];
        if (sourceName === targetName) {
          // TODO: find a better way to disambiguate between both definitions
          sourceName = 'another ' + sourceName;
        }
        if (target.spec !== source.spec) {
          sourceName += ` (in ${specName(source.spec)})`;
          // Should we also blame the "source" spec if we report an anomaly?
          // We will if we're looking at two partial mixins or two partial
          // interface definitions, since there's no way to tell which of them
          // is supposed to pay attention to the other. We won't blame the
          // "source" spec otherwise
          if (target.idl.partial && source.idl.partial &&
              target.idl.type === source.idl.type) {
            targetName += ` (in ${specName(target.spec)})`;
            specs.push(source.spec);
          }
        }

        if (isOverloadedOperation(targetMember, sourceMember)) {
          if (!selfCheck) {
            recordAnomaly(specs, "overloaded", `"${describeMember(targetMember)}" in ${targetName} overloads an operation defined in ${sourceName}`);
          }
          break;
        }

        // A static operation that has the same identifier as a regular one is OK
        if (isAllowedOperationWithSameIdentifier(targetMember, sourceMember)) {
          continue;
        }

        if (!knownDuplicates.includes(targetMember.name)) {
          if (selfCheck) {
            recordAnomaly(specs, "redefinedMember", `"${targetMember.name}" in ${targetName} is defined more than once`);
          }
          else {
            recordAnomaly(specs, "redefinedMember", `"${targetMember.name}" in ${targetName} duplicates a member defined in ${sourceName}`);
          }
        }
        // No need to report the same redefined member twice
        knownDuplicates.push(targetMember.name);
        break;
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
        // Use fallback from curated version if available
        // This avoids reporting errors e.g. of not-really unknown interfaces
        try {
          const ast = WebIDL2.parse(curatedResults.find(s => s.url === spec.url).idl);
          return { spec, ast };
        } catch (e) {
          return { spec };
        }
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
      mainDef = dfns[name][0].idl;
    }

    // If Web IDL adds new kinds of definitions, we will very likely need to
    // adjust our logic. Let's not pretend that we understand new kinds
    const knownDfnKinds = new Set([
      "callback interface",
      "callback",
      "dictionary",
      "enum",
      "interface",
      "interface mixin",
      "namespace",
      "typedef"
    ]);
    if (!knownDfnKinds.has(mainDef.type)) {
      throw new Error(`Unknown definition kind "${mainDef.type}" in parsed Web IDL: ${JSON.stringify(mainDef)}`);
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

    const statement = statements[0];
    includesStatements[key] = statement;

    // Check target exists and is an interface
    const target = dfns[statement.idl.target];
    if (!target) {
      recordAnomaly(statement.spec, "unknownType", `Target "${statement.idl.target}" in includes statement "${key}" is not defined anywhere`);
    }
    // In theory, target is defined only once, but IDL may redefine it by
    // mistake (already reported as an anomaly, no need to report it again).
    // Let's just make sure that there is an "interface" definition.
    else if (!target.find(({idl}) => idl.type === "interface")) {
      recordAnomaly(statement.spec, "wrongKind", `Target "${statement.idl.target}" in includes statement "${key}" must be of kind "interface"`);
    }

    // Check mixin exists and is an interface mixin
    const mixin = dfns[statement.idl.includes];
    if (!mixin) {
      recordAnomaly(statement.spec, "unknownType", `Mixin "${statement.idl.includes}" in includes statement "${key}" is not defined anywhere`);
    }
    // In theory, mixin is defined only once, but IDL may redefine it by
    // mistake (already reported as an anomaly, no need to report it again).
    // let's just make sure that there is an "interface mixin" definition.
    else if (!mixin.find(({idl}) => idl.type === "interface mixin")) {
      recordAnomaly(statement.spec, "wrongKind", `Mixin "${statement.idl.includes}" in includes statement "${key}" must be of kind "interface mixin"`);
    }
  }

  // Report unknown used types
  for (const name in usedTypes) {
    if (!basicTypes.has(name) && !dfns[name]) {
      for (const { spec, idl } of usedTypes[name]) {
        recordAnomaly(spec, "unknownType", `Unknown type "${name}" used in definition of "${idl.name}"`);
      }
    }
    else if (dfns[name]) {
      // Namespaces and interface mixins "do not create types".
      const types = dfns[name].map(({idl}) => idl.type);
      if (types.every(type => type === "namespace")) {
        for (const { spec, idl } of usedTypes[name]) {
          recordAnomaly(spec, "wrongType", `Namespace "${name}" cannot be used as a type in definition of "${idl.name}"`);
        }
      }
      else if (types.every(type => type === "interface mixin")) {
        for (const { spec, idl } of usedTypes[name]) {
          recordAnomaly(spec, "wrongType", `Interface mixin "${name}" cannot be used as a type in definition of "${idl.name}"`);
        }
      }
      else if (types.every(type => type === "namespace" || type === "interface mixin")) {
        for (const { spec, idl } of usedTypes[name]) {
          recordAnomaly(spec, "wrongType", `Name "${name}" exists but is not a type and cannot be used in definition of "${idl.name}"`);
        }
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

  // Check duplicate/overloaded type members across partial and mixins
  // Note: When the IDL is correct, there is only one non-partial dfn per type
  // defined in the IDL. In practice, there may be re-definitions, which have
  // already been reported as anomalies. Here we'll consider that all
  // non-partial dfns are correct and we'll handle them separately.
  for (const name in dfns) {
    const mainDfns = dfns[name].filter(({idl}) => !idl.partial);
    for (const mainDfn of mainDfns) {
      // Check duplicate members within the main dfn itself
      checkMembers(mainDfn);

      // Find all the partials and mixins, including partial mixins, that apply
      // to the main dfn (note mixins are only for "interface" dfns)
      const partials = dfns[name].filter((({idl}) => idl.partial && idl.type === mainDfn.idl.type));
      const mixins = mainDfn.idl.type !== "interface" ? [] :
        Object.keys(includesStatements)
          .filter(key => key.startsWith(`${name} includes `))
          .map(key => dfns[includesStatements[key].idl.includes]?.filter(({idl}) => idl.type === 'interface mixin'))
          .filter(mixins => mixins?.length > 0)
          .flat();
      // Compare members of partials, mixins and main dfn separately to be able
      // to report more fine-grained anomalies
      for (const partial of partials) {
        // Check that the partial dfn itself does not define duplicate members
        checkMembers(partial);

        // Check partial members against the main dfn
        checkMembers(partial, mainDfn);

        // Check partial members against partials before it
        for (const otherPartial of partials) {
          if (otherPartial === partial) {
            break;
          }
          checkMembers(partial, otherPartial);
        }
      }

      // Note we don't need to compare mixins and partial mixins with other
      // mixins and partial mixins because the loop already takes care of that
      // when it goes through the mixin dfn as a main dfn.
      // Also note that, in case of a duplicated member, we're going to blame
      // the main (or partial) dfn, and not the mixin (or partial mixin), on
      // the grounds that an interface decides to include a mixin, and not the
      // other way round.
      for (const mixin of mixins) {
        // Check mixin members against the main dfn
        checkMembers(mainDfn, mixin);

        // Check mixin members against partials
        for (const partial of partials) {
          checkMembers(partial, mixin);
        }
      }
    }
  }

  return report;
}

/**************************************************
Export methods for use as module
**************************************************/
module.exports = { studyWebIdl };
