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

const specName = ({spec}) => spec.shortname ?? spec.url;

const possibleAnomalies = [
  "invalid",
  "redefined",
  "redefinedWithDifferentTypes",
  "noExposure",
  "unknownExposure",
  "incompatiblePartialIdlExposure",
  "noOriginalDefinition",
  "unexpectedEventHandler",
  "singleEnumValue",
  "wrongCaseEnumValue"
];

async function studyWebIdl(edResults) {
  const report = [];
  const platformIdl = {};
  const globals = {};

  // Record an anomaly for the given spec(s).
  function recordAnomaly(specs, name, message) {
    if (!specs) {
      throw new Error(`Cannot record an anomaly without also recording an offending spec`);
    }
    specs = Array.isArray(specs) ? specs : [specs];
    if (!possibleAnomalies.includes(name)) {
      throw new Error(`Cannot record an anomaly with name "${name}"`);
    }
    report.push({ category: "webidl", name, message, specs });
  }

  function inheritsFrom(iface, ancestor) {
    if (!iface.inheritance) return false;
    if (iface.inheritance === ancestor) return true;
    const parentInterface = platformIdl[iface.inheritance].find(({idl}) => !idl.partial).idl;
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
      if (value.match(/[A-Z]_/)) {
        recordAnomaly(spec, "wrongCaseEnumValue", `The value "${value}" of the enum "${idl.name}" does not match the expected conventions (lower case, hyphen separated words)`);
      }
    });
  }

  edResults.forEach(spec => {
    if (!spec.idl) return;
    let ast;
    try {
      ast = WebIDL2.parse(spec.idl);
      for (let idlItem of ast) {
        if (!platformIdl[idlItem.name]) {
          platformIdl[idlItem.name] = [];
        }
        platformIdl[idlItem.name].push({spec, idl: idlItem});
        let globalEA;
        if (idlItem.type === "interface" && (globalEA = idlItem?.extAttrs?.find(ea => ea.name === "Global"))) {
          // mostly copied from webidlpedia - DRY?
          const globalValues = Array.isArray(globalEA.rhs.value) ? globalEA.rhs.value.map(({value}) => value) : [globalEA.rhs.value];
          for (const value of globalValues)  {
            // '*' is not a name
            if (value === '*') break;
            if (!globals[value]) {
              globals[value] = {components: []};
            }
            globals[value].components.push(idlItem.name);
          }
        }
      }
    } catch (e) {
      // TODO: load from curated?
      recordAnomaly(spec, "invalid", e.message);
      return;
    }
  });

  // mostly copied from webidlpedia - DRY?
  for (const global of Object.keys(globals)) {
    let subrealms = [];
    // If several interfaces use this name as a Global EA
    // it serves as a grouping of realms rather than as a realm definition
    if (globals[global].components.length > 1) {
      subrealms = Object.keys(globals).filter(g => globals[g].components.length === 1 && globals[global].components.includes(globals[g].components[0]));
    }
    globals[global].subrealms = subrealms;
  }

  for (const name in platformIdl) {
    const types = new Set(platformIdl[name].map(({idl}) => idl.type));
    const specNames = platformIdl[name].map(specName);
    if (types.size > 1) {
      recordAnomaly(platformIdl[name].map(({spec}) => spec), "redefinedWithDifferentTypes", `"${name}" is defined multiple times with different types (${[...types].join(', ')}) in ${specNames.join(', ')}`);
      continue;
    }
    const type = [...types][0];
    let mainDef;
    const allowPartials = ["interface", "dictionary", "namespace", "interface mixin"];
    const allowMultipleDefs = allowPartials.concat("includes");
    if (!allowMultipleDefs.includes(type)) {
      if (platformIdl[name].length > 1) {
        recordAnomaly(platformIdl[name].map(({spec}) => spec), "redefined", `"${name}" is defined multiple times (with type ${type}) in ${specNames.join(', ')}`);
      } else {
        mainDef = platformIdl[name][0].idl;
      }
    }
    if (allowPartials.includes(type)) {
      const mainDefs = platformIdl[name].filter(({idl}) => !idl.partial);
      if (mainDefs.length === 0) {
        recordAnomaly(platformIdl[name][0].spec, "noOriginalDefinition", `"${name}" is only defined as a partial ${type} (in ${platformIdl[name].map(specName).join(', ')})`);
        continue;
      } else if (mainDefs.length > 1) {
        recordAnomaly(platformIdl[name].map(({spec}) => spec), "redefined", `"${name}" is defined as a non-partial ${type} mutiple times in ${mainDefs.map(specName).join(', ')}`);
      }
      mainDef = mainDefs[0].idl;
    }
    for (let {spec, idl} of platformIdl[name]) {
      switch(idl.type) {
      case "interface":
        checkEventHandlers(spec, idl, mainDef);
        checkExposure(spec, idl, mainDef);
        break;
      case "enum":
        checkEnumMultipleValues(spec, idl);
        checkSyntaxOfEnumValue(spec, idl);
        break;
      }
    }
  }
  return report;
}

/**************************************************
Export methods for use as module
**************************************************/
module.exports = { studyWebIdl };
