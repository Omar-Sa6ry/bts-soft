import { Injectable, Logger } from "@nestjs/common";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { IMailProvider } from "../interfaces/mail-provider.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

@Injectable()
export class SesMailProvider implements IMailProvider {
  private defaultClient?: SESClient;
  private readonly logger = new Logger(SesMailProvider.name);

  constructor(private readonly configService: NotificationConfigService) {
    this.initializeDefaultClient();
  }

  private initializeDefaultClient() {
    const accessKeyId = this.configService.awsSesAccessKeyId;
    const secretAccessKey = this.configService.awsSesSecretAccessKey;
    const region = this.configService.awsSesRegion;

    const config: any = {};
    if (region) {
      config.region = region;
    }
    if (accessKeyId && secretAccessKey) {
      config.credentials = { accessKeyId, secretAccessKey };
    }

    try {
      this.defaultClient = new SESClient(config);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      this.logger.warn(`Failed to initialize default SES client: ${err.message}`);
    }
  }

  public async send(message: NotificationMessage, sender: string): Promise<void> {
    const { recipientId: to, body, subject, channelOptions } = message;

    if (!to) throw new NotificationClientError("Email recipientId (email address) is required.");
    if (!subject) throw new NotificationClientError("Email subject is required in the NotificationMessage.");

    let clientToUse = this.defaultClient;

    if (channelOptions?.awsAccessKeyId && channelOptions?.awsSecretAccessKey) {
      this.logger.debug("Using dynamic AWS credentials for SES.");
      clientToUse = new SESClient({
        region: (channelOptions.awsRegion as string) || this.configService.awsSesRegion,
        credentials: {
          accessKeyId: channelOptions.awsAccessKeyId as string,
          secretAccessKey: channelOptions.awsSecretAccessKey as string,
        },
      });
    } else if (channelOptions?.awsRegion && clientToUse) {
      this.logger.debug("Using dynamic AWS region for SES.");
      clientToUse = new SESClient({
        region: channelOptions.awsRegion as string,
        ...(this.configService.awsSesAccessKeyId && this.configService.awsSesSecretAccessKey
          ? {
              credentials: {
                accessKeyId: this.configService.awsSesAccessKeyId,
                secretAccessKey: this.configService.awsSesSecretAccessKey,
              },
            }
          : {}),
      });
    }

    if (!clientToUse) {
      throw new NotificationProviderError("AWS SES client is not initialized and no credentials were provided.");
    }

    const isHtml = /<[a-z][\s\S]*>/i.test(body);
    const htmlContent = (channelOptions?.htmlTemplate as string | undefined) || (isHtml ? body : undefined);
    const textContent = isHtml ? body.replace(/<[^>]*>?/gm, '') : body;

    const command = new SendEmailCommand({
      Source: sender,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: textContent,
            Charset: "UTF-8",
          },
          ...(htmlContent
            ? {
                Html: {
                  Data: htmlContent,
                  Charset: "UTF-8",
                },
              }
            : {}),
        },
      },
    });

    this.logger.log(`Sending email from ${sender} to ${to} via AWS SES | Subject: "${subject}"`);

    try {
      await clientToUse.send(command);
      this.logger.log(`Email sent successfully to ${to} via AWS SES`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to send email to ${to} via AWS SES:`, err);

      const awsError = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      const statusCode = awsError.$metadata?.httpStatusCode;

      if (
        awsError.name === "MessageRejected" ||
        awsError.name === "InvalidParameterValueException" ||
        (statusCode && statusCode >= 400 && statusCode < 500 && awsError.name !== "ThrottlingException")
      ) {
        throw new NotificationClientError(`AWS SES client error: ${err.message}`);
      }

      throw new NotificationProviderError(`AWS SES provider error: ${err.message}`);
    }
  }
}
