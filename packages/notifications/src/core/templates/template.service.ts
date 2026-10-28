import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LruCache } from './lru-cache';

export interface TemplateRenderOptions {
  template: string;
  context: Record<string, unknown>;
}

export interface TemplateFileRenderOptions {
  filePath: string;
  context: Record<string, unknown>;
}

/**
 * TemplateService
 * ---------------
 * Provides Handlebars-based template rendering for notifications.
 * Supports inline templates, template files from disk, partials, helpers, and pre-compiled templates.
 * Uses a bounded LRU cache to prevent memory leaks with dynamic template strings.
 *
 * Usage:
 *   const html = templateService.render({ template: '<h1>Hello {{name}}</h1>', context: { name: 'Omar' } });
 *   const fileHtml = templateService.renderFile({ filePath: '/templates/welcome.hbs', context: { name: 'Omar' } });
 */
@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly compiledCache: LruCache<string, HandlebarsTemplateDelegate>;

  constructor(@Optional() @Inject('TEMPLATE_CACHE_CAPACITY') maxCacheEntries?: number) {
    this.compiledCache = new LruCache<string, HandlebarsTemplateDelegate>(maxCacheEntries ?? 500);
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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Template render error: ${err.message}`, err.stack);
      throw new Error(`Failed to render template: ${err.message}`);
    }
  }

  /**
   * Reads a template file from disk, compiles it, caches it, and renders it.
   */
  public renderFile({ filePath, context }: TemplateFileRenderOptions): string {
    const resolvedPath = path.resolve(filePath);
    try {
      if (!this.compiledCache.has(resolvedPath)) {
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Template file not found at: ${resolvedPath}`);
        }
        const fileContent = fs.readFileSync(resolvedPath, "utf-8");
        this.compiledCache.set(resolvedPath, Handlebars.compile(fileContent));
      }
      const compiled = this.compiledCache.get(resolvedPath)!;
      return compiled(context);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Template file render error: ${err.message}`, err.stack);
      throw new Error(`Failed to render template file: ${err.message}`);
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

    // {{lowercase text}} — converts text to lowercase
    Handlebars.registerHelper('lowercase', (text: string) => {
      return typeof text === 'string' ? text.toLowerCase() : text;
    });

    // {{formatCurrency amount currency}} — formats currency, e.g. 100 EGP or $100
    Handlebars.registerHelper('formatCurrency', (amount: number | string, currency = 'USD') => {
      const num = Number(amount);
      if (Number.isNaN(num)) return String(amount);
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
    });

    // {{ifEqual a b}} ... {{/ifEqual}} — conditional block helper
    Handlebars.registerHelper('ifEqual', function (a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    });

    this.logger.log('Registered default Handlebars helpers: formatDate, uppercase, lowercase, formatCurrency, ifEqual');
  }

  private getCompiled(template: string): HandlebarsTemplateDelegate {
    if (!this.compiledCache.has(template)) {
      this.compiledCache.set(template, Handlebars.compile(template));
    }
    return this.compiledCache.get(template)!;
  }
}

