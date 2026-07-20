/**
 * ResponseFormatter
 * 
 * A technology-agnostic utility for standardized response formatting.
 */
export class ResponseFormatter {
  static formatSuccess(data: any) {
    const isArray = Array.isArray(data);
    const isEnvelope = data && typeof data === 'object' && !isArray && 'success' in data && 'statusCode' in data;

    const items = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data?.items)
      ? data.data.items
      : [];

    return {
      success: true,
      statusCode: isEnvelope ? data.statusCode : 200,
      message: isEnvelope ? data.message : (data?.message || "Request successful"),
      timeStamp: new Date().toISOString(),
      pagination: data?.pagination,
      url: data?.url,
      items,
      data: isEnvelope ? data.data : (data?.data !== undefined ? data.data : (data ?? null)),
    };
  }

  static formatError(error: any) {
    const message =
      error?.errors?.map((err: any) => err?.message)?.join(", ") ||
      error?.response?.message ||
      error?.message ||
      "An unexpected error occurred";

    const statusCode = error?.response?.statusCode || error?.status || 500;

    return {
      success: false,
      statusCode,
      message,
      timeStamp: new Date().toISOString(),
      error: error?.response?.error || "Unknown error",
    };
  }
}
