export type ProfileCheck = {
  handle: string;
  followers: number;
  isPublic: boolean;
  hasExistingAccount: boolean;
  eligible: boolean;
  reason?: "private" | "followers";
};

function normaliseHandle(rawValue: string) {
  return rawValue
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function followerEstimate(handle: string) {
  const score = [...handle].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return 7200 + (score % 18600);
}

/**
 * Front-end demo adapter. Replace this function with the product's profile
 * eligibility endpoint; the UI states can remain unchanged.
 */
export async function checkInstagramEligibility(
  rawHandle: string,
): Promise<ProfileCheck> {
  const handle = normaliseHandle(rawHandle);

  await new Promise((resolve) => setTimeout(resolve, 850));

  const isPublic = !handle.includes("private");
  const followers = handle.includes("small")
    ? 2800
    : followerEstimate(handle);
  const hasExistingAccount = handle.includes("taken");

  return {
    handle,
    followers,
    isPublic,
    hasExistingAccount,
    eligible: isPublic && followers >= 5000 && !hasExistingAccount,
    reason: !isPublic ? "private" : followers < 5000 ? "followers" : undefined,
  };
}
