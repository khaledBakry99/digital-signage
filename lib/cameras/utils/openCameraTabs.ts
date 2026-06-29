function readOpenCameraIds(): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem("openCameraTabs");
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
}

function persist(ids: number[]): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem("openCameraTabs", JSON.stringify(ids));
  window.dispatchEvent(new Event("storage"));
}

export function registerOpenCameraTab(cameraId: number): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  const ids = readOpenCameraIds();
  if (!ids.includes(cameraId)) {
    ids.push(cameraId);
    persist(ids);
  }
  return ids;
}

export function unregisterOpenCameraTab(cameraId: number): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  const ids = readOpenCameraIds();
  const filtered = ids.filter((id) => id !== cameraId);
  if (filtered.length !== ids.length) {
    persist(filtered);
  }
  return filtered;
}

export function getOpenCameraTabIds(): number[] {
  return readOpenCameraIds();
}
