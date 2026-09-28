let seedReady = false;

export function markSeedReady(): void {
  seedReady = true;
}

export function isSeedReady(): boolean {
  return seedReady;
}
