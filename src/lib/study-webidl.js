const { expandCrawlResult } = require("reffy");
const fetch = require("node-fetch");
const WebIDL2 = require("webidl2");

const report = {};

// DRY with study-backref
function recordAnomaly(spec, anomalyType, error) {
  if (!report[spec.url]) {
    report[spec.url] = {
      title: spec.title,
      crawled: spec.crawled,
      shortname: spec.shortname,
      repo: spec.nightly.repository,
      // specific to this report
      invalidWebIdl: [],
      idlNameReused: [],
      noMainIdlDefinition: [],
      noIdlExposure: [],
      incompatiblePartialIdlExposure: [],
      duplicateIdlDefinition: [],
      unexpectedEventHandler: [],
      singleEnumValue: [],
      wrongCaseEnumValue: []
    };
  }
  report[spec.url][anomalyType].push(error);
}

const platformIdl = {};
const globals = {};

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
    recordAnomaly(spec, "unexpectedEventHandler", `${iface.name} has an event handler ${eventHandler.name} but does not inherit from EventTarget`);
  }
}

function getExposure(iface) {
  let exposure = iface.extAttrs.find(ea => ea.name === "Exposed")?.rhs;
  if (!exposure) return [];
  if (exposure?.type === "*") {
    exposure = Object.keys(globals);
  } else {
    if (exposure?.type === "identifier-list") {
      exposure = exposure.value.map(({value}) => value);
    } else if (exposure?.type === "identifier") {
      exposure = [exposure.value];
    }
    // Expand encompassing globals to facilitate comparison
    let additionalExposures = [];
    for (let value of exposure) {
      if (globals[value].subrealms.length) {
	additionalExposures = additionalExposures.concat(globals[value].subrealms);
      }
    }
    // remove duplicate values
    exposure = [...new Set(exposure.concat(additionalExposures))];
  }
  return exposure;
}

function checkExposure(spec, iface, mainInterface) {
  const mainExposure = getExposure(mainInterface);
  if (iface.partial) {
    // check exposure of partial is compatible with main
    const partialExposure = getExposure(iface);
    if (!mainExposure && partialExposure) {
      recordAnomaly(spec, "incompatiblePartialIdlExposure", `partial interface ${iface.name} exposure (${partialExposure}) is incompatible with main exposure (${mainExposure})`);
    } else if (partialExposure && mainExposure[0] !== "*" && partialExposure.some(x => !mainExposure.includes(x))) {
      // FIXME: some exposure (e.g. Worker) encompasses other (e.g. DedicatedWorker), so this test is wrong
      recordAnomaly(spec, "incompatiblePartialIdlExposure", `partial interface ${iface.name} exposure (${partialExposure}) is incompatible with main exposure (${mainExposure})`);
    }
  } else {
    // check an exposure is defined and matches a well-known scope
    if (!mainExposure) {
      recordAnomaly(spec, "noIdlExposure", `Interface ${mainInterface.name} has no [Exposed] extended attribute`);
    }
  }
}

function checkEnumMultipleValues(spec, idl) {
  if (idl.values.length <= 1) {
    recordAnomaly(spec, "singleEnumValue", `The ${idl.name} enum has fewer than 2 possible values`);
  }
}

function checkSyntaxOfEnumValue(spec, idl) {
  idl.values.forEach(({value}) => {
    if (value.match(/[A-Z]_/)) {
      recordAnomaly(spec, "wrongCaseEnumValue", `The value ${value} of  ${idl.name} enum does not match the expected conventions (lower case, hyphen separated words)`);
    }
  });
}


const specName = ({spec}) => spec.shortname;

async function studyWebIdl(edResults) {
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
      recordAnomaly(spec, "invalidWebIdl", e.message);
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
      recordAnomaly(platformIdl[name][0].spec, "idlNameReused", `${name} is used as the IDL for different types: ${[...types].join(', ')} in ${specNames.join(', ')}`);
      continue;
    }
    const type = [...types][0];
    let mainDef;
    const allowPartials = ["interface", "dictionary", "namespace", "interface mixin"];
    const allowMultipleDefs = allowPartials.concat("includes");
    if (!allowMultipleDefs.includes(type)) {
      if (platformIdl[name].length > 1) {
	recordAnomaly(platformIdl[name][0].spec, "duplicateIdlDefinition", `${name} is defined as ${type} in several specifications ${specNames.join(', ')}`);
      } else {
	mainDef = platformIdl[name][0].idl;
      }
    }
    if (allowPartials.includes(type)) {
      const mainDefs = platformIdl[name].filter(({idl}) => !idl.partial);
      if (mainDefs.length === 0) {
	recordAnomaly(platformIdl[name][0].spec, "noMainIdlDefinition", `${name} is only defined as partial ${type} (in specifications ${platformIdl[name].map(specName).join(', ')})`);
	continue;
      } else if (mainDefs.length > 1) {
	recordAnomaly(platformIdl[name][0].spec, "duplicateIdlDefinition", `${name} is defined as non-partial ${type} in several specifications ${mainDefs.map(specName).join(', ')}`);
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
