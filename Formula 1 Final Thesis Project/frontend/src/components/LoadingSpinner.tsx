"use client";

export function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div className="flex justify-center items-center h-40">
      <div
        className="animate-spin rounded-full border-4 border-gray-400 border-t-red-500"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      ></div>
    </div>
  );
}
