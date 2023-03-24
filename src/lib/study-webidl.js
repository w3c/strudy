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
      duplicateIdlDefinition: [],
      unexpectedEventHandler: [],
      singleEnumValue: [],
      wrongCaseEnumValue: []
    };
  }
  report[spec.url][anomalyType].push(error);
}

const platformIdl = {};

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
      }
    } catch (e) {
      // TODO: load from curated?
      recordAnomaly(spec, "invalidWebIdl", e.message);
      return;
    }
  });
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
