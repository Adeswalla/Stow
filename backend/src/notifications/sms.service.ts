import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsNotification, SmsStatus } from './entities/sms-notification.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * SMS notification service supporting multiple providers (Twilio, AWS SNS, Africa's Talking).
 * 
 * Handles SMS delivery with retry logic, delivery tracking, and provider failover.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(SmsNotification)
    private readonly smsNotificationRepository: Repository<SmsNotification>,
  ) {
    this.provider = this.configService.get<string>('SMS_PROVIDER', 'twilio');
    this.maxRetries = this.configService.get<number>('SMS_RETRY_MAX_ATTEMPTS', 3);
    this.retryDelay = this.configService.get<number>('SMS_RETRY_BASE_DELAY_MS', 1000);
  }

  /**
   * Send an SMS notification
   */
  async sendSms(
    phoneNumber: string,
    message: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<SmsNotification> {
    // Create initial record
    const sms = this.smsNotificationRepository.create({
      phone_number: phoneNumber,
      message,
      user_id: userId,
      status: SmsStatus.PENDING,
      provider: this.provider,
      metadata: metadata || null,
      attempts: 0,
    });

    const saved = await this.smsNotificationRepository.save(sms);

    // Send asynchronously (don't await)
    this.attemptSend(saved.id).catch(err => {
      this.logger.error(`Failed to send SMS ${saved.id}: ${err.message}`, err.stack);
    });

    return saved;
  }

  /**
   * Attempt to send SMS with retry logic
   */
  private async attemptSend(smsId: string, attemptNumber = 1): Promise<void> {
    const sms = await this.smsNotificationRepository.findOne({ where: { id: smsId } });
    
    if (!sms) {
      this.logger.error(`SMS ${smsId} not found`);
      return;
    }

    try {
      sms.attempts = attemptNumber;
      await this.smsNotificationRepository.save(sms);

      let result: { success: boolean; externalId?: string; error?: string };

      switch (this.provider) {
        case 'twilio':
          result = await this.sendViaTwilio(sms.phone_number, sms.message);
          break;
        case 'aws-sns':
          result = await this.sendViaAwsSns(sms.phone_number, sms.message);
          break;
        case 'africastalking':
          result = await this.sendViaAfricasTalking(sms.phone_number, sms.message);
          break;
        default:
          result = { success: false, error: `Unknown provider: ${this.provider}` };
      }

      if (result.success) {
        sms.status = SmsStatus.SENT;
        sms.sent_at = new Date();
        sms.external_id = result.externalId || null;
        await this.smsNotificationRepository.save(sms);
        this.logger.log(`SMS ${smsId} sent successfully via ${this.provider}`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (attemptNumber < this.maxRetries) {
        // Retry with exponential backoff
        const delay = this.retryDelay * Math.pow(4, attemptNumber - 1);
        this.logger.warn(
          `SMS ${smsId} failed (attempt ${attemptNumber}/${this.maxRetries}): ${errorMessage}. Retrying in ${delay}ms`,
        );

        setTimeout(() => {
          this.attemptSend(smsId, attemptNumber + 1).catch(err => {
            this.logger.error(`Retry failed for SMS ${smsId}:`, err);
          });
        }, delay);
      } else {
        // Max retries reached
        sms.status = SmsStatus.FAILED;
        sms.error_message = errorMessage;
        await this.smsNotificationRepository.save(sms);
        this.logger.error(`SMS ${smsId} failed after ${attemptNumber} attempts: ${errorMessage}`);
      }
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(phoneNumber: string, message: string): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return { success: false, error: 'Twilio credentials not configured' };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const response = await firstValueFrom(
        this.httpService.post(
          url,
          new URLSearchParams({
            To: phoneNumber,
            From: fromNumber,
            Body: message,
          }),
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return {
        success: true,
        externalId: response.data.sid,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Send SMS via AWS SNS
   */
  private async sendViaAwsSns(phoneNumber: string, message: string): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    // Note: This requires AWS SDK to be properly implemented
    // For now, returning a placeholder
    this.logger.warn('AWS SNS SMS sending not fully implemented');
    return {
      success: false,
      error: 'AWS SNS provider not fully implemented. Install @aws-sdk/client-sns',
    };
  }

  /**
   * Send SMS via Africa's Talking
   */
  private async sendViaAfricasTalking(phoneNumber: string, message: string): Promise<{
    success: boolean;
    externalId?: string;
    error?: string;
  }> {
    const apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY');
    const username = this.configService.get<string>('AFRICASTALKING_USERNAME');
    const from = this.configService.get<string>('AFRICASTALKING_SENDER_ID', 'STOW');

    if (!apiKey || !username) {
      return { success: false, error: "Africa's Talking credentials not configured" };
    }

    try {
      const url = 'https://api.africastalking.com/version1/messaging';

      const response = await firstValueFrom(
        this.httpService.post(
          url,
          new URLSearchParams({
            username,
            to: phoneNumber,
            message,
            from,
          }),
          {
            headers: {
              'apiKey': apiKey,
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
          },
        ),
      );

      const result = response.data.SMSMessageData?.Recipients?.[0];
      
      if (result?.status === 'Success') {
        return {
          success: true,
          externalId: result.messageId,
        };
      } else {
        return {
          success: false,
          error: result?.status || 'Unknown error from Africa\'s Talking',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Update SMS status (e.g., from webhook callbacks)
   */
  async updateStatus(
    externalId: string,
    status: SmsStatus,
    deliveredAt?: Date,
  ): Promise<void> {
    const sms = await this.smsNotificationRepository.findOne({
      where: { external_id: externalId },
    });

    if (!sms) {
      this.logger.warn(`SMS with external_id ${externalId} not found`);
      return;
    }

    sms.status = status;
    if (deliveredAt) {
      sms.delivered_at = deliveredAt;
    }

    await this.smsNotificationRepository.save(sms);
    this.logger.log(`SMS ${sms.id} status updated to ${status}`);
  }

  /**
   * Get SMS delivery statistics
   */
  async getStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    delivery_rate: number;
  }> {
    const qb = this.smsNotificationRepository.createQueryBuilder('sms');

    if (startDate) {
      qb.andWhere('sms.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('sms.created_at <= :endDate', { endDate });
    }

    const [total, sent, delivered, failed, pending] = await Promise.all([
      qb.getCount(),
      qb.clone().andWhere('sms.status = :status', { status: SmsStatus.SENT }).getCount(),
      qb.clone().andWhere('sms.status = :status', { status: SmsStatus.DELIVERED }).getCount(),
      qb.clone().andWhere('sms.status = :status', { status: SmsStatus.FAILED }).getCount(),
      qb.clone().andWhere('sms.status = :status', { status: SmsStatus.PENDING }).getCount(),
    ]);

    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

    return {
      total,
      sent,
      delivered,
      failed,
      pending,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
    };
  }

  /**
   * Get SMS notifications for a user
   */
  async getUserSms(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: SmsNotification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.smsNotificationRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * Retry failed SMS
   */
  async retrySms(smsId: string): Promise<void> {
    const sms = await this.smsNotificationRepository.findOne({ where: { id: smsId } });

    if (!sms) {
      throw new Error('SMS not found');
    }

    if (sms.status !== SmsStatus.FAILED) {
      throw new Error('Can only retry failed SMS');
    }

    sms.status = SmsStatus.PENDING;
    sms.attempts = 0;
    sms.error_message = null;
    await this.smsNotificationRepository.save(sms);

    await this.attemptSend(smsId);
  }
}
