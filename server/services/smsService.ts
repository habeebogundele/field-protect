import { storage } from "../storage";

// SMS Service for sending field access notifications
export class SmsService {
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private fromNumber: string | undefined;
  private isEnabled: boolean;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.isEnabled = Boolean(this.accountSid && this.authToken && this.fromNumber);
    
    if (!this.isEnabled) {
      console.warn('SMS notifications disabled - missing Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
    }
  }

  async sendAccessRequestNotification(ownerUserId: string, requesterName: string, fieldName: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('SMS disabled - would send access request notification to owner');
      return false;
    }

    try {
      const owner = await storage.getUser(ownerUserId);
      if (!owner?.phoneNumber) {
        console.log(`Owner ${ownerUserId} has no phone number - cannot send SMS`);
        return false;
      }

      const message = `🌾 FieldShare: ${requesterName} has requested access to your field "${fieldName}". Visit your Adjacent Fields page to approve or deny this request.`;
      
      await this.sendSms(owner.phoneNumber, message);
      console.log(`Access request SMS sent to ${owner.phoneNumber}`);
      return true;
    } catch (error) {
      console.error('Failed to send access request SMS:', error);
      return false;
    }
  }

  async sendRequestResponseNotification(requesterUserId: string, ownerName: string, fieldName: string, approved: boolean): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('SMS disabled - would send request response notification');
      return false;
    }

    try {
      const requester = await storage.getUser(requesterUserId);
      if (!requester?.phoneNumber) {
        console.log(`Requester ${requesterUserId} has no phone number - cannot send SMS`);
        return false;
      }

      const status = approved ? 'APPROVED' : 'DENIED';
      const emoji = approved ? '✅' : '❌';
      const message = `${emoji} FieldShare: ${ownerName} has ${status} your access request for field "${fieldName}".${approved ? ' You can now view this field in your dashboard.' : ''}`;
      
      await this.sendSms(requester.phoneNumber, message);
      console.log(`Request response SMS sent to ${requester.phoneNumber}`);
      return true;
    } catch (error) {
      console.error('Failed to send request response SMS:', error);
      return false;
    }
  }

  private async sendSms(to: string, body: string): Promise<void> {
    if (!this.isEnabled || !this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error('SMS service not properly configured');
    }

    // Use Twilio REST API directly
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: this.fromNumber,
        To: to,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${response.status} ${error}`);
    }

    const result = await response.json();
    console.log(`SMS sent successfully: ${result.sid}`);
  }
}

export const smsService = new SmsService();