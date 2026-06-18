import { INotificationStrategy } from '../../domain/interfaces/INotificationStrategy';

export class EmailNotificationStrategy implements INotificationStrategy {
  async send(to: string, message: string): Promise<void> {
    // Simular el envío mediante logs
    console.log(`[Email] Sending to ${to}: ${message}`);
  }
}

export class PushNotificationStrategy implements INotificationStrategy {
  async send(to: string, message: string): Promise<void> {
    console.log(`[Push] Sending to ${to}: ${message}`);
  }
}

export class SmsNotificationStrategy implements INotificationStrategy {
  async send(to: string, message: string): Promise<void> {
    console.log(`[SMS] Sending to ${to}: ${message}`);
  }
}
