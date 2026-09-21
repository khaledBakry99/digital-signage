import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdEditModal from "@/components/AdEditModal";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import type { MediaAsset } from "@/lib/types/mediaAsset";

const videoAd: MediaAsset = {
  id: 42,
  clientId: 7,
  name: "Video ad",
  description: "Existing video advertisement",
  type: "Video",
  url: "https://example.com/ad.mp4",
  durationSeconds: 10,
  fileSizeMb: 3,
  resolution: "1920x1080",
  isFallback: false,
  createdAtUtc: "2026-09-21T00:00:00Z",
};

describe("AdEditModal", () => {
  it("preserves the video type when saving metadata without replacing the file", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ThemeProvider>
        <AdEditModal
          ad={videoAd}
          isOpen
          onClose={vi.fn()}
          onSave={onSave}
        />
      </ThemeProvider>,
    );

    fireEvent.change(screen.getByDisplayValue("Video ad"), {
      target: { value: "Updated video ad" },
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ التغييرات" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(42, expect.objectContaining({
        name: "Updated video ad",
        type: "Video",
      }));
    });
  });
});
