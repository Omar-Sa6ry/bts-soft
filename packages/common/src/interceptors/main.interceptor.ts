import { GeneralResponseInterceptor } from './generalResponse.interceptor';
import { SqlInjectionInterceptor } from './sqlInjection.interceptor';
import { ClassSerializerInterceptor, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const setupInterceptors = (app: INestApplication): void => {
  const reflector = new Reflector();

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new SqlInjectionInterceptor(),
    new GeneralResponseInterceptor(),
  );
};
