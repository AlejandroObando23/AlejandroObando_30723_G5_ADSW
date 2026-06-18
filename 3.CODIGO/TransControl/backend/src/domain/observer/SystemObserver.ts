export interface ISystemObserver {
  update(event: string, data: any): void;
}

export class SystemSubject {
  private observers: ISystemObserver[] = [];

  attach(observer: ISystemObserver): void {
    const isExist = this.observers.includes(observer);
    if (isExist) {
      return console.log('Subject: Observer has been attached already.');
    }
    this.observers.push(observer);
  }

  detach(observer: ISystemObserver): void {
    const observerIndex = this.observers.indexOf(observer);
    if (observerIndex === -1) {
      return console.log('Subject: Nonexistent observer.');
    }
    this.observers.splice(observerIndex, 1);
  }

  notify(event: string, data: any): void {
    for (const observer of this.observers) {
      observer.update(event, data);
    }
  }
}
