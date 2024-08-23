import { JSDOM } from 'jsdom';

/**
 * Normalize whitespaces in string to make analysis easier
 */
function normalize(str) {
  return str.replace(/\r|\n/g, ' ').replace(/\s+/g, ' ').trim();
}


/**
 * Return normalized prose from the given HTML string
 */
function normalizeHTML(html) {
  const frag = JSDOM.fragment(html);
  return normalize(frag.textContent);
}

/**
 * Recursively look for algorithm steps that ask user agents to run remaining
 * steps at the same algorithm level in parallel, and nest these remaining
 * steps under them to ease processing afterwards.
 */
function nestParallelSteps(algo) {
  if (algo.steps) {
    for (let i = 0; i < algo.steps.length; i++) {
      const step = algo.steps[i];
      if (!step.html) {
        continue;
      }
      if (step.steps) {
        continue;
      }
      const prose = normalizeHTML(step.html);
      if (prose.match(/(run|perform) the remaining steps in parallel/i) ||
          prose.match(/continue running these steps in parallel/i) ||
          prose.match(/assert: this( algorithm)? is running in parallel/i) ||
          prose.match(/assert: these steps are running in parallel/i)) {
        step.steps = algo.steps.splice(i + 1);
        break;
      }
    }
    for (const step of algo.steps) {
      nestParallelSteps(step);
    }
  }
}


/**
 * Main function, study all algorithms
 */
function studyAlgorithms(specs) {
  const report = [];

  // Return human-friendly markdown that identifies the given algorithm
  function getAlgoName(algo) {
    if (algo.name && algo.href) {
      return `The [${algo.name}](${algo.href}) algorithm`;
    }
    else if (algo.href) {
      return `The [algorithm](${algo.href})`;
    }
    else if (algo.name) {
      return `The ${algo.name} algorithm`;
    }
    else if (algo.html) {
      return `The algorithm that starts with "${normalizeHTML(algo.html)}"`;
    }
    else {
      return 'An algorithm';
    }
  }

  // Recursively find an anomaly in a step that runs in parallel
  function findAnomalyInParallelStep(spec, algo, step) {
    if (step.html) {
      const html = normalize(step.html);
      if (html.match(/queu(e|ing) an?( \w+){0,2} (micro)?task/i)) {
        return false;
      }
      if (html.match(/(^|>| )(resolve|reject)(<| )/i) &&
          // Push API checks on the status of promises:
          // https://w3c.github.io/push-api/#receiving-a-push-message
          !html.match(/(wait for|if) all( of)? the promises/i) &&
          // Clipboard APIs uses "resolve" to mean something else:
          // https://w3c.github.io/clipboard-apis/#dom-clipboard-read
          !html.includes('systemClipboardRepresentation')
      ) {
        report.push({
          name: 'missingTask',
          message: `${getAlgoName(algo)} resolves/rejects a promise directly in a step that runs in parallel`,
          spec
        });
        return true;
      }
      else if (html.match(/fire an?( \w+)? event/i)) {
        report.push({
          name: 'missingTask',
          message: `${getAlgoName(algo)} fires an event directly in a step that runs in parallel`,
          spec
        });
        return true;
      }
    }
    let anomalyFound = false;
    if (step.steps) {
      anomalyFound = step.steps.find(substep => findAnomalyInParallelStep(spec, algo, substep));
    }
    return !!anomalyFound;
  }

  // Study an algorithm step
  function studyAlgorithmStep(spec, algo, step) {
    let anomalyFound = false;
    if (step.html) {
      const html = normalize(step.html);
      if (html.match(/in parallel/i) &&
          // Prerendering Revamped uses "in parallel" as an anchor for
          // monkeypatching:
          // https://wicg.github.io/nav-speculation/prerendering.html#patch-orientation-lock
          !html.match(/before it goes <[^>]+>in parallel<\/a>/i)
      ) {
        anomalyFound = findAnomalyInParallelStep(spec, algo, step);
        if (!anomalyFound) {
          anomalyFound = !!step.steps?.find(substep => findAnomalyInParallelStep(spec, algo, substep));
        }
      }
    }
    if (!anomalyFound) {
      anomalyFound = step.steps?.find(substep => studyAlgorithmStep(spec, algo, substep));
    }
    return anomalyFound;
  }

  // Study algorithms in turn.
  // Note: the root level of each algorithm is its first step. It may say
  // something like "run these steps in parallel" in particular.
  for (const spec of specs.filter(spec => !!spec.algorithms)) {
    for (const algo of spec.algorithms) {
      nestParallelSteps(algo);
      studyAlgorithmStep(spec, algo, algo);
    }
  }

  return report;
}


/**************************************************
Export methods for use as module
**************************************************/
export default studyAlgorithms;