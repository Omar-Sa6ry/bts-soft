import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UrlField } from './UrlField.decorator';
import 'reflect-metadata';

class TestUrl {
  @UrlField()
  website: string;
}

describe('UrlField', () => {
  it('should validate URL format correctly', async () => {
    const obj = new TestUrl();
    obj.website = 'not-a-url';
    let errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);

    obj.website = 'https://google.com';
    errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it('should transform URL to lowercase', async () => {
    const raw = { website: 'HTTPS://GOOGLE.COM' };
    const instance = plainToInstance(TestUrl, raw);
    expect(instance.website).toBe('https://google.com');
  });

  it('should fail on SQL injection', async () => {
    const obj = new TestUrl();
    obj.website = 'https://google.com; SELECT * FROM users';
    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });
});
