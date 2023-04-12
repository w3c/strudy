/**
 * Tests the Web IDL analysis library.
 */

const assert = require('assert').strict;
const { studyWebIdl } = require('../src/lib/study-webidl');

describe('The Web IDL analyser', async _ => {
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


  it('reports no anomaly if IDL is valid', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Valid {};
`);
    assert.deepEqual(report, []);
  });


  it('reports invalid IDL', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Invalid;
`);
    assert.deepEqual(report[0]?.name, 'invalid');
    assert.deepEqual(report[0].message, `Syntax error at line 3, since \`interface Invalid\`:
interface Invalid;
                 ^ Bodyless interface`);
    assert.deepEqual(report[0].category, 'webidl');
    assert.deepEqual(report[0].specs?.length, 1);
    assert.deepEqual(report[0].specs[0].url, specUrl);
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
    assert.deepEqual(report.length, 1);
    assert.deepEqual(report[0]?.name, 'invalid');
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
    assert.deepEqual(report, []);
  });


  it('detects missing [Exposed] extended attributes', async () => {
    const report = await analyzeIdl(`
interface Unexposed {};
`);
    assert.deepEqual(report[0]?.name, 'noExposure');
    assert.deepEqual(report[0].message, 'The interface "Unexposed" has no [Exposed] extended attribute');
  });


  it('detects unknown [Exposed] extended attributes', async () => {
    const report = await analyzeIdl(`
[Exposed=Unknown]
interface WhereIAm {};
`);
    assert.deepEqual(report[0]?.name, 'unknownExposure');
    assert.deepEqual(report[0].message, 'The [Exposed] extended attribute of the interface "WhereIAm" references unknown global(s): Unknown');
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
    assert.deepEqual(report, []);
  });


  it('detects unexpected EventHandler attributes', async () => {
    const report = await analyzeIdl(`
[Global=Window,Exposed=*]
interface Carlos {
  attribute EventHandler onbigbisous;
};
`);
    assert.deepEqual(report[0]?.name, 'unexpectedEventHandler');
    assert.deepEqual(report[0].message, 'The interface "Carlos" defines an event handler "onbigbisous" but does not inherit from EventTarget');
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
    assert.deepEqual(report[0]?.name, 'incompatiblePartialIdlExposure');
    assert.deepEqual(report[0].message, 'The [Exposed] extended attribute of the partial interface "MyPlace" references globals on which the original interface is not exposed: Elsewhere (original exposure: Somewhere)');
    assert.deepEqual(report.length, 1);
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
    assert.deepEqual(report[0]?.name, 'incompatiblePartialIdlExposure');
    assert.deepEqual(report[0].message, 'The partial interface "Somewhere" is exposed on all globals but the original interface is not (Somewhere)');
    assert.deepEqual(report.length, 1);
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

    assert.deepEqual(report[0]?.name, 'redefined');
    assert.deepEqual(report[0].message, `"GrandBob" is defined as a non-partial dictionary mutiple times in ${specUrl}, ${specUrl2}`);
    assert.deepEqual(report[0].specs?.length, 2);
    assert.deepEqual(report[0].specs[0].url, specUrl);
    assert.deepEqual(report[0].specs[1].url, specUrl2);
    assert.deepEqual(report.length, 1);
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

    assert.deepEqual(report[0]?.name, 'redefinedWithDifferentTypes');
    assert.deepEqual(report[0].message, `"GrandBob" is defined multiple times with different types (dictionary, enum) in ${specUrl}, ${specUrl2}`);
    assert.deepEqual(report[0].specs?.length, 2);
    assert.deepEqual(report[0].specs[0].url, specUrl);
    assert.deepEqual(report[0].specs[1].url, specUrl2);
    assert.deepEqual(report.length, 1);
  });


  it('detects the lack of original definition for partials', async () => {
    const report = await analyzeIdl(`
partial interface MyPlace {};
`);
    assert.deepEqual(report[0]?.name, 'noOriginalDefinition');
    assert.deepEqual(report[0].message, `"MyPlace" is only defined as a partial interface (in ${specUrl})`);
    assert.deepEqual(report.length, 1);
  });


  it('alerts about single enum values', async () => {
    const report = await analyzeIdl(`
enum SingleValue {
  "single"
};
`);
    assert.deepEqual(report[0]?.name, 'singleEnumValue');
    assert.deepEqual(report[0].message, `The enum "SingleValue" has fewer than 2 possible values`);
    assert.deepEqual(report.length, 1);
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
    assert.deepEqual(report[0]?.name, 'wrongCaseEnumValue');
    assert.deepEqual(report[0].message, `The value "NotGood" of the enum "WrongCase" does not match the expected conventions (lower case, hyphen separated words)`);
    assert.deepEqual(report[1]?.name, 'wrongCaseEnumValue');
    assert.deepEqual(report[1].message, `The value "not_good" of the enum "WrongCase" does not match the expected conventions (lower case, hyphen separated words)`);
    assert.deepEqual(report.length, 2);
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
    assert.deepEqual(report[0]?.name, 'redefinedIncludes');
    assert.deepEqual(report[0].message, `The includes statement "MyHome includes MyRoom" is defined more than once in ${specUrl}`);
    assert.deepEqual(report.length, 1);
  });


  it('checks existence of target and mixin in includes statements', async () => {
    const report = await analyzeIdl(`
MyHome includes MyRoom;
`);
    assert.deepEqual(report[0]?.name, 'unknownType');
    assert.deepEqual(report[0].message, `Target "MyHome" in includes statement "MyHome includes MyRoom" is not defined anywhere`);
    assert.deepEqual(report[1]?.name, 'unknownType');
    assert.deepEqual(report[1].message, `Mixin "MyRoom" in includes statement "MyHome includes MyRoom" is not defined anywhere`);
    assert.deepEqual(report.length, 2);
  });

  it('checks kinds of target and mixin in includes statements', async () => {
    const report = await analyzeIdl(`
dictionary MyHome { required boolean door; };
[Global=Home,Exposed=*] interface MyRoom {};

MyHome includes MyRoom;
`);
    assert.deepEqual(report[0]?.name, 'wrongKind');
    assert.deepEqual(report[0].message, `Target "MyHome" in includes statement "MyHome includes MyRoom" must be of kind "interface", not "dictionary"`);
    assert.deepEqual(report[1]?.name, 'wrongKind');
    assert.deepEqual(report[1].message, `Mixin "MyRoom" in includes statement "MyHome includes MyRoom" must be of kind "interface mixin", not "interface"`);
    assert.deepEqual(report.length, 2);
  });


  it('checks inheritance', async () => {
    const report = await analyzeIdl(`
[Global=Home,Exposed=*] interface MyHome {};
[Exposed=*] interface MyPalace : MyHome {};
[Exposed=*] interface MyLivingRoom : MyRoom {};
dictionary MyShelf : MyHome { required boolean full; };
`);
    assert.deepEqual(report[0]?.name, 'unknownType');
    assert.deepEqual(report[0].message, `"MyLivingRoom" inherits from "MyRoom" which is not defined anywhere`);
    assert.deepEqual(report[1]?.name, 'wrongKind');
    assert.deepEqual(report[1].message, `"MyShelf" is of kind "dictionary" but inherits from "MyHome" which is of kind "interface"`);
    assert.deepEqual(report.length, 2);
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
    assert.deepEqual(report[0]?.name, 'unknownType');
    assert.deepEqual(report[0].message, `Unknown type "bool" used in definition of "MyRoom"`);
    assert.deepEqual(report[1]?.name, 'unknownType');
    assert.deepEqual(report[1].message, `Unknown type "MyBed" used in definition of "MyRoom"`);
    assert.deepEqual(report[2]?.name, 'unknownType');
    assert.deepEqual(report[2].message, `Unknown type "MyUnknownType" used in definition of "MyRoom"`);
    assert.deepEqual(report[3]?.name, 'unknownType');
    assert.deepEqual(report[3].message, `Unknown type "UnknownInnerType" used in definition of "MyRoom"`);
    assert.deepEqual(report.length, 4);
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
    assert.deepEqual(report[0]?.name, 'unknownExtAttr');
    assert.deepEqual(report[0].message, `Unknown extended attribute "UnknownExtAttr" used in definition of "MyRoom"`);
    assert.deepEqual(report[1]?.name, 'unknownExtAttr');
    assert.deepEqual(report[1].message, `Unknown extended attribute "SuperUnknownExtAttr" used in definition of "MyLivingRoom"`);
    assert.deepEqual(report[2]?.name, 'unknownExtAttr');
    assert.deepEqual(report[2].message, `Unknown extended attribute "SuperUnknownExtAttr" used in definition of "MyBedRoom"`);
    assert.deepEqual(report.length, 3);
  });
});
