import { useState } from "react";
import { useRequestUploadUrl } from "@workspace/api-client-react";

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const requestUrl = useRequestUploadUrl();

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      // 1. Request presigned URL
      const { uploadURL, objectPath } = await requestUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type,
        },
      });

      // 2. Upload file directly to GCS via presigned URL
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload error")));
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      return objectPath;
    } catch (error) {
      console.error("Failed to upload media:", error);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return { uploadFile, isUploading, uploadProgress };
}
