import { SUPPORTED_CHAINS, validateChain, validateForkName } from "../validation";

// ---------------------------------------------------------------------------
// validateForkName
// ---------------------------------------------------------------------------

describe("validateForkName", () => {
  it("accepts a valid lowercase name", () => {
    expect(validateForkName("my-fork")).toBeNull();
  });

  it("accepts a name with numbers and hyphens", () => {
    expect(validateForkName("fork-123-abc")).toBeNull();
  });

  it("accepts minimum length (3 chars)", () => {
    expect(validateForkName("abc")).toBeNull();
  });

  it("accepts maximum length (32 chars)", () => {
    expect(validateForkName("a".repeat(32))).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(validateForkName("")).not.toBeNull();
  });

  it("rejects non-string input", () => {
    expect(validateForkName(undefined)).not.toBeNull();
    expect(validateForkName(null)).not.toBeNull();
    expect(validateForkName(42)).not.toBeNull();
  });

  it("rejects names shorter than 3 characters", () => {
    expect(validateForkName("ab")).not.toBeNull();
    expect(validateForkName("a")).not.toBeNull();
  });

  it("rejects names longer than 32 characters", () => {
    expect(validateForkName("a".repeat(33))).not.toBeNull();
  });

  it("rejects uppercase letters", () => {
    expect(validateForkName("MyFork")).not.toBeNull();
    expect(validateForkName("FORK")).not.toBeNull();
  });

  it("rejects underscores", () => {
    expect(validateForkName("my_fork")).not.toBeNull();
  });

  it("rejects spaces", () => {
    expect(validateForkName("my fork")).not.toBeNull();
  });

  it("rejects special characters", () => {
    expect(validateForkName("fork!")).not.toBeNull();
    expect(validateForkName("fork.1")).not.toBeNull();
    expect(validateForkName("fork/1")).not.toBeNull();
  });

  it("error message mentions length requirement", () => {
    const err = validateForkName("ab");
    expect(err).toContain("3");
    expect(err).toContain("32");
  });

  it("error message mentions allowed characters", () => {
    const err = validateForkName("UPPER");
    expect(err).toMatch(/lowercase|hyphen/i);
  });
});

// ---------------------------------------------------------------------------
// validateChain
// ---------------------------------------------------------------------------

describe("validateChain", () => {
  it.each(SUPPORTED_CHAINS)("accepts supported chain: %s", (chain) => {
    expect(validateChain(chain)).toBeNull();
  });

  it("rejects an unsupported chain", () => {
    expect(validateChain("solana-mainnet")).not.toBeNull();
  });

  it("rejects an empty string", () => {
    expect(validateChain("")).not.toBeNull();
  });

  it("rejects non-string input", () => {
    expect(validateChain(undefined)).not.toBeNull();
    expect(validateChain(null)).not.toBeNull();
    expect(validateChain(42)).not.toBeNull();
  });

  it("is case-sensitive", () => {
    expect(validateChain("Base-Mainnet")).not.toBeNull();
    expect(validateChain("BASE-MAINNET")).not.toBeNull();
  });

  it("error message lists supported chains", () => {
    const err = validateChain("unknown-chain");
    expect(err).toContain("base-mainnet");
    expect(err).toContain("eth-mainnet");
  });
});
