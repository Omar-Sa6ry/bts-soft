import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { Logger } from '@nestjs/common';

export interface TemplateRenderOptions {
  template: string;
  context: Record<string, unknown>;
}

/**
 * TemplateService
 * ---------------
 * Provides Handlebars-based template rendering for notifications.
 * Supports partials, helpers, and pre-compiled templates for performance.
 *
 * Usage:
 *   const html = await templateService.render({ template: '<h1>Hello {{name}}</h1>', context: { name: 'Omar' } });
 */
@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly compiledCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor() {
    this.registerDefaultHelpers();
  }

  /**
   * Renders a Handlebars template string with the provided context.
   * Templates are compiled and cached for subsequent calls.
   */
  public render({ template, context }: TemplateRenderOptions): string {
    try {
      const compiled = this.getCompiled(template);
      return compiled(context);
    } catch (error) {
      this.logger.error(`Template render error: ${error.message}`, error);
      throw new Error(`Failed to render template: ${error.message}`);
    }
  }

  /**
   * Registers a named partial for use in templates with {{> partialName}}.
   *
   * @param name - The partial identifier
   * @param template - The partial Handlebars template string
   */
  public registerPartial(name: string, template: string): void {
    Handlebars.registerPartial(name, template);
    this.logger.log(`Registered Handlebars partial: ${name}`);
  }

  /**
   * Registers a custom Handlebars helper function.
   *
   * @param name - The helper identifier
   * @param fn - The helper function
   */
  public registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, fn);
    this.logger.log(`Registered Handlebars helper: ${name}`);
  }

  /** Pre-built helpers available in all templates */
  private registerDefaultHelpers(): void {
    // {{formatDate date}} — formats a JS Date to a readable string
    Handlebars.registerHelper('formatDate', (date: Date | string) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // {{uppercase text}} — converts text to UPPERCASE
    Handlebars.registerHelper('uppercase', (text: string) => {
      return typeof text === 'string' ? text.toUpperCase() : text;
    });

    // {{ifEqual a b}} ... {{/ifEqual}} — conditional block helper
    Handlebars.registerHelper('ifEqual', function (a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    this.logger.log('Registered default Handlebars helpers: formatDate, uppercase, ifEqual');
  }

  private getCompiled(template: string): HandlebarsTemplateDelegate {
    if (!this.compiledCache.has(template)) {
      this.compiledCache.set(template, Handlebars.compile(template));
    }
    return this.compiledCache.get(template)!;
  }
}
