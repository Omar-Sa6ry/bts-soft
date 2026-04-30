import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { 
  UsernameField, 
  EmailField, 
  PasswordField, 
  PasswordComplexity,
  PhoneField,
  NationalIdField,
  UrlField,
  NameField,
  TextField,
  DescriptionField,
  NumberField,
  BooleanField,
  DateField,
  EnumField,
  IdField,
  CapitalTextField
} from '../src';
import { Controller, Post, Body } from '@nestjs/common';

enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

class ValidationDto {
  @UsernameField()
  username: string;

  @EmailField()
  email: string;

  @PasswordField(8, 16, PasswordComplexity.COMPREHENSIVE)
  password: string;

  @PhoneField('EG')
  phone: string;

  @NationalIdField()
  nid: string;

  @UrlField()
  website: string;

  @NameField('Full Name')
  fullName: string;

  @TextField('Title', 3, 20)
  title: string;

  @DescriptionField('Bio')
  bio: string;

  @NumberField('Age', 18, 100)
  age: number;

  @BooleanField()
  isActive: boolean;

  @DateField('Birth Date')
  birthDate: Date;

  @EnumField(UserRole, 'Role')
  role: UserRole;

  @IdField('User', 26)
  uuid: string;

  @CapitalTextField('City')
  city: string;
}

@Controller('test')
class TestController {
  @Post('validate')
  validate(@Body() dto: ValidationDto) {
    return dto;
  }
}

describe('Validation Package (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true })); // Essential for @Transform
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should pass validation with valid data and apply transformations', async () => {
    const validData = {
      username: 'omar_sabry',
      email: 'TEST@EXAMPLE.COM',
      password: 'P@ssword123',
      phone: '+201012345678',
      nid: '299-0101-12345-67',
      website: 'HTTPS://GOOGLE.COM',
      fullName: 'omar sabry',
      title: 'Senior Developer',
      bio: 'THIS IS A LONG DESCRIPTION FOR BIO.',
      age: 25,
      isActive: true,
      birthDate: '1999-01-01',
      role: 'ADMIN',
      uuid: '12345678901234567890123456',
      city: 'new york city'
    };

    const response = await request(app.getHttpServer())
      .post('/test/validate')
      .send(validData)
      .expect(201);

    const body = response.body;

    // Verify Transformations
    expect(body.email).toBe('test@example.com'); // Lowercase
    expect(body.website).toBe('https://google.com'); // Lowercase
    expect(body.fullName).toBe('Omar Sabry'); // Capitalized
    expect(body.bio).toBe('this is a long description for bio.'); // Lowercase
    expect(body.city).toBe('New York City'); // Capitalized
    expect(body.birthDate).toBeDefined(); // Transformed to Date string
  });

  it('should fail validation with invalid data', async () => {
    const invalidData = {
      username: '123_invalid', // Starts with number
      email: 'not-an-email',
      password: 'short',
      phone: '123',
      nid: '123', // Too short and wrong prefix
      website: 'not-url',
      fullName: 'O', // Too short
      title: 'T', // Too short
      bio: 'Short', // Too short
      age: 15, // Below 18
      isActive: 'not-bool',
      birthDate: 'invalid-date',
      role: 'SUPER_ADMIN', // Not in enum
      uuid: 'short',
      city: 'Cairo123' // Contains numbers
    };

    const response = await request(app.getHttpServer())
      .post('/test/validate')
      .send(invalidData)
      .expect(400);

    const messages = response.body.message;
    
    expect(messages).toContain('Username must start with a letter and contain only letters, numbers, or underscores');
    expect(messages).toContain('Must be a valid email address');
    expect(messages).toContain('Password must be between 8 and 16 characters');
    expect(messages).toContain('Phone number must be a valid EG number');
    expect(messages).toContain('National ID must be exactly 14 digits');
    expect(messages).toContain('Must be a valid url address');
    expect(messages).toContain('Full Name must be between 2 and 100 characters');
    expect(messages).toContain('Title must be between 3 and 20 characters');
    expect(messages).toContain('Bio must be between 10 and 2000 characters');
    expect(messages).toContain('Age must be at least 18');
    expect(messages).toContain('Must be a boolean value');
    expect(messages).toContain('Birth Date must be a valid date');
    expect(messages).toContain('Must be a valid Role');
    expect(messages).toContain('User ID must be exactly 26 characters');
    expect(messages).toContain('City must contain only letters (no numbers or symbols)');
  });

  it('should detect SQL injection in E2E flow', async () => {
    const maliciousData = {
      username: 'omar',
      email: 'omar@example.com',
      password: 'P@ssword123',
      phone: '+201012345678',
      nid: '29901011234567',
      website: 'https://google.com',
      fullName: 'omar sabry',
      title: 'Developer',
      bio: 'Safe bio',
      age: 25,
      isActive: true,
      birthDate: '1999-01-01',
      role: 'ADMIN',
      uuid: '12345678901234567890123456',
      city: 'SELECT * FROM users' // Malicious
    };

    const response = await request(app.getHttpServer())
      .post('/test/validate')
      .send(maliciousData)
      .expect(400);

    expect(response.body.message).toContain('City contains forbidden SQL keywords or patterns');
  });
});
