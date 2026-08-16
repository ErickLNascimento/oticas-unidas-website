import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let landmarkerPromise;

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks("/mediapipe").then((vision) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task" },
        runningMode: "IMAGE",
        numFaces: 1,
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
      }),
    );
  }
  return landmarkerPromise;
}

const average = (points) => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
});

export async function detectGlassesPlacement(image) {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(image);
  const landmarks = result.faceLandmarks?.[0];
  if (!landmarks) throw new Error("FACE_NOT_FOUND");

  const leftEye = average([landmarks[33], landmarks[133], landmarks[159], landmarks[145]]);
  const rightEye = average([landmarks[263], landmarks[362], landmarks[386], landmarks[374]]);
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  const eyeDistance = Math.hypot(dx, dy);

  return {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    width: eyeDistance * 2.25,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}
