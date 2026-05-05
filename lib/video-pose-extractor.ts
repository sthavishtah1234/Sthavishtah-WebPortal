import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision"

export interface PoseLandmarkData {
  timestamp_ms: number
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>
}

export class VideoPoseExtractor {
  private poseLandmarker: PoseLandmarker | null = null
  private videoElement: HTMLVideoElement | null = null

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    )

    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    })
  }

  async extractPosesFromVideo(
    videoFile: File,
    intervalMs = 500,
    onProgress?: (percent: number) => void,
  ): Promise<PoseLandmarkData[]> {
    if (!this.poseLandmarker) {
      throw new Error("PoseLandmarker not initialized")
    }

    // Create video element
    const video = document.createElement("video")
    video.src = URL.createObjectURL(videoFile)
    video.muted = true
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve
    })

    const duration = video.duration * 1000 // Convert to ms
    const poses: PoseLandmarkData[] = []

    // Extract poses at intervals
    for (let time = 0; time < duration; time += intervalMs) {
      video.currentTime = time / 1000

      // Wait for video to seek
      await new Promise((resolve) => {
        video.onseeked = resolve
      })

      // Detect pose at this timestamp
      const result = this.poseLandmarker.detectForVideo(video, time)

      if (result.landmarks && result.landmarks[0]) {
        poses.push({
          timestamp_ms: time,
          landmarks: result.landmarks[0].map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility || 0,
          })),
        })
      }

      // Report progress
      if (onProgress) {
        onProgress(Math.round((time / duration) * 100))
      }
    }

    // Clean up
    URL.revokeObjectURL(video.src)

    return poses
  }

  destroy() {
    this.poseLandmarker?.close()
  }
}
