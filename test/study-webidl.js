/**
 * Tests the Web IDL analysis library.
 *
 */
import { describe, it } from 'node:test';

import study from '../src/lib/study-webidl.js';
import { assertNbAnomalies, assertAnomaly } from './util.js';

const baseEventIdl = `
[Exposed=*]
interface Event {};
[LegacyTreatNonObjectAsNull]
callback EventHandlerNonNull = any (Event event);
typedef EventHandlerNonNull? EventHandler;
[Exposed=*]
interface EventTarget {};
`;

describe('The Web IDL analyser', () => {
  const specUrl = 'https://www.w3.org/TR/spec';
  const specUrl2 = 'https://www.w3.org/TR/spec2';

  function toCrawlResult (idl, idlSpec2) {
    const crawlResult = [{ url: specUrl, idl }];
    if (idlSpec2) {
      crawlResult.push({ url: specUrl2, idl: idlSpec2 });
    }
    return crawlResult;
  }

  function analyzeIdl (idl, idlSpec2) {
    const crawlResult = toCrawlResult(idl, idlSpec2);
    return study(crawlResult);
  }

  it('reports no anomaly if IDL is valid', () => {
    const report = analyzeIdl(`
[Global=Window,Exposed=*]
interface Valid {};
`);
    assertNbAnomalies(report, 0);
  });

  it('knows about basic IDL type', () => {
    const report = analyzeIdl(`
[Global=Window,Exposed=*]
interface ValidBasicTypes {
  attribute any test1;
  attribute ArrayBuffer test2;
  attribute bigint test3;
  attribute boolean test4;
  attribute byte test5;
  attribute ByteString test6;
  attribute DataView test7;
  attribute DOMString test8;
  attribute double test9;
  attribute float test10;
  attribute Float16Array test11;
  attribute Float32Array test12;
  attribute Float64Array test13;
  attribute Int16Array test14;
  attribute Int32Array test15;
  attribute Int8Array test16;
  attribute long long test17;
  attribute long test18;
  attribute object test19;
  attribute octet test20;
  attribute SharedArrayBuffer test21;
  attribute short test22;
  attribute symbol test23;
  attribute BigUint64Array test24;
  attribute BigInt64Array test25;
  attribute Uint16Array test26;
  attribute Uint32Array test27;
  attribute Uint8Array test28;
  attribute Uint8ClampedArray test29;
  attribute unrestricted double test30;
  attribute unrestricted float test31;
  attribute unsigned long long test32;
  attribute unsigned long test33;
  attribute unsigned short test34;
  attribute USVString test35;
  attribute undefined test36;
  attribute CSSOMString test37;
  attribute WindowProxy test38;
};
`);
    assertNbAnomalies(report, 0);
  });

  it('reports invalid IDL', () => {
    const report = analyzeIdl(`
[Global=Window,Exposed=*]
interface Invalid;
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'invalid',
      message: `Syntax error at line 3, since \`interface Invalid\`:
interface Invalid;
                 ^ Bodyless interface`,
      spec: { url: specUrl }
    });
  });

  it('reports invalid IDL and uses fallback from curated', () => {
    const crawlResult = toCrawlResult(`
// IDL in first spec
[Global=Window,Exposed=*]
interface Invalid;
`, `
// IDL in second spec
[Global=Window,Exposed=*]
interface Valid: Invalid {};
`);
    const curatedResults = toCrawlResult(`
[Global=Window,Exposed=*]
interface Invalid{};
`);
    const report = study(crawlResult, { curatedResults });
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, { name: 'invalid' });
  });

  it('forgets about previous results', () => {
    analyzeIdl(`
[Global=Window,Exposed=*]
interface Invalid;
`);
    const report = analyzeIdl(`
[Global=Window,Exposed=*]
interface Valid {};
`);
    assertNbAnomalies(report, 0);
  });

  it('detects missing [Exposed] extended attributes', () => {
    const report = analyzeIdl(`
interface Unexposed {};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'noExposure',
      message: 'The interface `Unexposed` has no `[Exposed]` extended attribute'
    });
  });

  it('detects unknown [Exposed] extended attributes', () => {
    const report = analyzeIdl(`
[Exposed=Unknown]
interface WhereIAm {};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'unknownExposure',
      message: 'The `[Exposed]` extended attribute of the interface `WhereIAm` references unknown global(s): Unknown'
    });
  });

  it('reports EventHandler attributes with no matching events', () => {
    const report = analyzeIdl(baseEventIdl + `
[Global=Window,Exposed=*]
interface Carlos : EventTarget {
  attribute EventHandler onbigbisous;
};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'noEvent',
      message: 'The interface `Carlos` defines an event handler `onbigbisous` but no event named "bigbisous" targets it'
    });
  });

  it('reports no anomaly for valid EventHandler attributes definitions', () => {
    const crawlResult = toCrawlResult(baseEventIdl +`
[Global=Window,Exposed=*]
interface Carlos : EventTarget {
  attribute EventHandler onbigbisous;
};`);
    crawlResult[0].events = [{
      type: 'bigbisous',
      interface: 'Event',
      targets: ['Carlos']
    }];
    const report = study(crawlResult);
    assertNbAnomalies(report, 0);
  });

  it('detects unexpected EventHandler attributes', () => {
    const report = analyzeIdl(baseEventIdl + `
[Global=Window,Exposed=*]
interface Carlos {
  attribute EventHandler onbigbisous;
};`);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'unexpectedEventHandler',
      message: 'The interface `Carlos` defines an event handler `onbigbisous` but does not inherit from `EventTarget`'
    });
    assertAnomaly(report, 1, { name: 'noEvent' });
  });

  it('follows the inheritance chain to assess event targets', () => {
    const crawlResult = toCrawlResult(baseEventIdl + `
[Global=Window,Exposed=*]
interface Singer : EventTarget {
  attribute EventHandler onbigbisous;
};

[Global=Window,Exposed=*]
interface Carlos : Singer {};`);
    crawlResult[0].events = [{
      type: 'bigbisous',
      interface: 'Event',
      targets: [
        'Carlos'
      ]
    }];
    const report = study(crawlResult);
    assertNbAnomalies(report, 0);
  });

  it('follows the bubbling path to assess event targets', () => {
    const crawlResult = toCrawlResult(baseEventIdl + `
[Global=Window,Exposed=*]
interface IDBDatabase : EventTarget {
  attribute EventHandler onabort;
};
[Global=Window,Exposed=*]
interface IDBTransaction : EventTarget {
  attribute EventHandler onabort;
};
[Global=Window,Exposed=*]
interface MyIndexedDB : IDBDatabase {
};`);
    crawlResult[0].events = [{
      type: 'abort',
      interface: 'Event',
      targets: ['IDBTransaction'],
      bubbles: true
    }];
    const report = study(crawlResult);
    assertNbAnomalies(report, 0);
  });

  it('detects incompatible partial exposure issues', () => {
    const report = analyzeIdl(`
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
      message: 'The `[Exposed]` extended attribute of the partial interface `MyPlace` references globals on which the original interface is not exposed: Elsewhere (original exposure: Somewhere)'
    });
  });

  it('detects incompatible partial exposure issues when "*" is used', () => {
    const report = analyzeIdl(`
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
      message: 'The partial interface `Somewhere` is exposed on all globals but the original interface is not (Somewhere)'
    });
  });

  it('detects IDL names that are redefined across specs', () => {
    const report = analyzeIdl(`
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
      message: `\`GrandBob\` is defined as a non-partial dictionary mutiple times in ${specUrl}, ${specUrl2}`,
      specs: [{ url: specUrl }, { url: specUrl2 }]
    });
  });

  it('detects IDL names that are redefined with different types across specs', () => {
    const report = analyzeIdl(`
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
      message: `\`GrandBob\` is defined multiple times with different types (dictionary, enum) in ${specUrl}, ${specUrl2}`,
      specs: [{ url: specUrl }, { url: specUrl2 }]
    });
  });

  it('detects the lack of original definition for partials', () => {
    const report = analyzeIdl(`
partial interface MyPlace {};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'noOriginalDefinition',
      message: `\`MyPlace\` is only defined as a partial interface (in ${specUrl})`
    });
  });

  it('alerts about single enum values', () => {
    const report = analyzeIdl(`
enum SingleValue {
  "single"
};
`);
    assertNbAnomalies(report, 1);
    assertAnomaly(report, 0, {
      name: 'singleEnumValue',
      message: 'The enum `SingleValue` has fewer than 2 possible values'
    });
  });

  it('alerts when enum values do not follow casing conventions', () => {
    const report = analyzeIdl(`
enum WrongCase {
  "good",
  "NotGood",
  "very-good",
  "not_good",
  "not good either"
};
`);
    assertNbAnomalies(report, 3);
    assertAnomaly(report, 0, {
      name: 'wrongCaseEnumValue',
      message: 'The value `"NotGood"` of the enum `WrongCase` does not match the expected conventions (lower case, hyphen separated words)'
    });
    assertAnomaly(report, 1, {
      name: 'wrongCaseEnumValue',
      message: 'The value `"not_good"` of the enum `WrongCase` does not match the expected conventions (lower case, hyphen separated words)'
    });
    assertAnomaly(report, 2, {
      name: 'wrongCaseEnumValue',
      message: 'The value `"not good either"` of the enum `WrongCase` does not match the expected conventions (lower case, hyphen separated words)'
    });
  });

  it('alerts on redefined includes statements', () => {
    const report = analyzeIdl(`
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
      message: `The includes statement \`MyHome includes MyRoom\` is defined more than once in ${specUrl}`
    });
  });

  it('checks existence of target and mixin in includes statements', () => {
    const report = analyzeIdl(`
MyHome includes MyRoom;
`);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'unknownType',
      message: 'Target `MyHome` in includes statement `MyHome includes MyRoom` is not defined anywhere'
    });
    assertAnomaly(report, 1, {
      name: 'unknownType',
      message: 'Mixin `MyRoom` in includes statement `MyHome includes MyRoom` is not defined anywhere'
    });
  });

  it('checks kinds of target and mixin in includes statements', () => {
    const report = analyzeIdl(`
dictionary MyHome { required boolean door; };
[Global=Home,Exposed=*] interface MyRoom {};

MyHome includes MyRoom;
`);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'wrongKind',
      message: 'Target `MyHome` in includes statement `MyHome includes MyRoom` must be of kind `interface`'
    });
    assertAnomaly(report, 1, {
      name: 'wrongKind',
      message: 'Mixin `MyRoom` in includes statement `MyHome includes MyRoom` must be of kind `interface mixin`'
    });
  });

  it('checks inheritance', () => {
    const report = analyzeIdl(`
[Global=Home,Exposed=*] interface MyHome {};
[Exposed=*] interface MyPalace : MyHome {};
[Exposed=*] interface MyLivingRoom : MyRoom {};
dictionary MyShelf : MyHome { required boolean full; };
`);
    assertNbAnomalies(report, 2);
    assertAnomaly(report, 0, {
      name: 'unknownType',
      message: '`MyLivingRoom` inherits from `MyRoom` which is not defined anywhere'
    });
    assertAnomaly(report, 1, {
      name: 'wrongKind',
      message: '`MyShelf` is of kind `dictionary` but inherits from `MyHome` which is of kind `interface`'
    });
  });

  it('reports unknown types', () => {
    const report = analyzeIdl(`
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
      message: 'Unknown type `bool` used in definition of `MyRoom`'
    });
    assertAnomaly(report, 1, {
      name: 'unknownType',
      message: 'Unknown type `MyBed` used in definition of `MyRoom`'
    });
    assertAnomaly(report, 2, {
      name: 'unknownType',
      message: 'Unknown type `MyUnknownType` used in definition of `MyRoom`'
    });
    assertAnomaly(report, 3, {
      name: 'unknownType',
      message: 'Unknown type `UnknownInnerType` used in definition of `MyRoom`'
    });
  });

  it('reports wrong types', () => {
    const report = analyzeIdl(`
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
      message: `\`MyNamespaceMixin\` is defined multiple times with different types (namespace, interface mixin) in ${specUrl}`
    });
    assertAnomaly(report, 1, {
      name: 'wrongType',
      message: 'Namespace `MyNamespace` cannot be used as a type in definition of `MyHome`'
    });
    assertAnomaly(report, 2, {
      name: 'wrongType',
      message: 'Interface mixin `MyLivingRoom` cannot be used as a type in definition of `MyHome`'
    });
    assertAnomaly(report, 3, {
      name: 'wrongType',
      message: 'Name `MyNamespaceMixin` exists but is not a type and cannot be used in definition of `MyHome`'
    });
  });

  it('reports unknown extended attributes', () => {
    const report = analyzeIdl(`
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
      message: 'Unknown extended attribute `UnknownExtAttr` used in definition of `MyRoom`'
    });
    assertAnomaly(report, 1, {
      name: 'unknownExtAttr',
      message: 'Unknown extended attribute `SuperUnknownExtAttr` used in definition of `MyLivingRoom`'
    });
    assertAnomaly(report, 2, {
      name: 'unknownExtAttr',
      message: 'Unknown extended attribute `SuperUnknownExtAttr` used in definition of `MyBedRoom`'
    });
  });

  it('reports dictionary members and interface URL attributes that use DOMString instead of USVString', () => {
    const report = analyzeIdl(`
[Exposed=*] interface MyLink {
  attribute DOMString url;
  attribute DOMString alternateUrl;
};
dictionary MyLinkOptions {
  DOMString fallbackUrl;
  sequence<DOMString> urls;
};
`);
    assertNbAnomalies(report, 4);
    assertAnomaly(report, 0, {
      name: 'urlType',
      message: '`attribute url` in interface `MyLink` uses `DOMString` instead of recommended `USVString` for URLs'
    });
    assertAnomaly(report, 1, {
      name: 'urlType',
      message: '`attribute alternateUrl` in interface `MyLink` uses `DOMString` instead of recommended `USVString` for URLs'
    });
    assertAnomaly(report, 2, {
      name: 'urlType',
      message: '`field fallbackUrl` in dictionary `MyLinkOptions` uses `DOMString` instead of recommended `USVString` for URLs'
    });
    assertAnomaly(report, 3, {
      name: 'urlType',
      message: '`field urls` in dictionary `MyLinkOptions` uses `DOMString` instead of recommended `USVString` for URLs'
    });
  });

  it('reports overloads across definitions (partial, same spec)', () => {
    const report = analyzeIdl(`
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
      message: '`operation overload` in partial interface `MyHome` overloads an operation defined in interface `MyHome`'
    });
    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: '`operation overload` in partial interface `MyPartialHome` overloads an operation defined in another partial interface `MyPartialHome`'
    });
  });

  it('reports overloads across definitions (partial, different specs)', () => {
    const report = analyzeIdl(`
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
      message: `\`operation overload\` in partial interface \`MyHome\` overloads an operation defined in interface \`MyHome\` (in ${specUrl})`,
      specs: [{ url: specUrl2 }]
    });

    // No way to know which spec to blame for MyPartialHome overloads, both
    // should be reported
    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: `\`operation overload\` in partial interface \`MyPartialHome\` (in ${specUrl2}) overloads an operation defined in another partial interface \`MyPartialHome\` (in ${specUrl})`,
      specs: [{ url: specUrl2 }, { url: specUrl }]
    });
  });

  it('reports overloads across definitions (mixin, same spec)', () => {
    const report = analyzeIdl(`
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
      message: '`operation overload` in interface `MyHome` overloads an operation defined in interface mixin `MyRoom`'
    });
    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: '`operation overload` in partial interface mixin `MyPartialRoom` overloads an operation defined in interface mixin `MyPartialRoom`'
    });
  });

  it('reports overloads across definitions (mixin, different specs)', () => {
    const report = analyzeIdl(`
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
      message: `\`operation overload\` in interface \`MyHome\` overloads an operation defined in interface mixin \`MyRoom\` (in ${specUrl2})`,
      specs: [{ url: specUrl }]
    });

    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: '`operation overload` in partial interface mixin `MyPartialRoom` overloads an operation defined in interface mixin `MyPartialRoom`',
      specs: [{ url: specUrl }]
    });

    assertAnomaly(report, 2, {
      name: 'overloaded',
      message: `\`operation overload\` in partial interface mixin \`MyPartialRoom\` overloads an operation defined in interface mixin \`MyPartialRoom\` (in ${specUrl})`,
      specs: [{ url: specUrl2 }]
    });

    assertAnomaly(report, 3, {
      name: 'overloaded',
      message: `\`operation overload\` in partial interface mixin \`MyPartialRoom\` (in ${specUrl2}) overloads an operation defined in another partial interface mixin \`MyPartialRoom\` (in ${specUrl})`,
      specs: [{ url: specUrl2 }, { url: specUrl }]
    });
  });

  it('reports overloads across definitions (partial and mixin, same spec)', () => {
    const report = analyzeIdl(`
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
      message: '`operation overload` in partial interface `MyHome` overloads an operation defined in interface mixin `MyRoom`'
    });
    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: '`operation overload` in partial interface `MyHome` overloads an operation defined in partial interface mixin `MyRoom`'
    });
    assertAnomaly(report, 2, {
      name: 'overloaded',
      message: '`operation overload` in partial interface mixin `MyRoom` overloads an operation defined in interface mixin `MyRoom`'
    });
  });

  it('reports overloads across definitions (partial and mixin, different specs)', () => {
    const report = analyzeIdl(`
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
      message: `\`operation overload\` in partial interface \`MyHome\` overloads an operation defined in interface mixin \`MyRoom\` (in ${specUrl2})`,
      specs: [{ url: specUrl }]
    });

    assertAnomaly(report, 1, {
      name: 'overloaded',
      message: `\`operation overload\` in partial interface \`MyHome\` overloads an operation defined in partial interface mixin \`MyRoom\` (in ${specUrl2})`,
      specs: [{ url: specUrl }]
    });

    assertAnomaly(report, 2, {
      name: 'overloaded',
      message: '`operation overload` in partial interface mixin `MyRoom` overloads an operation defined in interface mixin `MyRoom`',
      specs: [{ url: specUrl2 }]
    });
  });

  it('reports redefined members (same spec)', () => {
    const report = analyzeIdl(`
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
      message: '`dejaVu` in interface `MyHome` is defined more than once'
    });
    assertAnomaly(report, 1, {
      name: 'redefinedMember',
      message: '`dejaVu` in partial interface `MyHome` duplicates a member defined in interface `MyHome`'
    });
    assertAnomaly(report, 2, {
      name: 'redefinedMember',
      message: '`dejaVu` in interface `MyHome` duplicates a member defined in interface mixin `MyRoom`'
    });
    assertAnomaly(report, 3, {
      name: 'redefinedMember',
      message: '`dejaVu` in partial interface `MyHome` duplicates a member defined in interface mixin `MyRoom`'
    });
  });

  it('reports redefined members (different specs)', () => {
    const report = analyzeIdl(`
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
      message: `\`dejaVu\` in partial interface \`MyHome\` duplicates a member defined in interface \`MyHome\` (in ${specUrl})`,
      specs: [{ url: specUrl2 }]
    });

    assertAnomaly(report, 1, {
      name: 'redefinedMember',
      message: `\`dejaVu\` in interface \`MyHome\` duplicates a member defined in interface mixin \`MyRoom\` (in ${specUrl2})`,
      specs: [{ url: specUrl }]
    });

    assertAnomaly(report, 2, {
      name: 'redefinedMember',
      message: '`dejaVu` in partial interface `MyHome` duplicates a member defined in interface mixin `MyRoom`',
      specs: [{ url: specUrl2 }]
    });
  });
});
