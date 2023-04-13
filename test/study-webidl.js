/**
 * Tests the Web IDL analysis library.
 */

const assert = require('assert').strict;
const _ = require('lodash');
const { studyWebIdl } = require('../src/lib/study-webidl');

describe('The Web IDL analyser', async () => {
  const specUrl = 'https://www.w3.org/TR/spec';
  const specUrl2 = 'https://www.w3.org/TR/spec2';

  function toCrawlResult(idl, url) {
    url = url ?? specUrl;
    return [ { url, idl } ];
  }

  async function analyzeIdl(idl) {
    const crawlResult = toCrawlResult(idl);
    return studyWebIdl(crawlResult);
  }

  function assertEqual(report, ...params) {
    if (typeof params[0] === 'number') {
      const idx = params[0];
      const path = params[1] ?? '';
      const value = params[2];
      const actual = _.get(report[idx], path);
      assert.deepEqual(actual, value,
        `Expected "${value}" but got "${actual}" while looking at "${path}" in anomaly at index ${idx}. Full anomaly received:\n` +
        JSON.stringify(report[idx], null, 2));
    }
    else {
      const path = params[0] ?? '';
      const value = params[1];
      const actual = _.get(report, path);
      assert.deepEqual(actual, value,
        `Expected "${value}" but got "${actual}" while checking report's ${path}. Full report received:\n` +
        JSON.stringify(report, null, 2));
    }
  }

  it('reports no anomaly if IDL is valid', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Valid {};
`);
    assertEqual(report, []);
  });


  it('reports invalid IDL', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Invalid;
`);
    assertEqual(report, 'length', 1);
    assertEqual(report, 0, 'name', 'invalid');
    assertEqual(report, 0, 'message', `Syntax error at line 3, since \`interface Invalid\`:
interface Invalid;
                 ^ Bodyless interface`);
    assertEqual(report, 0, 'category', 'webidl');
    assertEqual(report, 0, 'specs.length', 1);
    assertEqual(report, 0, 'specs[0].url', specUrl);
  });

  it('reports invalid IDL and uses fallback from curated', async () => {
    const crawlResult = toCrawlResult(`
[Global=Window,Exposed=*]
interface Invalid;
`).concat(toCrawlResult(`
[Global=Window,Exposed=*]
interface Valid: Invalid {};
`, specUrl2));
    const curatedResult = toCrawlResult(`
[Global=Window,Exposed=*]
interface Invalid{};
`);
    const report = await studyWebIdl(crawlResult, curatedResult);
    assertEqual(report.length, 1);
    assertEqual(report, 0, 'name', 'invalid');
  });


  it('forgets about previous results', async () => {
    await analyzeIdl(`
[Global=Window,Exposed=*]
interface Invalid;
`);
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Valid {};
`);
    assertEqual(report, []);
  });


  it('detects missing [Exposed] extended attributes', async () => {
    const report = await analyzeIdl(`
interface Unexposed {};
`);
    assertEqual(report, 'length', 1);
    assertEqual(report, 0, 'name', 'noExposure');
    assertEqual(report, 0, 'message', 'The interface "Unexposed" has no [Exposed] extended attribute');
  });


  it('detects unknown [Exposed] extended attributes', async () => {
    const report = await analyzeIdl(`
[Exposed=Unknown]
interface WhereIAm {};
`);
    assertEqual(report, 'length', 1);
    assertEqual(report, 0, 'name', 'unknownExposure');
    assertEqual(report, 0, 'message', 'The [Exposed] extended attribute of the interface "WhereIAm" references unknown global(s): Unknown');
  });

  it('reports no anomaly for valid EventHandler attributes definitions', async () => {
    const report = await analyzeIdl(`
[Exposed=*]
interface Event {};
[LegacyTreatNonObjectAsNull]
callback EventHandlerNonNull = any (Event event);
typedef EventHandlerNonNull? EventHandler;

[Global=Window,Exposed=*]
interface Carlos : EventTarget {
  attribute EventHandler onbigbisous;
};
[Exposed=*]
interface EventTarget {};
`);
    assertEqual(report, []);
  });


  it('detects unexpected EventHandler attributes', async () => {
    const report = await analyzeIdl(`
[Exposed=*]
interface Event {};
[LegacyTreatNonObjectAsNull]
callback EventHandlerNonNull = any (Event event);
typedef EventHandlerNonNull? EventHandler;

[Global=Window,Exposed=*]
interface Carlos {
  attribute EventHandler onbigbisous;
};
`);
    assertEqual(report, 'length', 1);
    assertEqual(report, 0, 'name', 'unexpectedEventHandler');
    assertEqual(report, 0, 'message', 'The interface "Carlos" defines an event handler "onbigbisous" but does not inherit from EventTarget');
  });


  it('detects incompatible partial exposure issues', async () => {
    const report = await analyzeIdl(`
[Global=Somewhere,Exposed=*]
interface Somewhere {};

[Global=Elsewhere,Exposed=Elsewhere]
interface Elsewhere {};

[Exposed=Somewhere]
interface MyPlace {};

// This is correct since Somewhere is exposed everywhere
[Exposed=Elsewhere]
partial interface Somewhere {};

// This is incorrect since MyPlace is only Somewhere
[Exposed=Elsewhere]
partial interface MyPlace {};
`);
    assertEqual(report.length, 1);
    assertEqual(report, 0, 'name', 'incompatiblePartialIdlExposure');
    assertEqual(report, 0, 'message', 'The [Exposed] extended attribute of the partial interface "MyPlace" references globals on which the original interface is not exposed: Elsewhere (original exposure: Somewhere)');
  });


  it('detects incompatible partial exposure issues when "*" is used', async () => {
    const report = await analyzeIdl(`
[Global=Somewhere,Exposed=Somewhere]
interface Somewhere {};

// This is incorrect because Somewhere is only exposed Somewhere and there
// may well be other globals that we're not aware of
[Exposed=*]
partial interface Somewhere {};
`);
    assertEqual(report.length, 1);
    assertEqual(report, 0, 'name', 'incompatiblePartialIdlExposure');
    assertEqual(report, 0, 'message', 'The partial interface "Somewhere" is exposed on all globals but the original interface is not (Somewhere)');
  });


  it('detects IDL names that are redefined across specs', async () => {
    const crawlResult = toCrawlResult(`
dictionary GrandBob {
  required boolean complete;
};
`).concat(toCrawlResult(`
dictionary GrandBob {
  required boolean incomplete;
};
`, specUrl2));
    const report = await studyWebIdl(crawlResult);

    assertEqual(report.length, 1);
    assertEqual(report, 0, 'name', 'redefined');
    assertEqual(report, 0, 'message', `"GrandBob" is defined as a non-partial dictionary mutiple times in ${specUrl}, ${specUrl2}`);
    assertEqual(report, 0, 'specs.length', 2);
    assertEqual(report, 0, 'specs[0].url', specUrl);
    assertEqual(report, 0, 'specs[1].url', specUrl2);
  });


  it('detects IDL names that are redefined with different types across specs', async () => {
    const crawlResult = toCrawlResult(
`dictionary GrandBob {
  required boolean complete;
};`).concat(toCrawlResult(
`enum GrandBob {
  "complete",
  "incomplete"
};`, specUrl2));
    const report = await studyWebIdl(crawlResult);

    assertEqual(report.length, 1);
    assertEqual(report, 0, 'name', 'redefinedWithDifferentTypes');
    assertEqual(report, 0, 'message', `"GrandBob" is defined multiple times with different types (dictionary, enum) in ${specUrl}, ${specUrl2}`);
    assertEqual(report, 0, 'specs.length', 2);
    assertEqual(report, 0, 'specs[0].url', specUrl);
    assertEqual(report, 0, 'specs[1].url', specUrl2);
  });


  it('detects the lack of original definition for partials', async () => {
    const report = await analyzeIdl(`
partial interface MyPlace {};
`);
    assertEqual(report.length, 1);
    assertEqual(report, 0, 'name', 'noOriginalDefinition');
    assertEqual(report, 0, 'message', `"MyPlace" is only defined as a partial interface (in ${specUrl})`);
  });


  it('alerts about single enum values', async () => {
    const report = await analyzeIdl(`
enum SingleValue {
  "single"
};
`);
    assertEqual(report.length, 1);
    assertEqual(report, 0, 'name', 'singleEnumValue');
    assertEqual(report, 0, 'message', `The enum "SingleValue" has fewer than 2 possible values`);
  });


  it('alerts when enum values do not follow casing conventions', async () => {
    const report = await analyzeIdl(`
enum WrongCase {
  "good",
  "NotGood",
  "very-good",
  "not_good"
};
`);
    assertEqual(report.length, 2);
    assertEqual(report, 0, 'name', 'wrongCaseEnumValue');
    assertEqual(report, 0, 'message', `The value "NotGood" of the enum "WrongCase" does not match the expected conventions (lower case, hyphen separated words)`);
    assertEqual(report, 1, 'name', 'wrongCaseEnumValue');
    assertEqual(report, 1, 'message', `The value "not_good" of the enum "WrongCase" does not match the expected conventions (lower case, hyphen separated words)`);
  });


  it('alerts on redefined includes statements', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*] interface MyHome {};
interface mixin MyRoom {};
interface mixin MyLivingRoom {};

MyHome includes MyRoom;
MyHome includes MyLivingRoom;
MyHome includes MyRoom;
`);
    assertEqual(report.length, 1);
    assertEqual(report, 0, 'name', 'redefinedIncludes');
    assertEqual(report, 0, 'message', `The includes statement "MyHome includes MyRoom" is defined more than once in ${specUrl}`);
  });


  it('checks existence of target and mixin in includes statements', async () => {
    const report = await analyzeIdl(`
MyHome includes MyRoom;
`);
    assertEqual(report.length, 2);
    assertEqual(report, 0, 'name', 'unknownType');
    assertEqual(report, 0, 'message', `Target "MyHome" in includes statement "MyHome includes MyRoom" is not defined anywhere`);
    assertEqual(report, 1, 'name', 'unknownType');
    assertEqual(report, 1, 'message', `Mixin "MyRoom" in includes statement "MyHome includes MyRoom" is not defined anywhere`);
  });

  it('checks kinds of target and mixin in includes statements', async () => {
    const report = await analyzeIdl(`
dictionary MyHome { required boolean door; };
[Global=Home,Exposed=*] interface MyRoom {};

MyHome includes MyRoom;
`);
    assertEqual(report.length, 2);
    assertEqual(report, 0, 'name', 'wrongKind');
    assertEqual(report, 0, 'message', `Target "MyHome" in includes statement "MyHome includes MyRoom" must be of kind "interface"`);
    assertEqual(report, 1, 'name', 'wrongKind');
    assertEqual(report, 1, 'message', `Mixin "MyRoom" in includes statement "MyHome includes MyRoom" must be of kind "interface mixin"`);
  });


  it('checks inheritance', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*] interface MyHome {};
[Exposed=*] interface MyPalace : MyHome {};
[Exposed=*] interface MyLivingRoom : MyRoom {};
dictionary MyShelf : MyHome { required boolean full; };
`);
    assertEqual(report.length, 2);
    assertEqual(report, 0, 'name', 'unknownType');
    assertEqual(report, 0, 'message', `"MyLivingRoom" inherits from "MyRoom" which is not defined anywhere`);
    assertEqual(report, 1, 'name', 'wrongKind');
    assertEqual(report, 1, 'message', `"MyShelf" is of kind "dictionary" but inherits from "MyHome" which is of kind "interface"`);
  });


  it('reports unknown types', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*] interface MyHome {};
[Exposed=*] interface MyRoom {
  attribute bool boolDoesNotExist;
  attribute MyBed bed;
  undefined doSomething(USVString name, MyUnknownType thing);
  attribute (DOMString or sequence<UnknownInnerType>) table;
};
`);
    assertEqual(report.length, 4);
    assertEqual(report, 0, 'name', 'unknownType');
    assertEqual(report, 0, 'message', `Unknown type "bool" used in definition of "MyRoom"`);
    assertEqual(report, 1, 'name', 'unknownType');
    assertEqual(report, 1, 'message', `Unknown type "MyBed" used in definition of "MyRoom"`);
    assertEqual(report, 2, 'name', 'unknownType');
    assertEqual(report, 2, 'message', `Unknown type "MyUnknownType" used in definition of "MyRoom"`);
    assertEqual(report, 3, 'name', 'unknownType');
    assertEqual(report, 3, 'message', `Unknown type "UnknownInnerType" used in definition of "MyRoom"`);
  });


  it('reports wrong types', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*] interface MyHome {
  attribute MyNamespace space;
  attribute MyLivingRoom room;
  attribute MyNamespaceMixin basement;
};
namespace MyNamespace {};
interface mixin MyLivingRoom {};

namespace MyNamespaceMixin {};
interface mixin MyNamespaceMixin {};
`);
    assertEqual(report.length, 4);
    assertEqual(report, 0, 'name', 'redefinedWithDifferentTypes');
    assertEqual(report, 0, 'message', `"MyNamespaceMixin" is defined multiple times with different types (namespace, interface mixin) in ${specUrl}`);
    assertEqual(report, 1, 'name', 'wrongType');
    assertEqual(report, 1, 'message', `Namespace "MyNamespace" cannot be used as a type in definition of "MyHome"`);
    assertEqual(report, 2, 'name', 'wrongType');
    assertEqual(report, 2, 'message', `Interface mixin "MyLivingRoom" cannot be used as a type in definition of "MyHome"`);
    assertEqual(report, 3, 'name', 'wrongType');
    assertEqual(report, 3, 'message', `Name "MyNamespaceMixin" exists but is not a type and cannot be used in definition of "MyHome"`);
  });


  it('reports unknown extended attributes', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*] interface MyHome {};
[Exposed=*,UnknownExtAttr] interface MyRoom {};
[Exposed=*] interface MyLivingRoom {
  [SuperUnknownExtAttr]
  attribute boolean hasTV;
};
[Exposed=*] interface MyBedRoom {
  [SuperUnknownExtAttr]
  attribute boolean hasTVToo;
};
`);
    assertEqual(report.length, 3);
    assertEqual(report, 0, 'name', 'unknownExtAttr');
    assertEqual(report, 0, 'message', `Unknown extended attribute "UnknownExtAttr" used in definition of "MyRoom"`);
    assertEqual(report, 1, 'name', 'unknownExtAttr');
    assertEqual(report, 1, 'message', `Unknown extended attribute "SuperUnknownExtAttr" used in definition of "MyLivingRoom"`);
    assertEqual(report, 2, 'name', 'unknownExtAttr');
    assertEqual(report, 2, 'message', `Unknown extended attribute "SuperUnknownExtAttr" used in definition of "MyBedRoom"`);
  });


  it('reports overloads across definitions (partial, same spec)', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*]
interface MyHome {
  undefined overload();
  undefined overload(DOMString thing);
};

partial interface MyHome {
  undefined overload(DOMString thing, boolean asap);
};

[Exposed=*]
interface MyPartialHome {};

partial interface MyPartialHome {
  Promise<DOMString> overload();
};

partial interface MyPartialHome {
  Promise<DOMString> overload(DOMString thing);
};
`);
    assertEqual(report.length, 2);
    assertEqual(report, 0, 'name', 'overloaded');
    assertEqual(report, 0, 'message', '"operation overload" in partial interface "MyHome" overloads an operation defined in interface "MyHome"');
    assertEqual(report, 1, 'name', 'overloaded');
    assertEqual(report, 1, 'message', '"operation overload" in partial interface "MyPartialHome" overloads an operation defined in another partial interface "MyPartialHome"');
  });


  it('reports overloads across definitions (partial, different specs)', async () => {
     const crawlResult = toCrawlResult(`
[Global=Home,Exposed=*]
interface MyHome {
  undefined overload();
  undefined overload(DOMString thing);
};

[Exposed=*]
interface MyPartialHome {};

partial interface MyPartialHome {
  Promise<DOMString> overload();
};
`).concat(toCrawlResult(`
partial interface MyHome {
  undefined overload(DOMString thing, boolean asap);
};

partial interface MyPartialHome {
  Promise<DOMString> overload(DOMString thing);
};
`, specUrl2));
    const report = await studyWebIdl(crawlResult);

    assertEqual(report.length, 2);
    assertEqual(report, 0, 'name', 'overloaded');
    assertEqual(report, 0, 'message', `"operation overload" in partial interface "MyHome" overloads an operation defined in interface "MyHome" (in ${specUrl})`);
    assertEqual(report, 0, 'specs.length', 1);
    assertEqual(report, 0, 'specs[0].url', specUrl2);

    // No way to know which spec to blame for MyPartialHome overloads, both
    // should be reported
    assertEqual(report, 1, 'name', 'overloaded');
    assertEqual(report, 1, 'message', `"operation overload" in partial interface "MyPartialHome" (in ${specUrl2}) overloads an operation defined in another partial interface "MyPartialHome" (in ${specUrl})`);
    assertEqual(report, 1, 'specs.length', 2);
    assertEqual(report, 1, 'specs[0].url', specUrl2);
    assertEqual(report, 1, 'specs[1].url', specUrl);
  });


  it('reports overloads across definitions (mixin, same spec)', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*]
interface MyHome {
  undefined overload();
};
MyHome includes MyRoom;

interface mixin MyRoom {
  undefined overload(DOMString thing);
};

interface mixin MyPartialRoom {
  Promise<DOMString> overload();
};

partial interface mixin MyPartialRoom {
  Promise<DOMString> overload(DOMString thing);
};
`);
    assertEqual(report.length, 2);
    assertEqual(report, 0, 'name', 'overloaded');
    assertEqual(report, 0, 'message', '"operation overload" in interface "MyHome" overloads an operation defined in interface mixin "MyRoom"');
    assertEqual(report, 1, 'name', 'overloaded');
    assertEqual(report, 1, 'message', '"operation overload" in partial interface mixin "MyPartialRoom" overloads an operation defined in interface mixin "MyPartialRoom"');
  });


  it('reports overloads across definitions (mixin, different specs)', async () => {
     const crawlResult = toCrawlResult(`
[Global=Home,Exposed=*]
interface MyHome {
  undefined overload();
};
MyHome includes MyRoom;

interface mixin MyPartialRoom {
  Promise<DOMString> overload();
};

partial interface mixin MyPartialRoom {
  Promise<DOMString> overload(DOMString thing);
};
`).concat(toCrawlResult(`
interface mixin MyRoom {
  undefined overload(DOMString thing);
};

partial interface mixin MyPartialRoom {
  Promise<DOMString> overload(DOMString thing, boolean asap);
};
`, specUrl2));
    const report = await studyWebIdl(crawlResult);

    assertEqual(report.length, 4);
    assertEqual(report, 0, 'name', 'overloaded');
    assertEqual(report, 0, 'message', `"operation overload" in interface "MyHome" overloads an operation defined in interface mixin "MyRoom" (in ${specUrl2})`);
    assertEqual(report, 0, 'specs.length', 1);
    assertEqual(report, 0, 'specs[0].url', specUrl);

    assertEqual(report, 1, 'name', 'overloaded');
    assertEqual(report, 1, 'message', '"operation overload" in partial interface mixin "MyPartialRoom" overloads an operation defined in interface mixin "MyPartialRoom"');
    assertEqual(report, 1, 'specs.length', 1);
    assertEqual(report, 1, 'specs[0].url', specUrl);

    assertEqual(report, 2, 'name', 'overloaded');
    assertEqual(report, 2, 'message', `"operation overload" in partial interface mixin "MyPartialRoom" overloads an operation defined in interface mixin "MyPartialRoom" (in ${specUrl})`);
    assertEqual(report, 2, 'specs.length', 1);
    assertEqual(report, 2, 'specs[0].url', specUrl2);

    assertEqual(report, 3, 'name', 'overloaded');
    assertEqual(report, 3, 'message', `"operation overload" in partial interface mixin "MyPartialRoom" (in ${specUrl2}) overloads an operation defined in another partial interface mixin "MyPartialRoom" (in ${specUrl})`);
    assertEqual(report, 3, 'specs.length', 2);
    assertEqual(report, 3, 'specs[0].url', specUrl2);
    assertEqual(report, 3, 'specs[1].url', specUrl);
  });


  it('reports overloads across definitions (partial and mixin, same spec)', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*]
interface MyHome {
  undefined overload();
};
MyHome includes MyRoom;

partial interface MyHome {
  undefined overload(DOMString thing);
};

interface mixin MyRoom {
  undefined overload(DOMString thing);
};

partial interface mixin MyRoom {
  undefined overload(DOMString thing, boolean asap);
};
`);
    assertEqual(report.length, 6);
    assertEqual(report, 0, 'name', 'overloaded');
    assertEqual(report, 0, 'message', '"operation overload" in partial interface "MyHome" overloads an operation defined in interface "MyHome"');
    assertEqual(report, 1, 'name', 'overloaded');
    assertEqual(report, 1, 'message', '"operation overload" in interface "MyHome" overloads an operation defined in interface mixin "MyRoom"');
    assertEqual(report, 2, 'name', 'overloaded');
    assertEqual(report, 2, 'message', '"operation overload" in partial interface "MyHome" overloads an operation defined in interface mixin "MyRoom"');
    assertEqual(report, 3, 'name', 'overloaded');
    assertEqual(report, 3, 'message', '"operation overload" in interface "MyHome" overloads an operation defined in partial interface mixin "MyRoom"');
    assertEqual(report, 4, 'name', 'overloaded');
    assertEqual(report, 4, 'message', '"operation overload" in partial interface "MyHome" overloads an operation defined in partial interface mixin "MyRoom"');
    assertEqual(report, 5, 'name', 'overloaded');
    assertEqual(report, 5, 'message', '"operation overload" in partial interface mixin "MyRoom" overloads an operation defined in interface mixin "MyRoom"');
  });


  it('reports overloads across definitions (partial and mixin, different specs)', async () => {
    const crawlResult = toCrawlResult(`
[Global=Home,Exposed=*]
interface MyHome {
  undefined overload();
};
MyHome includes MyRoom;

partial interface MyHome {
  undefined overload(DOMString thing);
};
`).concat(toCrawlResult(`
interface mixin MyRoom {
  undefined overload(DOMString thing);
};

partial interface mixin MyRoom {
  undefined overload(DOMString thing, boolean asap);
};
`, specUrl2));
    const report = await studyWebIdl(crawlResult);

    assertEqual(report.length, 6);
    assertEqual(report, 0, 'name', 'overloaded');
    assertEqual(report, 0, 'message', '"operation overload" in partial interface "MyHome" overloads an operation defined in interface "MyHome"');
    assertEqual(report, 0, 'specs.length', 1);
    assertEqual(report, 0, 'specs[0].url', specUrl);

    assertEqual(report, 1, 'name', 'overloaded');
    assertEqual(report, 1, 'message', `"operation overload" in interface "MyHome" overloads an operation defined in interface mixin "MyRoom" (in ${specUrl2})`);
    assertEqual(report, 1, 'specs.length', 1);
    assertEqual(report, 1, 'specs[0].url', specUrl);

    assertEqual(report, 2, 'name', 'overloaded');
    assertEqual(report, 2, 'message', `"operation overload" in partial interface "MyHome" overloads an operation defined in interface mixin "MyRoom" (in ${specUrl2})`);
    assertEqual(report, 2, 'specs.length', 1);
    assertEqual(report, 2, 'specs[0].url', specUrl);

    assertEqual(report, 3, 'name', 'overloaded');
    assertEqual(report, 3, 'message', `"operation overload" in interface "MyHome" overloads an operation defined in partial interface mixin "MyRoom" (in ${specUrl2})`);
    assertEqual(report, 3, 'specs.length', 1);
    assertEqual(report, 3, 'specs[0].url', specUrl);

    assertEqual(report, 4, 'name', 'overloaded');
    assertEqual(report, 4, 'message', `"operation overload" in partial interface "MyHome" overloads an operation defined in partial interface mixin "MyRoom" (in ${specUrl2})`);
    assertEqual(report, 4, 'specs.length', 1);
    assertEqual(report, 4, 'specs[0].url', specUrl);

    assertEqual(report, 5, 'name', 'overloaded');
    assertEqual(report, 5, 'message', '"operation overload" in partial interface mixin "MyRoom" overloads an operation defined in interface mixin "MyRoom"');
    assertEqual(report, 5, 'specs.length', 1);
    assertEqual(report, 5, 'specs[0].url', specUrl2);
  });


  it('reports redefined members (same spec)', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*]
interface MyHome {
  undefined overload();
  attribute boolean overload;
};
MyHome includes MyRoom;

partial interface MyHome {
  attribute DOMString overload;
};

interface mixin MyRoom {
  attribute unsigned long overload;
};
`);
    assertEqual(report.length, 4);
    assertEqual(report, 0, 'name', 'redefinedMember');
    assertEqual(report, 0, 'message', '"overload" in interface "MyHome" is defined more than once');
    assertEqual(report, 1, 'name', 'redefinedMember');
    assertEqual(report, 1, 'message', '"overload" in partial interface "MyHome" duplicates a member defined in interface "MyHome"');
    assertEqual(report, 2, 'name', 'redefinedMember');
    assertEqual(report, 2, 'message', '"overload" in interface "MyHome" duplicates a member defined in interface mixin "MyRoom"');
    assertEqual(report, 3, 'name', 'redefinedMember');
    assertEqual(report, 3, 'message', '"overload" in partial interface "MyHome" duplicates a member defined in interface mixin "MyRoom"');
  });


  it('reports redefined members (different specs)', async () => {
    const crawlResult = toCrawlResult(`
[Global=Home,Exposed=*]
interface MyHome {
  undefined overload();
};
MyHome includes MyRoom;
`).concat(toCrawlResult(`
partial interface MyHome {
  attribute DOMString overload;
};

interface mixin MyRoom {
  attribute unsigned long overload;
};
`, specUrl2));
    const report = await studyWebIdl(crawlResult);

    assertEqual(report, 'length', 3);
    assertEqual(report, 0, 'name', 'redefinedMember');
    assertEqual(report, 0, 'message', `"overload" in partial interface "MyHome" duplicates a member defined in interface "MyHome" (in ${specUrl})`);
    assertEqual(report, 0, 'specs.length', 1);
    assertEqual(report, 0, 'specs[0].url', specUrl2);

    assertEqual(report, 1, 'name', 'redefinedMember');
    assertEqual(report, 1, 'message', `"overload" in interface "MyHome" duplicates a member defined in interface mixin "MyRoom" (in ${specUrl2})`);
    assertEqual(report, 1, 'specs.length', 1);
    assertEqual(report, 1, 'specs[0].url', specUrl);

    assertEqual(report, 2, 'name', 'redefinedMember');
    assertEqual(report, 2, 'message', '"overload" in partial interface "MyHome" duplicates a member defined in interface mixin "MyRoom"');
    assertEqual(report, 2, 'specs.length', 1);
    assertEqual(report, 2, 'specs[0].url', specUrl2);
  });
});
