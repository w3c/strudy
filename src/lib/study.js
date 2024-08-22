import studyDfns from './study-dfns.js';
import studyAlgorithms from './study-algorithms.js';
import studyBackrefs from './study-backrefs.js';
import studyRefs from './study-refs.js';
import studyWebIdl from './study-webidl.js';
import isInMultiSpecRepository from './is-in-multi-spec-repo.js';
import { recordCategorizedAnomaly } from './util.js';

/**
 * List of anomalies, grouped per study function
 */
const anomalyGroups = [
  {
    name: 'generic',
    title: 'Generic',
    description: 'The following errors prevented the spec from being analyzed',
    types: [
      {
        name: 'error',
        title: 'Crawl error',
        description: 'The following crawl errors occurred'
      }
    ],
    study: (specs) => specs
      .filter(spec => !!spec.error)
      .map(spec => Object.assign(
        { name: 'error', message: spec.error, spec }
      ))
  },

  {
    name: 'dfns',
    title: 'Problems with definitions',
    description: 'The following problems were identified in term definitions',
    types: [
      {
        name: 'missingDfns',
        title: 'Missing definitions',
        description: 'The following constructs were found without a definition'
      }
    ],
    study: studyDfns
  },

  {
    name: 'backrefs',
    title: 'Problems with links to other specs',
    description: 'The following problems were identified when analyzing links to other specifications',
    types: [
      {
        name: 'brokenLinks',
        title: 'Broken links',
        description: 'The following links to other specifications were detected as pointing to non-existing anchors'
      },
      {
        name: 'datedUrls',
        title: 'Links to dated TR URLs',
        description: 'The following links target a dated version of a specification'
      },
      {
        name: 'evolvingLinks',
        title: 'Links to now gone anchors',
        description: 'The following links in the specification link to anchors that no longer exist in the Editor\'s Draft of the targeted specification'
      },
      {
        name: 'frailLinks',
        title: 'Unstable link anchors',
        description: 'The following links in the specification link to anchors that either have a new name or are inherently brittle'
      },
      {
        name: 'nonCanonicalRefs',
        title: 'Non-canonical links',
        description: 'The following links were detected as pointing to outdated URLs'
      },
      {
        name: 'notDfn',
        title: 'Links to unofficial anchors',
        description: 'The following links were detected as pointing to anchors that are neither definitions or headings in the targeted specification'
      },
      {
        name: 'notExported',
        title: 'Links to non-exported definitions',
        description: 'The following links were detected as pointing to a private definition in the targeted specification'
      },
      {
        name: 'outdatedSpecs',
        title: 'Outdated references',
        description: 'The following links were detected as pointing to outdated specifications'
      },
      {
        name: 'unknownSpecs',
        title: 'Links to unknown specs',
        description: 'The following links were detected as pointing to documents that are not recognized as specifications'
      }
    ],
    study: studyBackrefs,
    studyParams: ['tr']
  },

  {
    name: 'algorithms',
    title: 'Problems with algorithms',
    description: 'The following problems were identified when analyzing algorithms',
    types: [
      {
        name: 'missingTaskForPromise',
        title: 'Missing tasks in parallel steps to handle a promise',
        description: 'The following algorithms resolve or reject a Promise within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task'
      },
      {
        name: 'missingTaskForEvent',
        title: 'Missing tasks in parallel steps to fire an event',
        description: 'The following algorithms fire an event within a step that runs [in parallel](https://html.spec.whatwg.org/multipage/infrastructure.html#in-parallel) without first queuing a task'
      }
    ],
    study: studyAlgorithms
  },

  {
    name: 'refs',
    title: 'Problems with references',
    description: 'The following problems were identified when analyzing the list of references',
    types: [
      {
        name: 'discontinuedReferences',
        title: 'Normative references to discontinued specs',
        description: 'The following normative references were detected as pointing to discontinued specifications'
      },
      {
        name: 'missingReferences',
        title: 'Missing references',
        description: 'The following links target specifications that are not mentioned in the list of references'
      },
      {
        name: 'inconsistentReferences',
        title: 'Inconsistent reference links',
        description: 'The following links use a different URL for the targeted specification from the URL defined in the references'
      }
    ],
    study: studyRefs
  },

  {
    name: 'webidl',
    title: 'Web IDL problems',
    description: 'The following Web IDL problems were identified',
    types: [
      { name: 'incompatiblePartialIdlExposure', title: 'Incompatible `[Exposed]` attribute in partial definitions' },
      { name: 'invalid', title: 'Invalid Web IDL' },
      { name: 'noExposure', title: 'Missing `[Exposed]` attributes' },
      { name: 'noOriginalDefinition', title: 'Missing base interfaces' },
      { name: 'overloaded', title: 'Invalid overloaded operations' },
      { name: 'redefined', title: 'Duplicated IDL names' },
      { name: 'redefinedIncludes', title: 'Duplicated `includes` statements' },
      { name: 'redefinedMember', title: 'Duplicated members' },
      { name: 'redefinedWithDifferentTypes', title: 'Duplicated IDL names with different types' },
      { name: 'singleEnumValue', title: 'Enums with a single value' },
      { name: 'unexpectedEventHandler', title: 'Missing `EventTarget` inheritances' },
      { name: 'unknownExposure', title: 'Unknown globals in `[Exposed]` attribute' },
      { name: 'unknownExtAttr', title: 'Unknown extended attributes' },
      { name: 'unknownType', title: 'Unknown Web IDL type' },
      { name: 'wrongCaseEnumValue', title: 'Enums with wrong casing' },
      { name: 'wrongKind', title: 'Invalid inheritance chains' },
      { name: 'wrongType', title: 'Web IDL names incorrectly used as types' }
    ],
    study: studyWebIdl,
    studyParams: ['curated']
  }
];


/**
 * Possible report structures.
 *
 * "/" separates levels in the hierarchy.
 * "+" combines creates a composed key at a given level.
 *
 * For example, "group+spec/type" means: first level per
 * anomaly group and spec (so one "web-animations-2-webidl" entry if the
 * spec "web-animations-2" has "webidl" issues), second level per type.
 *
 * The list is described in more details in the CLI help. Run:
 *   npx strudy inspect --help
 * ... or check the code in `strudy.js` at the root of the project.
 */
const reportStructures = [
  'flat',
  'type+spec',
  'group+spec',
  'group+spec/type',
  'spec/type',
  'spec/group/type',
  'type/spec',
  'group/type/spec',
  'group/spec/type'
];


// Compute mapping between an anomaly type and its parent group
const anomalyToGroup = {};
for (const group of anomalyGroups) {
  for (const type of group.types) {
    anomalyToGroup[type.name] = group;
  }
}

/**
 * Return an object that describes the requested anomaly type
 */
function getAnomalyType(name) {
  for (const group of anomalyGroups) {
    const type = group.types.find(t => t.name === name);
    if (type) {
      return Object.assign({}, type);
    }
  }
  return null;
}

/**
 * Return an object that describes the requested anomaly group
 */
function getAnomalyGroup(name) {
  for (const group of anomalyGroups) {
    if (group.name === name) {
      return {
        name: group.name,
        title: group.title 
      };
    }
  }
  return null;
}

/**
 * Return an object that describes the requested anomaly group
 * from the given anomaly type
 */
function getAnomalyGroupFromType(type) {
  const name = anomalyToGroup[type];
  return getAnomalyGroup(name);
}


/**
 * Structure a flat list of anomalies to the requested structure
 */
function structureResults(structure, anomalies, crawlResults) {
  const levels = structure.split('/')
    .map(level => level.replace(/\s+/g, ''));
  const report = [];

  switch (levels[0]) {
    case 'flat':
      for (const anomaly of anomalies) {
        report.push(anomaly);
      }
      break;

    case 'type+spec':
      for (const anomaly of anomalies) {
        const type = getAnomalyType(anomaly.name);
        for (const spec of anomaly.specs) {
          let entry = report.find(entry =>
            entry.type.name === anomaly.name &&
            entry.spec.shortname === spec.shortname);
          if (!entry) {
            const titlePrefix = isInMultiSpecRepository(spec, crawlResults) ?
              `[${spec.shortname}] ` : '';
            entry = {
              name: `${spec.shortname}-${type.name.toLowerCase()}`,
              title: `${titlePrefix}${type.title} in ${spec.title}`,
              type, spec, anomalies: []
            };
            report.push(entry);
          }
          entry.anomalies.push(anomaly);
        }
      }
      break;

    case 'group+spec':
      for (const anomaly of anomalies) {
        const group = anomalyToGroup[anomaly.name];
        for (const spec of anomaly.specs) {
          let entry = report.find(entry =>
            entry.group.name === group.name &&
            entry.spec.shortname === spec.shortname);
          if (!entry) {
            const titlePrefix = isInMultiSpecRepository(spec, crawlResults) ?
              `[${spec.shortname}] ` : '';
            entry = {
              name: `${spec.shortname}-${group.name.toLowerCase()}`,
              title: `${titlePrefix}${group.title} in ${spec.title}`,
              group, spec, anomalies: []
            };
            report.push(entry);
          }
          entry.anomalies.push(anomaly);
        }
      }
      break;

    case 'spec':
      for (const anomaly of anomalies) {
        for (const spec of anomaly.specs) {
          let entry = report.find(entry =>
            entry.spec.shortname === spec.shortname);
          if (!entry) {
            entry = {
              name: spec.shortname,
              title: spec.title,
              spec, anomalies: []
            };
            report.push(entry);
          }
          entry.anomalies.push(anomaly);
        }
      }
      break;

    case 'type':
      for (const anomaly of anomalies) {
        const type = getAnomalyType(anomaly.name);
        let entry = report.find(entry => entry.type.name === anomaly.name);
        if (!entry) {
          entry = {
            name: type.name.toLowerCase(),
            title: type.title,
            type, anomalies: []
          };
          report.push(entry);
        }
        entry.anomalies.push(anomaly);
      }
      break;

    case 'group':
      for (const anomaly of anomalies) {
        const group = anomalyToGroup[anomaly.name];
        let entry = report.find(entry => entry.group.name === group.name);
        if (!entry) {
          entry = {
            name: group.name.toLowerCase(),
            title: group.title,
            group, anomalies: []
          };
          report.push(entry);
        }
        entry.anomalies.push(anomaly);
      }
      break;
  }

  if (levels.length > 1) {
    const itemsStructure = levels.slice(1).join('/');
    for (const entry of report) {
      entry.items = structureResults(itemsStructure, entry.anomalies, crawlResults);
      delete entry.anomalies;
    }
  }
  return report;
}


function makeLowerCase(description) {
  return description.charAt(0).toLowerCase() + description.slice(1);
}

function pad(str, depth) {
  while (depth > 1) {
    str = '  ' + str;
    depth -= 1;
  }
  return str;
}

function serializeEntry(entry, format, depth = 0) {
  let res;
  if (format === 'json') {
    res = Object.assign({}, entry);
    if (entry.spec) {
      res.spec = {
        url: entry.spec.url,
        shortname: entry.spec.shortname,
        title: entry.spec.title
      };
    }
    if (entry.specs) {
      res.specs = entry.specs.map(spec => Object.assign({
        url: spec.url,
        shortname: spec.shortname,
        title: spec.title
      }));
    }
    if (entry.items) {
      res.items = entry.items.map(item => serializeEntry(item, format, depth + 1));
    }
    if (entry.anomalies) {
      res.anomalies = entry.anomalies.map(anomaly => serializeEntry(anomaly, format, depth + 1));
    }
  }
  else if (format === 'markdown') {
    res = '';
    if (entry.spec && entry.group) {
      res = `While crawling [${entry.spec.title}](${entry.spec.crawled}), ${makeLowerCase(entry.group.description ?? entry.group.title)}:`;
    }
    else if (entry.spec && entry.type) {
      res = `While crawling [${entry.spec.title}](${entry.spec.crawled}), ${makeLowerCase(entry.type.description ?? entry.type.title)}:`;
    }
    else if (entry.group) {
      if (depth === 0) {
        res = (entry.group.description ?? entry.group.title) + ':';
      }
      else {
        res = pad(`* ${entry.group.title}`, depth);
      }
    }
    else if (entry.type) {
      if (depth === 0) {
        res = (entry.type.description ?? entry.type.title) + ':';
      }
      else {
        res = pad(`* ${entry.type.title}`, depth);
      }
    }
    else if (entry.spec) {
      if (depth === 0) {
        res = `While crawling [${entry.spec.title}](${entry.spec.crawled}), the following anomalies were identified:`;
      }
      else {
        res = pad(`* [${entry.spec.title}](${entry.spec.crawled})`, depth);
      }
    }
    else if (entry.message) {
      res = pad(`* [ ] ${entry.message}`, depth);
    }

    for (const item of entry.items ?? []) {
      res += '\n' + serializeEntry(item, format, depth + 1);
    }
    for (const anomaly of entry.anomalies ?? []) {
      res += `\n` + serializeEntry(anomaly, format, depth + 1);
    }
  }
  return res;
}


/**
 * Format the structured report as JSON or markdown, or a combination of both
 */
function formatReport(format, report) {
  if (format === 'json') {
    // We'll return the report as is, trimming the information about specs to
    // a reasonable minimum (the rest of the information can easily be
    // retrieved from the crawl result if needed)
    return report.map(entry => serializeEntry(entry, 'json'));
  }
  else if (format === 'issue') {
    return report.map(entry => Object.assign({
      name: entry.name,
      title: entry.title,
      spec: entry.spec,
      content: serializeEntry(entry, 'markdown')
    }));
  }
  else if (format === 'full') {
    return [
      {
        title: 'Study report',
        content: report.map(entry =>
`## ${entry.title}
${serializeEntry(entry, 'markdown')}`)
      }
    ]
  }
}


/**
 * The report includes a set of anomalies. It can also be useful to know
 * what things looked fine, in other words what other anomalies could have
 * been reported in theory. This can typically be used to identify issue files
 * created in the past and that now need to be deleted.
 *
 * Note: Some anomalies may hide others. For example, a WebIDL update can make
 * the Web IDL invalid... and hide other WebIDL issues that may still exist in
 * the spec. This function may return false negatives as a result.
 */
function getNamesOfNonReportedEntries(report, specs, what, structure) {
  const groups = [];
  anomalyGroups.filter(group =>
    what.includes('all') ||
    what.includes(group.name) ||
    group.types.find(type => what.includes(type.name)));
  const types = [];
  for (const group of anomalyGroups) {
    if (what.includes('all') ||
        what.includes(group.name) ||
        group.types.find(type => what.includes(type.name))) {
      groups.push(group);
      for (const type of group.types) {
        if (what.includes('all') ||
            what.includes(group.name) ||
            what.includes(type)) {
          types.push(type);
        }
      }
    }
  }

  const levels = structure.split('/')
    .map(level => level.replace(/\s+/g, ''));
  let allNames;
  switch (levels[0]) {
    case 'flat':
      // Not much we can say there
      break;
    case 'type+spec':
      allNames = specs
        .map(spec => types.map(type => `${spec.shortname}-${type.name.toLowerCase()}`))
        .flat();
      break;
    case 'group+spec':
      allNames = specs
        .map(spec => groups.map(group => `${spec.shortname}-${group.name.toLowerCase()}`))
        .flat();
      break;
    case 'spec':
      allNames = specs.map(spec => spec.shortname);
      break;
    case 'type':
      allNames = types.map(type => type.name);
      break;
    case 'group':
      allNames = groups.map(group => group.name);
      break;
  }
  return allNames.filter(name => !report.find(entry => entry.name === name));
}


/**
 * Main function that studies a crawl result and returns a structured
 * report.
 */
export default async function study(specs, options = {}) {
  // Copy the options object (we're going to add options on our own
  // before calling other study methods)
  options = Object.assign({}, options);

  const what = options.what ?? ['all'];
  const structure = options.structure ?? 'type + spec';
  const format = options.format ?? 'issue';

  if (!what.includes('all')) {
    const validWhat = what.every(name =>
      anomalyGroups.find(g => g.name === name || g.types.find(t => t.name === name)));
    if (!validWhat) {
      throw new Error('Invalid `what` option');
    }
  }
  if (!reportStructures.find(s => structure.replace(/\s+/g, '') === s)) {
    throw new Error('Invalid `structure` option');
  }

  // Only keep specs that caller wants to study
  // (but note study functions that analyze references need the whole list!)
  options.crawlResults = specs;
  if (options.specs) {
    specs = options.crawlResults.filter(spec => options.specs.find(shortname => shortname === spec.shortname));
  }

  // Anomalies are studied in groups of related anomalies, let's compute the
  // studies that we need to run to answer the request
  const groups = anomalyGroups.filter(group =>
    what.includes('all') ||
    what.includes(group.name) ||
    group.types.find(type => what.includes(type.name)));

  // Run studies and fill the anomaly report accordingly
  let anomalies = [];
  for (const group of groups) {
    const studyResult = await group.study(specs, options);
    const recordAnomaly = recordCategorizedAnomaly(
      anomalies, group.name, group.types.map(t => t.name));
    studyResult.map(an => recordAnomaly(an.spec ?? an.specs, an.name, an.message));
  }

  // Only keep anomalies whose types we're interested in
  anomalies = anomalies.filter(anomaly =>
    what.includes('all') ||
    what.includes(anomaly.name) ||
    what.includes(anomalyToGroup[anomaly.name].name));

  // Now that we have a flat report of anomalies,
  // let's structure and serialize it as requested
  const report = structureResults(structure, anomalies, options.crawlResults);

  // And serialize it using the right format
  const result = {
    type: 'study',
    date: (new Date()).toJSON(),
    structure,
    what,
    stats: {
      crawled: options.crawlResults.length,
      studied: specs.length,
      anomalies: anomalies.length
    },
    results: formatReport(format, report),
    looksGood: getNamesOfNonReportedEntries(report, specs, what, structure)
  };

  // Return the structured report
  return result;
}