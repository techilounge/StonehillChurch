import * as React from "react";

export function getAutoFocalPoint(imageUrl: string): { x: number; y: number } {
  if (!imageUrl) return { x: 50, y: 50 };
  const lower = imageUrl.toLowerCase();
  
  if (
    lower.includes("portrait") ||
    lower.includes("face") ||
    lower.includes("person") ||
    lower.includes("leader") ||
    lower.includes("avatar") ||
    lower.includes("profile")
  ) {
    return { x: 50, y: 35 }; // Face is usually in the upper-middle region
  }
  
  if (
    lower.includes("group") ||
    lower.includes("members") ||
    lower.includes("crowd") ||
    lower.includes("audience") ||
    lower.includes("choir")
  ) {
    return { x: 50, y: 45 }; // Group photos are usually slightly upper centered
  }
  
  return { x: 50, y: 50 }; // Center weighted by default
}

export function resolveImageStyles(
  aspectRatio: string | undefined,
  focalX: number | undefined,
  focalY: number | undefined,
  defaultRatio: string,
  imageUrl?: string
): React.CSSProperties {
  const finalRatio = aspectRatio && aspectRatio !== "default" ? aspectRatio : defaultRatio;
  
  // If focal point isn't explicitly set, try auto-detection
  let fx = 50;
  let fy = 50;
  if (typeof focalX === "number" && typeof focalY === "number") {
    fx = focalX;
    fy = focalY;
  } else if (imageUrl) {
    const autoPt = getAutoFocalPoint(imageUrl);
    fx = autoPt.x;
    fy = autoPt.y;
  }
  
  const style: React.CSSProperties = {
    objectFit: "cover",
    objectPosition: `${fx}% ${fy}%`,
  };
  
  if (finalRatio && finalRatio !== "auto") {
    const parts = finalRatio.split(":");
    if (parts.length === 2) {
      style.aspectRatio = `${parts[0]} / ${parts[1]}`;
    }
  }
  
  return style;
}
