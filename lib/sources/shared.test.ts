import { describe, expect, it } from "vitest";
import { PM_TITLE_MATCH, stripHtml } from "./shared";

describe("PM_TITLE_MATCH", () => {
  const shouldMatch = [
    "Product Manager",
    "Senior Product Manager (Remote)",
    "Product Owner",
    "Head of Product",
    "Director of Product",
    "VP Product",
    "Vice President of Product",
    "product manager", // case-insensitive
    "Product Operations Lead",
  ];

  const shouldNotMatch = [
    "Software Engineer",
    "Sales Manager",
    "Product Designer",
    "Marketing Manager",
    "Customer Success Manager",
  ];

  it.each(shouldMatch)("matches %s", (title) => {
    expect(PM_TITLE_MATCH.test(title)).toBe(true);
  });

  it.each(shouldNotMatch)("does not match %s", (title) => {
    expect(PM_TITLE_MATCH.test(title)).toBe(false);
  });
});

describe("stripHtml", () => {
  it("removes tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("decodes common HTML entities", () => {
    expect(stripHtml("Tom &amp; Jerry&#39;s &quot;shop&quot;")).toBe(
      'Tom & Jerry\'s "shop"'
    );
  });

  it("collapses whitespace left behind by stripped tags", () => {
    expect(stripHtml("<div>a</div>\n<div>b</div>")).toBe("a b");
  });
});
