export interface PersonBoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface NormalizedDetectionRegion {
  originX: number;
  originY: number;
  width: number;
  height: number;
  points?: NormalizedPoint[];
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

  resetEvidence(): void {
    this.history.length = 0;
  }
}

const DETECTION_REGION_STORAGE_PREFIX = "camera-detection-region-";

export function sanitizeDetectionRegion(
  value: unknown,
): NormalizedDetectionRegion | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<NormalizedDetectionRegion>;
  if (Array.isArray(candidate.points)) {
    if (candidate.points.length !== 4) return null;

    const points = candidate.points.map((point) => ({
      x: Number(point?.x),
      y: Number(point?.y),
    }));
    if (!points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))) {
      return null;
    }

    const center = points.reduce(
      (sum, point) => ({ x: sum.x + point.x / 4, y: sum.y + point.y / 4 }),
      { x: 0, y: 0 },
    );
    const orderedPoints = points
      .map((point) => ({
        x: Math.max(0, Math.min(1, point.x)),
        y: Math.max(0, Math.min(1, point.y)),
      }))
      .sort(
        (left, right) =>
          Math.atan2(left.y - center.y, left.x - center.x) -
          Math.atan2(right.y - center.y, right.x - center.x),
      );
    const originX = Math.min(...orderedPoints.map((point) => point.x));
    const originY = Math.min(...orderedPoints.map((point) => point.y));
    const right = Math.max(...orderedPoints.map((point) => point.x));
    const bottom = Math.max(...orderedPoints.map((point) => point.y));
    const area = Math.abs(orderedPoints.reduce((sum, point, index) => {
      const next = orderedPoints[(index + 1) % orderedPoints.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0)) / 2;

    if (right - originX < 0.01 || bottom - originY < 0.01 || area < 0.0001) {
      return null;
    }

    return {
      originX,
      originY,
      width: right - originX,
      height: bottom - originY,
      points: orderedPoints,
    };
  }

  const values = [candidate.originX, candidate.originY, candidate.width, candidate.height];
  if (!values.every((entry) => typeof entry === "number" && Number.isFinite(entry))) {
    return null;
  }

  const originX = Math.max(0, Math.min(1, candidate.originX!));
  const originY = Math.max(0, Math.min(1, candidate.originY!));
  const width = Math.max(0, Math.min(1 - originX, candidate.width!));
  const height = Math.max(0, Math.min(1 - originY, candidate.height!));

  if (width < 0.01 || height < 0.01) return null;

  return { originX, originY, width, height };
}

export function getDetectionRegionPoints(
  region: NormalizedDetectionRegion,
): NormalizedPoint[] {
  if (region.points?.length === 4) return region.points;

  return [
    { x: region.originX, y: region.originY },
    { x: region.originX + region.width, y: region.originY },
    { x: region.originX + region.width, y: region.originY + region.height },
    { x: region.originX, y: region.originY + region.height },
  ];
}

export function isPointInsideDetectionRegion(
  x: number,
  y: number,
  region: NormalizedDetectionRegion | null | undefined,
): boolean {
  if (!region) return true;
  const points = getDetectionRegionPoints(region);
  let inside = false;

  for (let current = 0, previous = points.length - 1; current < points.length; previous = current++) {
    const currentPoint = points[current];
    const previousPoint = points[previous];
    const crosses = (currentPoint.y > y) !== (previousPoint.y > y);
    const intersectionX = previousPoint.x +
      ((y - previousPoint.y) * (currentPoint.x - previousPoint.x)) /
      (currentPoint.y - previousPoint.y || Number.EPSILON);
    if (crosses && x < intersectionX) inside = !inside;
  }

  return inside;
}

export function getPixelDetectionRegion(
  region: NormalizedDetectionRegion | null | undefined,
  frameWidth: number,
  frameHeight: number,
): PersonBoundingBox | null {
  const safeRegion = sanitizeDetectionRegion(region);
  if (!safeRegion || frameWidth <= 0 || frameHeight <= 0) return null;

  const originX = Math.floor(safeRegion.originX * frameWidth);
  const originY = Math.floor(safeRegion.originY * frameHeight);
  const right = Math.ceil((safeRegion.originX + safeRegion.width) * frameWidth);
  const bottom = Math.ceil((safeRegion.originY + safeRegion.height) * frameHeight);

  return {
    originX,
    originY,
    width: Math.max(1, Math.min(frameWidth, right) - originX),
    height: Math.max(1, Math.min(frameHeight, bottom) - originY),
  };
}

export function getStoredCameraDetectionRegion(
  cameraId: string | number,
): NormalizedDetectionRegion | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(`${DETECTION_REGION_STORAGE_PREFIX}${cameraId}`);
    return value ? sanitizeDetectionRegion(JSON.parse(value)) : null;
  } catch {
    return null;
  }
}

export function storeCameraDetectionRegion(
  cameraId: string | number,
  region: NormalizedDetectionRegion | null,
): void {
  if (typeof window === "undefined") return;

  const key = `${DETECTION_REGION_STORAGE_PREFIX}${cameraId}`;
  const safeRegion = sanitizeDetectionRegion(region);
  if (safeRegion) {
    window.localStorage.setItem(key, JSON.stringify(safeRegion));
  } else {
    window.localStorage.removeItem(key);
  }
}

export function getPaddedPersonRegion(
  boxes: PersonBoundingBox[],
  frameWidth: number,
  frameHeight: number,
  paddingRatio = 0.2,
  bounds?: PersonBoundingBox | null,
): PersonBoundingBox | null {
  if (boxes.length === 0 || frameWidth <= 0 || frameHeight <= 0) return null;

  const boundsLeft = Math.max(0, bounds?.originX ?? 0);
  const boundsTop = Math.max(0, bounds?.originY ?? 0);
  const boundsRight = Math.min(
    frameWidth,
    bounds ? bounds.originX + bounds.width : frameWidth,
  );
  const boundsBottom = Math.min(
    frameHeight,
    bounds ? bounds.originY + bounds.height : frameHeight,
  );

  const left = Math.min(...boxes.map((box) => box.originX));
  const top = Math.min(...boxes.map((box) => box.originY));
  const right = Math.max(...boxes.map((box) => box.originX + box.width));
  const bottom = Math.max(...boxes.map((box) => box.originY + box.height));
  const paddingX = Math.max(24, (right - left) * paddingRatio);
  const paddingY = Math.max(24, (bottom - top) * paddingRatio);
  const originX = Math.max(boundsLeft, left - paddingX);
  const originY = Math.max(boundsTop, top - paddingY);

  return {
    originX,
    originY,
    width: Math.max(0, Math.min(boundsRight, right + paddingX) - originX),
    height: Math.max(0, Math.min(boundsBottom, bottom + paddingY) - originY),
  };
}
