/**
 * Return true if the given spec is maintained in a GitHub repository shared
 * with other specs.
 *
 * The function takes as input a list of crawled specs, typically the list
 * of specs in the `index.json` file of a crawled report. That list contains
 * data from browser-specs about the specs, allowing the function to answer
 * the request.
 */
export default function (spec, specs) {
  if (!spec.nightly?.repository) {
    return false;
  }
  return !!specs.find(s =>
    s.nightly?.repository === spec.nightly.repository &&
    s.series.shortname !== spec.series.shortname);
}