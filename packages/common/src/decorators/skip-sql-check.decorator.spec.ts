import "reflect-metadata";
import { SkipSqlCheck, SKIP_SQL_CHECK_KEY } from "./skip-sql-check.decorator";

describe("SkipSqlCheck Decorator", () => {
  it("should define SKIP_SQL_CHECK_KEY", () => {
    expect(SKIP_SQL_CHECK_KEY).toBe("skipSqlCheck");
  });

  it("should set metadata to true on method", () => {
    class TestController {
      @SkipSqlCheck()
      testMethod() {}
    }

    const controller = new TestController();
    const skipSqlCheck = Reflect.getMetadata(SKIP_SQL_CHECK_KEY, controller.testMethod);
    expect(skipSqlCheck).toBe(true);
  });

  it("should set metadata to true on class", () => {
    @SkipSqlCheck()
    class TestController {}

    const skipSqlCheck = Reflect.getMetadata(SKIP_SQL_CHECK_KEY, TestController);
    expect(skipSqlCheck).toBe(true);
  });
});
