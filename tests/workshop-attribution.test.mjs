import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const directory = new URL("../products/workshop/20261122A/", import.meta.url);
const script = await readFile(new URL("script.js", directory), "utf8");
const html = await readFile(new URL("index.html", directory), "utf8");
const booking = "https://atclerk-staging-booking.vercel.app/w/w-229cc5f3a44d4f2aa077d2c0e682c137";

function render(search, definitions = [{ href: booking }]) {
  const links = definitions.map(attributes => {
    const values = new Map(Object.entries(attributes));
    return {
      getAttribute(name) { return values.get(name) ?? null; },
      setAttribute(name, value) { values.set(name, value); },
      values,
    };
  });
  vm.runInNewContext(script, {
    URL, URLSearchParams,
    window: { location: { search } },
    document: {
      getElementById() { return null; },
      querySelector() { return null; },
      querySelectorAll(selector) { assert.equal(selector, "a[data-apply-link]"); return links; },
    },
  });
  return links;
}
function parameters(link) {
  const values = new URL(link.getAttribute("href")).searchParams;
  assert.deepEqual(values.getAll("atc_via"), ["lp"]);
  return Object.fromEntries([...values].filter(([key]) => key !== "atc_via"));
}

test("all five static booking links work with LP attribution before JavaScript runs", () => {
  const anchors = [...html.matchAll(/<a\b[^>]*\bdata-apply-link\b[^>]*>/g)];
  assert.equal(anchors.length, 5);
  for (const [tag] of anchors) {
    const href = tag.match(/\bhref="([^"]+)"/)?.[1].replaceAll("&amp;", "&");
    const url = new URL(href);
    assert.equal(url.origin + url.pathname, booking);
    assert.deepEqual(Object.fromEntries(url.searchParams), { utm_source: "thoulab_lp", utm_medium: "referral", atc_via: "lp" });
  }
});

test("an ordinary LP visit decorates every booking CTA without carrying arbitrary page parameters", () => {
  const links = render("?email=guardian%40example.invalid&fbclid=PRIVATE_CLICK&reservation=anything", [
    { href: booking }, { href: booking, target: "_blank", rel: "noopener" },
  ]);
  for (const link of links) assert.deepEqual(parameters(link), { utm_source: "thoulab_lp", utm_medium: "referral" });
  assert.equal(links[1].values.get("target"), "_blank");
  assert.equal(links[1].values.get("rel"), "noopener");
  assert.doesNotMatch(links[1].getAttribute("href"), /PRIVATE|guardian|reservation|fbclid/);
});

test("paid Meta traffic retains its source through the LP and a new-tab booking link", () => {
  const [link] = render("?utm_source=Facebook&utm_medium=PAID_SOCIAL&utm_campaign=ws20261122&utm_content=ad_123&utm_term=creative-A&fbclid=PRIVATE_CLICK&name=guardian", [
    { href: booking, target: "_blank" },
  ]);
  assert.deepEqual(parameters(link), {
    utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "ws20261122",
    utm_content: "ad_123", utm_term: "creative-A",
  });
  assert.equal(link.values.get("target"), "_blank");
});

test("valid other channels are preserved rather than changed to LP or Meta", () => {
  for (const source of ["google", "newsletter", "partner-site"]) {
    const [link] = render("?utm_source=" + source + "&utm_medium=cpc&utm_campaign=workshop");
    assert.equal(parameters(link).utm_source, source);
    assert.equal(parameters(link).utm_medium, "cpc");
  }
  for (const source of ["meta", "facebook", "instagram", "fb", "ig"]) {
    for (const medium of ["paid_social", "paid-social", "cpc", "paid"]) {
      const [link] = render("?utm_source=" + source + "&utm_medium=" + medium);
      assert.equal(parameters(link).utm_source, source);
      assert.equal(parameters(link).utm_medium, medium);
    }
  }
});

test("partial, duplicate, malformed or oversized explicit pairs send empty markers without orphan campaign values", () => {
  for (const search of [
    "?utm_source=meta&utm_campaign=orphan",
    "?utm_medium=paid_social&utm_campaign=orphan",
    "?utm_source=meta&utm_source=facebook&utm_medium=paid&utm_campaign=orphan",
    "?utm_source=meta&utm_medium=paid&utm_medium=referral",
    "?utm_source=guardian%40example.invalid&utm_medium=paid",
    "?utm_source=https%3A%2F%2Fexample.invalid&utm_medium=paid",
    "?utm_source=meta&utm_medium=paid+social",
    "?utm_source=meta&utm_medium=paid%0A",
    "?utm_source=" + "a".repeat(65) + "&utm_medium=paid",
    "?utm_source=meta&utm_medium=" + "a".repeat(65),
    "?utm_source=&utm_medium=paid",
    "?utm_source=meta&utm_medium=paid&utm_campaign=orphan&x=" + "z".repeat(2048),
  ]) {
    const [link] = render(search);
    assert.deepEqual(parameters(link), { utm_source: "", utm_medium: "" });
  }
});

test("optional campaign fields allow bounded identifiers and omit duplicates or unsafe free text", () => {
  const [link] = render("?utm_source=meta&utm_medium=paid&utm_campaign=" + "c".repeat(100) +
    "&utm_content=guardian%40example.invalid&utm_term=https%3A%2F%2Fexample.invalid");
  assert.equal(parameters(link).utm_campaign.length, 100);
  assert.equal(parameters(link).utm_content, undefined);
  assert.equal(parameters(link).utm_term, undefined);
  const [duplicates] = render("?utm_source=meta&utm_medium=paid&utm_campaign=a&utm_campaign=b&utm_content=" + "x".repeat(101) + "&utm_term=with%20space");
  assert.deepEqual(parameters(duplicates), { utm_source: "meta", utm_medium: "paid" });
  const [maximum] = render("?utm_source=" + "s".repeat(64) + "&utm_medium=" + "m".repeat(64));
  assert.equal(parameters(maximum).utm_source.length, 64);
  assert.equal(parameters(maximum).utm_medium.length, 64);
});

test("existing trusted booking-link query and fragment survive while stale attribution is replaced", () => {
  const [link] = render("?utm_source=meta&utm_medium=paid&utm_campaign=new", [
    { href: booking + "?locale=ja&utm_source=old&utm_source=duplicate&utm_medium=referral&utm_content=stale#application" },
  ]);
  const url = new URL(link.getAttribute("href"));
  assert.equal(url.hash, "#application");
  assert.equal(url.searchParams.get("locale"), "ja");
  assert.deepEqual(url.searchParams.getAll("utm_source"), ["meta"]);
  assert.equal(url.searchParams.get("utm_campaign"), "new");
  assert.equal(url.searchParams.has("utm_content"), false);
});

test("only the canonical booking destination is decorated", () => {
  const urls = [
    "https://example.invalid/w/anything",
    "https://atclerk-staging-booking.vercel.app/account",
    "https://atclerk-staging-booking.vercel.app.evil.invalid/w/anything",
    "javascript:void(0)",
  ];
  const links = render("?utm_source=meta&utm_medium=paid", urls.map(href => ({ href })));
  for (let i = 0; i < urls.length; i++) assert.equal(links[i].getAttribute("href"), urls[i]);
});

test("valid Meta tags survive invalid optional campaign and duplicate optional values", () => {
  const [link] = render("?utm_source=meta&utm_medium=paid_social&utm_campaign=%E6%97%A5%E6%9C%AC%E8%AA%9E%20space&utm_content=a&utm_content=b&utm_term=safe");
  assert.deepEqual(parameters(link), { utm_source: "meta", utm_medium: "paid_social", utm_term: "safe" });
});
test("campaign-only orphans remain LP while explicit empty pairs clear prior tagged links", () => {
  const [orphan] = render("?utm_campaign=orphan");
  assert.deepEqual(parameters(orphan), { utm_source: "thoulab_lp", utm_medium: "referral" });
  const [cleared] = render("?utm_source=&utm_medium=", [{
    href: booking + "?utm_source=meta&utm_medium=paid_social&utm_campaign=old",
  }]);
  assert.deepEqual(parameters(cleared), { utm_source: "", utm_medium: "" });
});

test("decoded trailing CR and LF cannot enter source, medium or optional labels", () => {
  for (const ending of ["%0D", "%0A", "%0D%0A"]) {
    for (const search of ["?utm_source=meta" + ending + "&utm_medium=paid", "?utm_source=meta&utm_medium=paid" + ending]) {
      assert.deepEqual(parameters(render(search)[0]), { utm_source: "", utm_medium: "" });
    }
    assert.deepEqual(parameters(render("?utm_source=meta&utm_medium=paid&utm_campaign=campaign" + ending + "&utm_content=ad" + ending + "&utm_term=keyword" + ending)[0]), {
      utm_source: "meta", utm_medium: "paid",
    });
  }
});

test("the actual LP always marks its booking links as LP even when an advertisement or stale link says direct", () => {
  for (const marker of ["direct", "lp", "unknown", "DIRECT", "", "direct&atc_via=lp"]) {
    const [link] = render("?utm_source=meta&utm_medium=paid_social&utm_campaign=same&utm_content=same&atc_via=" + marker, [{
      href: booking + "?atc_via=direct&atc_via=unknown", target: "_blank", rel: "noopener",
    }]);
    assert.deepEqual(parameters(link), { utm_source: "meta", utm_medium: "paid_social", utm_campaign: "same", utm_content: "same" });
    assert.equal(new URL(link.getAttribute("href")).searchParams.get("atc_via"), "lp");
    assert.equal(link.values.get("target"), "_blank");
  }
});

test("invalid UTM pairs retain the LP entry marker while keeping invalid tokens and click IDs out", () => {
  const [link] = render("?utm_source=meta&utm_medium=bad%20medium&atc_via=direct&fbclid=PRIVATE_CLICK");
  assert.deepEqual(Object.fromEntries(new URL(link.getAttribute("href")).searchParams), { utm_source: "", utm_medium: "", atc_via: "lp" });
  assert.doesNotMatch(link.getAttribute("href"), /PRIVATE_CLICK|bad|direct/);
  assert.match(html, /script\.js\?v=entry-route-20261108/);
});


