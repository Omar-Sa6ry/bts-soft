import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateService],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should render a simple template', () => {
    const template = 'Hello {{name}}';
    const context = { name: 'Omar' };
    const result = service.render({ template, context });
    expect(result).toBe('Hello Omar');
  });

  it('should render complex templates with logic', () => {
    const template = '{{#if show}}Visible{{else}}Hidden{{/if}}';
    expect(service.render({ template, context: { show: true } })).toBe('Visible');
    expect(service.render({ template, context: { show: false } })).toBe('Hidden');
  });

  it('should support built-in helpers', () => {
    const template = '{{#each items}}{{this}} {{/each}}';
    const context = { items: ['A', 'B', 'C'] };
    const result = service.render({ template, context });
    expect(result.trim()).toBe('A B C');
  });

  it('should support default helpers (formatDate)', () => {
    const date = new Date('2026-01-01');
    const template = '{{formatDate date}}';
    const result = service.render({ template, context: { date } });
    expect(result).toContain('January 1, 2026');
  });

  it('should support default helpers (uppercase)', () => {
    const template = '{{uppercase "hello"}}';
    expect(service.render({ template, context: {} })).toBe('HELLO');
    // Test non-string branch
    expect(service.render({ template: '{{uppercase val}}', context: { val: 123 } })).toBe('123');
  });

  it('should support default helpers (ifEqual)', () => {
    const template = '{{#ifEqual a b}}Match{{else}}No Match{{/ifEqual}}';
    expect(service.render({ template, context: { a: 1, b: 1 } })).toBe('Match');
    expect(service.render({ template, context: { a: 1, b: 2 } })).toBe('No Match');
  });

  it('should register and use partials', () => {
    service.registerPartial('myPartial', 'Partial: {{val}}');
    const template = '{{> myPartial}}';
    const result = service.render({ template, context: { val: 'test' } });
    expect(result).toBe('Partial: test');
  });

  it('should register and use custom helpers', () => {
    service.registerHelper('greet', (name) => `Hi ${name}`);
    const template = '{{greet name}}';
    const result = service.render({ template, context: { name: 'Omar' } });
    expect(result).toBe('Hi Omar');
  });

  it('should throw error on invalid template syntax', () => {
    const template = '{{#if missing}} {{/if'; // Malformed
    expect(() => service.render({ template, context: {} })).toThrow('Failed to render template');
  });

  it('should cache compiled templates', () => {
    const template = 'Cached {{value}}';
    const context = { value: '1' };
    
    // First call compiles and caches
    service.render({ template, context });
    
    // Check if it's in the cache
    expect((service as any).compiledCache.has(template)).toBeTruthy();
  });
});

