import { describe, it, expect } from "vitest";
import {
  calculateBuilderEstimate,
  groupBuilderItemsByCategory,
  type BuilderItem,
} from "@/lib/services/package-builder.service";

describe("package-builder.service", () => {
  const baseItems: BuilderItem[] = [
    {
      id: "inc-1",
      experienceId: "exp-1",
      name: "Included lodging",
      description: null,
      category: "lodging",
      city: "medellin",
      includedByDefault: true,
      priceCents: 30000,
      optional: false,
    },
    {
      id: "opt-1",
      experienceId: "exp-2",
      name: "Guatapé tour",
      description: null,
      category: "tour",
      city: "medellin",
      includedByDefault: false,
      priceCents: 15000,
      optional: true,
    },
  ];

  it("groups items by category", () => {
    const groups = groupBuilderItemsByCategory(baseItems);
    expect(groups.lodging).toHaveLength(1);
    expect(groups.tour).toHaveLength(1);
    expect(groups.transport).toHaveLength(0);
  });

  it("always counts included items", () => {
    const estimate = calculateBuilderEstimate(baseItems, []);
    expect(estimate.totalCents).toBe(30000);
    expect(estimate.items).toHaveLength(1);
    expect(estimate.items[0].id).toBe("inc-1");
  });

  it("adds optional items when selected", () => {
    const estimate = calculateBuilderEstimate(baseItems, ["opt-1"]);
    expect(estimate.totalCents).toBe(45000);
    expect(estimate.items).toHaveLength(2);
  });

  it("calculates deposit as percentage of total", () => {
    const estimate = calculateBuilderEstimate(baseItems, ["opt-1"], 0.5);
    expect(estimate.depositCents).toBe(22500);
  });
});

