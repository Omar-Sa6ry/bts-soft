export const extractPublicId = (url: string, resourceType: 'image' | 'video' | 'raw' | 'audio' = 'image'): string | null => {
  if (!url) return null;
  
  // For raw files, the extension is part of the public ID
  if (resourceType === 'raw') {
    const regex = /\/upload\/(?:v\d+\/)?(.+)$/i;
    const match = url.match(regex);
    return match && match[1] ? match[1] : null;
  }
  
  // For images and videos, the extension is the format, not part of the ID
  // Example: .../upload/v123/folder/sample.jpg -> folder/sample
  const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
};
