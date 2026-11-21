import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

// Removes every image an account uploaded (they live under the account's own
// folder in the public bucket). Called when the account is deleted, so the
// files don't stay reachable by their old addresses. Never throws: a file
// left behind must not undo a deletion that already happened.
export async function removeAccountUploads(accountId: string): Promise<void> {
  try {
    const bucket = createAdminClient().storage.from("uploads");
    for (let round = 0; round < 50; round++) {
      const { data, error } = await bucket.list(accountId, { limit: 1000 });
      if (error || !data?.length) return;
      const { error: removeError } = await bucket.remove(data.map((file) => `${accountId}/${file.name}`));
      if (removeError || data.length < 1000) return;
    }
  } catch (error) {
    console.error("remove uploads failed", error);
  }
}
