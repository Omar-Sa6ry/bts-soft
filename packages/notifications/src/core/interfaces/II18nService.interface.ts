/**
 * II18nService
 * -------------
 * Minimal typed contract for the `nestjs-i18n` service that the
 * {@link NotificationProcessor} depends on optionally.
 *
 * Using this interface instead of `any` ensures the processor is
 * fully typed while remaining decoupled from the actual `nestjs-i18n`
 * library (it is loaded dynamically via `ModuleRef`).
 */
export interface II18nService {
  /**
   * Translates a key into the specified language, injecting optional
   * interpolation arguments.
   *
   * @param key  - The i18n translation key (e.g., `'notifications.welcome'`)
   * @param opts - Translation options: `lang` and `args` for interpolation
   */
  t(key: string, opts: { lang: string; args: Record<string, unknown> }): Promise<string>;
}
