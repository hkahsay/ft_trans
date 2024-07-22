
export class gameSocket {
  static instance = null;
  ws = null;
  data = null;
  callbacks = {};
  socketUrl = null;

    constructor(socketUrl) {
        this.socketUrl = socketUrl;
    }

  connect() {
      return new Promise((resolve, reject) => {
          if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
            this.ws = new WebSocket(this.socketUrl);

              this.ws.onopen = () => {
                  console.log(`gameSocket connected to ${this.socketUrl}`);
                  resolve();
              };

              this.ws.onerror = (error) => {
                  console.error(`An error occurred connecting to ${this.socketUrl}`, error);
                  reject(error);
              };

              this.ws.onmessage = (e) => {
                  this.processMessage(e.data);
              };

              this.ws.onclose = (e) => {
                  console.log(`gameSocket disconnected from ${this.socketUrl} with code ${e.code}`);
              };
          } else {
              resolve();
          }
      });
  }

  processMessage(data) {
    //   console.log("event received from server :");
      const event = JSON.parse(data);
    //   console.log(data);
      const action = event.action;
      if (this.callbacks[action]) {
            this.callbacks[action].forEach(callback => {
                callback(event);
            });
      }
  }

  addCallback(action, callback) {
      if (!this.callbacks[action]) {
          this.callbacks[action] = [];
      }
      this.callbacks[action].push(callback);
  }

  sendMessage(data) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        //   console.log("sending event : ", JSON.stringify(data));
      } else {
          console.error('gameSocket is not connected.');
      }
  }
}
