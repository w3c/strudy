/**
 * Tests the Web IDL analysis library.
 */

const assert = require('assert').strict;
const { studyWebIdl } = require('../src/lib/study-webidl');

describe('The Web IDL analyser', async () => {
  const specUrl = 'https://www.w3.org/TR/spec';
  const specUrl2 = 'https://www.w3.org/TR/spec2';

  function toCrawlResult(idl, idlSpec2) {
    const crawlResult = [ { url: specUrl, idl } ];
    if (idlSpec2) {
      crawlResult.push({ url: specUrl2, idl: idlSpec2 });
    }
    return crawlResult;
  }

  function analyzeIdl(idl, idlSpec2) {
    const crawlResult = toCrawlResult(idl, idlSpec2);
    return studyWebIdl(crawlResult);
  }

  function assertNbAnomalies(report, length) {
    assert.deepEqual(report.length, length,
      `Expected ${length} anomalies but got ${report.length}. Full report received:\n` +
      JSON.stringify(report, null, 2));
  }

  function assertAnomaly(report, idx, value) {
    const msg = `Mismatch for anomaly at index ${idx}. Full anomaly received:\n` +
      JSON.stringify(report[idx], null, 2);
    function assertMatch(actual, expected) {
      if (Array.isArray(expected)) {
        assert(Array.isArray(actual), msg);
        assert.deepEqual(actual.length, expected.length, msg);
        for (let i=0; i<expected.length; i++) {
          assertMatch(actual[i], expected[i]);
        }
      }
      else if (typeof expected === 'object') {
        for (const prop in expected) {
          assertMatch(actual[prop], expected[prop]);
        }
      }
      else {
        assert.deepEqual(actual, expected, msg);
      }
    }
    assertMatch(report[idx], value);
  }


  it('reports no anomaly if IDL is valid', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Valid {};
`);
    assertNbAnomalies(report, 0);
  });


  it('reports invalid IDL', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Invalid;
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      category: 'webidl',
      name: 'invalid',
      message: `Syntax error at line 3, since \`interface Invalid\`:
interface Invalid;
                 ^ Bodyless interface`,
      specs: [ { url: specUrl }]
    });
  });

  it('reports invalid IDL and uses fallback from curated', async () => {
    const crawlResult = toCrawlResult(`
// IDL in first spec
[Global=Window,Exposed=*]
interface Invalid;
`, `
// IDL in second spec
[Global=Window,Exposed=*]
interface Valid: Invalid {};
`);
    const curatedResult = toCrawlResult(`
[Global=Window,Exposed=*]
interface Invalid{};
`);
    const report = await studyWebIdl(crawlResult, curatedResult);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, { name: 'invalid' });
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
    assertNbAnomalies(report, 0);
  });


  it('detects missing [Exposed] extended attributes', async () => {
    const report = await analyzeIdl(`
interface Unexposed {};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'noExposure',
      message: 'The interface "Unexposed" has no [Exposed] extended attribute'
    });
  });


  it('detects unknown [Exposed] extended attributes', async () => {
    const report = await analyzeIdl(`
[Exposed=Unknown]
interface WhereIAm {};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'unknownExposure',
      message: 'The [Exposed] extended attribute of the interface "WhereIAm" references unknown global(s): Unknown'
    });
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
    assertNbAnomalies(report, 0);
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
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'unexpectedEventHandler',
      message: 'The interface "Carlos" defines an event handler "onbigbisous" but does not inherit from EventTarget'
    });
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
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'incompatiblePartialIdlExposure',
      message: 'The [Exposed] extended attribute of the partial interface "MyPlace" references globals on which the original interface is not exposed: Elsewhere (original exposure: Somewhere)'
    });
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
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'incompatiblePartialIdlExposure',
      message: 'The partial interface "Somewhere" is exposed on all globals but the original interface is not (Somewhere)'
    });
  });


  it('detects IDL names that are redefined across specs', async () => {
    const report = await analyzeIdl(`
// IDL in first spec
dictionary GrandBob {
  required boolean complete;
};
`, `
// IDL in second spec
dictionary GrandBob {
  required boolean incomplete;
};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'redefined',
      message: `"GrandBob" is defined as a non-partial dictionary mutiple times in ${specUrl}, ${specUrl2}`,
      specs: [ { url: specUrl }, { url: specUrl2 }]
    });
  });


  it('detects IDL names that are redefined with different types across specs', async () => {
    const report = await analyzeIdl(`
// IDL in first spec
dictionary GrandBob {
  required boolean complete;
};`, `
// IDL in second spec
enum GrandBob {
  "complete",
  "incomplete"
};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'redefinedWithDifferentTypes',
      message: `"GrandBob" is defined multiple times with different types (dictionary, enum) in ${specUrl}, ${specUrl2}`,
      specs: [ { url: specUrl }, { url: specUrl2 }]
    });
  });


  it('detects the lack of original definition for partials', async () => {
    const report = await analyzeIdl(`
partial interface MyPlace {};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'noOriginalDefinition',
      message: `"MyPlace" is only defined as a partial interface (in ${specUrl})`
    });
  });


  it('alerts about single enum values', async () => {
    const report = await analyzeIdl(`
enum SingleValue {
  "single"
};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'singleEnumValue',
      message: `The enum "SingleValue" has fewer than 2 possible values`
    });
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
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'wrongCaseEnumValue',
      message: `The value "NotGood" of the enum "WrongCase" does not match the expected conventions (lower case, hyphen separated words)`
    });
    assertAnomaly(report, 1, {
      name: 'wrongCaseEnumValue',
      message: `The value "not_good" of the enum "WrongCase" does not match the expected conventions (lower case, hyphen separated words)`
    });
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
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'redefinedIncludes',
      message: `The includes statement "MyHome includes MyRoom" is defined more than once in ${specUrl}`
    });
  });


  it('checks existence of target and mixin in includes statements', async () => {
    const report = await analyzeIdl(`
MyHome includes MyRoom;
`);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'unknownType',
      message: `Target "MyHome" in includes statement "MyHome includes MyRoom" is not defined anywhere`
    });
    assertAnomaly(report, 1, {
      name: 'unknownType',
      message: `Mixin "MyRoom" in includes statement "MyHome includes MyRoom" is not defined anywhere`
    });
  });

  it('checks kinds of target and mixin in includes statements', async () => {
    const report = await analyzeIdl(`
dictionary MyHome { required boolean door; };
[Global=Home,Exposed=*] interface MyRoom {};

MyHome includes MyRoom;
`);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'wrongKind',
      message: `Target "MyHome" in includes statement "MyHome includes MyRoom" must be of kind "interface"`
    });
    assertAnomaly(report, 1, {
      name: 'wrongKind',
      message: `Mixin "MyRoom" in includes statement "MyHome includes MyRoom" must be of kind "interface mixin"`
    });
  });


  it('checks inheritance', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*] interface MyHome {};
[Exposed=*] interface MyPalace : MyHome {};
[Exposed=*] interface MyLivingRoom : MyRoom {};
dictionary MyShelf : MyHome { required boolean full; };
`);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'unknownType',
      message: `"MyLivingRoom" inherits from "MyRoom" which is not defined anywhere`
    });
    assertAnomaly(report, 1, {
      name: 'wrongKind',
      message: `"MyShelf" is of kind "dictionary" but inherits from "MyHome" which is of kind "interface"`
    });
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
    assertNbAnomalies(report, 4);
    assertAnomaly(report, 0, {
      name: 'unknownType',
      message: `Unknown type "bool" used in definition of "MyRoom"`
    });
    assertAnomaly(report, 1, {
      name: 'unknownType',
      message: `Unknown type "MyBed" used in definition of "MyRoom"`
    });
    assertAnomaly(report, 2, {
      name: 'unknownType',
      message: `Unknown type "MyUnknownType" used in definition of "MyRoom"`
    });
    assertAnomaly(report, 3, {
      name: 'unknownType',
      message: `Unknown type "UnknownInnerType" used in definition of "MyRoom"`
    });
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
    assertNbAnomalies(report, 4);
    assertAnomaly(report, 0, {
      name: 'redefinedWithDifferentTypes',
      message: `"MyNamespaceMixin" is defined multiple times with different types (namespace, interface mixin) in ${specUrl}`
    });
    assertAnomaly(report, 1, {
      name: 'wrongType',
      message: `Namespace "MyNamespace" cannot be used as a type in definition of "MyHome"`
    });
    assertAnomaly(report, 2, {
      name: 'wrongType',
      message: `Interface mixin "MyLivingRoom" cannot be used as a type in definition of "MyHome"`
    });
    assertAnomaly(report, 3, {
      name: 'wrongType',
      message: `Name "MyNamespaceMixin" exists but is not a type and cannot be used in definition of "MyHome"`
    });
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
    assertNbAnomalies(report, 3);
    assertAnomaly(report, 0, {
      name: 'unknownExtAttr',
      message: `Unknown extended attribute "UnknownExtAttr" used in definition of "MyRoom"`
    });
    assertAnomaly(report, 1, {
      name: 'unknownExtAttr',
      message: `Unknown extended attribute "SuperUnknownExtAttr" used in definition of "MyLivingRoom"`
    });
    assertAnomaly(report, 2, {
      name: 'unknownExtAttr',
      message: `Unknown extended attribute "SuperUnknownExtAttr" used in definition of "MyBedRoom"`
    });
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
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
    name: 'overloaded',
    message: '"operation overload" in partial interface "MyHome" overloads an operation defined in interface "MyHome"'
  });
    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: '"operation overload" in partial interface "MyPartialHome" overloads an operation defined in another partial interface "MyPartialHome"'
    });
  });


  it('reports overloads across definitions (partial, different specs)', async () => {
     const report = await analyzeIdl(`
// IDL in first spec
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
`, `
// IDL in second spec
partial interface MyHome {
  undefined overload(DOMString thing, boolean asap);
};

partial interface MyPartialHome {
  Promise<DOMString> overload(DOMString thing);
};
`);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'overloaded',
      message: `"operation overload" in partial interface "MyHome" overloads an operation defined in interface "MyHome" (in ${specUrl})`,
      specs: [ { url: specUrl2 }]
    });

    // No way to know which spec to blame for MyPartialHome overloads, both
    // should be reported
    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: `"operation overload" in partial interface "MyPartialHome" (in ${specUrl2}) overloads an operation defined in another partial interface "MyPartialHome" (in ${specUrl})`,
      specs: [ { url: specUrl2 }, { url: specUrl }]
    });
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
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
    name: 'overloaded',
    message: '"operation overload" in interface "MyHome" overloads an operation defined in interface mixin "MyRoom"'
  });
    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: '"operation overload" in partial interface mixin "MyPartialRoom" overloads an operation defined in interface mixin "MyPartialRoom"'
    });
  });


  it('reports overloads across definitions (mixin, different specs)', async () => {
     const report = await analyzeIdl(`
// IDL in first spec
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
`, `
// IDL in second spec
interface mixin MyRoom {
  undefined overload(DOMString thing);
};

partial interface mixin MyPartialRoom {
  Promise<DOMString> overload(DOMString thing, boolean asap);
};
`);
    assertNbAnomalies(report, 4);
    assertAnomaly(report, 0, {
      name: 'overloaded',
      message: `"operation overload" in interface "MyHome" overloads an operation defined in interface mixin "MyRoom" (in ${specUrl2})`,
      specs: [ { url: specUrl }]
    });

    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: '"operation overload" in partial interface mixin "MyPartialRoom" overloads an operation defined in interface mixin "MyPartialRoom"',
      specs: [ { url: specUrl }]
    });

    assertAnomaly(report, 2, {
      name: 'overloaded',
      message: `"operation overload" in partial interface mixin "MyPartialRoom" overloads an operation defined in interface mixin "MyPartialRoom" (in ${specUrl})`,
      specs: [ { url: specUrl2 }]
    });

    assertAnomaly(report, 3, {
      name: 'overloaded',
      message: `"operation overload" in partial interface mixin "MyPartialRoom" (in ${specUrl2}) overloads an operation defined in another partial interface mixin "MyPartialRoom" (in ${specUrl})`,
      specs: [ { url: specUrl2 }, { url: specUrl }]
    });
  });


  it('reports overloads across definitions (partial and mixin, same spec)', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*]
interface MyHome {};
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
    assertNbAnomalies(report, 3);
    assertAnomaly(report, 0, {
    name: 'overloaded',
    message: '"operation overload" in partial interface "MyHome" overloads an operation defined in interface mixin "MyRoom"'
  });
    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: '"operation overload" in partial interface "MyHome" overloads an operation defined in partial interface mixin "MyRoom"'
    });
    assertAnomaly(report, 2, {
      name: 'overloaded',
      message: '"operation overload" in partial interface mixin "MyRoom" overloads an operation defined in interface mixin "MyRoom"'
    });
  });


  it('reports overloads across definitions (partial and mixin, different specs)', async () => {
    const report = await analyzeIdl(`
// IDL in first spec
[Global=Home,Exposed=*]
interface MyHome {};
MyHome includes MyRoom;

partial interface MyHome {
  undefined overload(DOMString thing);
};
`, `
// IDL in second spec
interface mixin MyRoom {
  undefined overload(DOMString thing);
};

partial interface mixin MyRoom {
  undefined overload(DOMString thing, boolean asap);
};
`);
    assertNbAnomalies(report, 3);
    assertAnomaly(report, 0, {
      name: 'overloaded',
      message: `"operation overload" in partial interface "MyHome" overloads an operation defined in interface mixin "MyRoom" (in ${specUrl2})`,
      specs: [ { url: specUrl }]
    });

    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: `"operation overload" in partial interface "MyHome" overloads an operation defined in partial interface mixin "MyRoom" (in ${specUrl2})`,
      specs: [ { url: specUrl }]
    });

    assertAnomaly(report, 2, {
      name: 'overloaded',
      message: '"operation overload" in partial interface mixin "MyRoom" overloads an operation defined in interface mixin "MyRoom"',
      specs: [ { url: specUrl2 }]
    });
  });


  it('reports redefined members (same spec)', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*]
interface MyHome {
  undefined dejaVu();
  attribute boolean dejaVu;
};
MyHome includes MyRoom;

partial interface MyHome {
  attribute DOMString dejaVu;
};

interface mixin MyRoom {
  attribute unsigned long dejaVu;
};
`);
    assertNbAnomalies(report, 4);
    assertAnomaly(report, 0, {
    name: 'redefinedMember',
    message: '"dejaVu" in interface "MyHome" is defined more than once'
  });
    assertAnomaly(report, 1, {
      name: 'redefinedMember',
      message: '"dejaVu" in partial interface "MyHome" duplicates a member defined in interface "MyHome"'
    });
    assertAnomaly(report, 2, {
      name: 'redefinedMember',
      message: '"dejaVu" in interface "MyHome" duplicates a member defined in interface mixin "MyRoom"'
    });
    assertAnomaly(report, 3, {
      name: 'redefinedMember',
      message: '"dejaVu" in partial interface "MyHome" duplicates a member defined in interface mixin "MyRoom"'
    });
  });


  it('reports redefined members (different specs)', async () => {
    const report = await analyzeIdl(`
// IDL in first spec
[Global=Home,Exposed=*]
interface MyHome {
  undefined dejaVu();
};
MyHome includes MyRoom;
`, `
// IDL in second spec
partial interface MyHome {
  attribute DOMString dejaVu;
};

interface mixin MyRoom {
  attribute unsigned long dejaVu;
};
`);
    assertNbAnomalies(report, 3);
    assertAnomaly(report, 0, {
      name: 'redefinedMember',
      message: `"dejaVu" in partial interface "MyHome" duplicates a member defined in interface "MyHome" (in ${specUrl})`,
      specs: [ { url: specUrl2 }]
    });

    assertAnomaly(report, 1, {
    name: 'redefinedMember',
    message: `"dejaVu" in interface "MyHome" duplicates a member defined in interface mixin "MyRoom" (in ${specUrl2})`,
    specs: [ { url: specUrl }]
  });

    assertAnomaly(report, 2, {
      name: 'redefinedMember',
      message: '"dejaVu" in partial interface "MyHome" duplicates a member defined in interface mixin "MyRoom"',
      specs: [ { url: specUrl2 }]
    });
  });
});
