import { Public, IS_PUBLIC_KEY } from './public.decorator';

describe('Public Decorator', () => {
  it('should set IS_PUBLIC_KEY metadata to true', () => {
    class TestController {
      @Public()
      testMethod() {}
    }

    const controller = new TestController();
    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.testMethod);
    expect(isPublic).toBe(true);
  });
});
