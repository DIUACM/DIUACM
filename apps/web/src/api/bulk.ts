const BULK_IDS_PER_REQUEST = 90

interface BulkResult {
  affected: number
}

export async function runBulkInChunks(
  ids: number[],
  run: (ids: number[]) => Promise<BulkResult>,
): Promise<{ ok: true; affected: number }> {
  let affected = 0

  for (let index = 0; index < ids.length; index += BULK_IDS_PER_REQUEST) {
    const result = await run(ids.slice(index, index + BULK_IDS_PER_REQUEST))
    affected += result.affected
  }

  return { ok: true, affected }
}
