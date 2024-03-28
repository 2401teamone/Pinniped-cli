export default class CommandHandler {
  constructor(command, proceedMsg, cancelMsg, endMsg) {
    this.command = command;
    this.proceedMsg = proceedMsg;
    this.cancelMsg = cancelMsg;
    this.endMsg = endMsg;
  }
}
