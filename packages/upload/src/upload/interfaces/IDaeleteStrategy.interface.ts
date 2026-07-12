export interface IDeleteStrategy {
  delete(publicId: string, resourceType?: string): Promise<{ result: string }>;
}
