// Notification Module
export * from "@bts-soft/notifications";

// Redis Module
export * from "@bts-soft/cache";

// Upload Module
export * from "@bts-soft/upload";

// Validation Decorators
export * from "@bts-soft/validation";

// Common Modules
export * from "@bts-soft/common";

if (process.env.NODE_ENV === "production") {
  const noop = () => {};
  console.log = noop;
  console.error = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
}
