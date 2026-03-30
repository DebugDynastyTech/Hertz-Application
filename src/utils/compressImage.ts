// src/utils/compressImage.ts
import * as ImageManipulator from "expo-image-manipulator";

export const compressImage = async (uri: string) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [],
    {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
};