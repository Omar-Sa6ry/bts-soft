import { GeneralResponseInterceptor } from "./generalResponse.interceptor";
import { SqlInjectionInterceptor } from "./sqlInjection.interceptor";
import { ClassSerializerInterceptor, INestApplication } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export const setupInterceptors = (app: INestApplication): void => {
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new SqlInjectionInterceptor(),
    new GeneralResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector))
  );
};
