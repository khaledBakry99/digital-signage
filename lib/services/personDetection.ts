export interface PersonBoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export interface PersonCountChange {
  previousCount: number;
  currentCount: number;
}

export class PersonCountSmoother {
  private readonly history: number[] = [];
  private stableCount = 0;

  constructor(
    private readonly windowSize = 7,
    private readonly positiveVotesRequired = 4,
    private readonly zeroVotesRequired = 5,
  ) {}

  update(rawCount: number): PersonCountChange | null {
    const count = Math.max(0, Math.floor(rawCount));
    this.history.push(count);

    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    const frequency = new Map<number, { votes: number; lastIndex: number }>();
    this.history.forEach((value, index) => {
      const entry = frequency.get(value) ?? { votes: 0, lastIndex: index };
      entry.votes += 1;
      entry.lastIndex = index;
      frequency.set(value, entry);
    });

    const candidate = [...frequency.entries()]
      .sort(([, left], [, right]) => right.votes - left.votes || right.lastIndex - left.lastIndex)[0];

    if (!candidate) return null;

    const [candidateCount, candidateState] = candidate;
    const requiredVotes = candidateCount === 0
      ? this.zeroVotesRequired
      : this.positiveVotesRequired;

    if (
      candidateState.votes < requiredVotes ||
      candidateCount !== count ||
      candidateCount === this.stableCount
    ) {
      return null;
    }

    const previousCount = this.stableCount;
    this.stableCount = candidateCount;
    this.history.length = 0;
    this.history.push(candidateCount);

    return { previousCount, currentCount: candidateCount };
  }
}

export function getPaddedPersonRegion(
  boxes: PersonBoundingBox[],
  frameWidth: number,
  frameHeight: number,
  paddingRatio = 0.2,
): PersonBoundingBox | null {
  if (boxes.length === 0 || frameWidth <= 0 || frameHeight <= 0) return null;

  const left = Math.min(...boxes.map((box) => box.originX));
  const top = Math.min(...boxes.map((box) => box.originY));
  const right = Math.max(...boxes.map((box) => box.originX + box.width));
  const bottom = Math.max(...boxes.map((box) => box.originY + box.height));
  const paddingX = Math.max(24, (right - left) * paddingRatio);
  const paddingY = Math.max(24, (bottom - top) * paddingRatio);
  const originX = Math.max(0, left - paddingX);
  const originY = Math.max(0, top - paddingY);

  return {
    originX,
    originY,
    width: Math.min(frameWidth, right + paddingX) - originX,
    height: Math.min(frameHeight, bottom + paddingY) - originY,
  };
}
