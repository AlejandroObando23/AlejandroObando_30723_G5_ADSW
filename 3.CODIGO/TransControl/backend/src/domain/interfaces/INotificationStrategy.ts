export interface INotificationStrategy {
  send(to: string, message: string): Promise<void>;
}
