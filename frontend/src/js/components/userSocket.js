
export class WebSocketService {
  static instance = null;
  ws = null;
  data = null;
  callbacks = {};
  socketUrl = "wss://localhost:8080/ws/users/chat/";

  static getInstance() {
      if (!this.instance) {
          this.instance = new WebSocketService();
      }
      return this.instance;
  }

  connect() {
      return new Promise((resolve, reject) => {
          // Check if WebSocket is already connected or in the process of connecting
          if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
              this.ws = new WebSocket(this.socketUrl);

              this.ws.onopen = () => {
                  console.log('WebSocket connected');
                  resolve();
              };

              this.ws.onerror = (error) => {
                  console.error('An error occurred', error);
                  reject(error);
              };

              this.ws.onmessage = (e) => {
                  this.processMessage(e.data);
              };

              this.ws.onclose = () => {
                  console.log('WebSocket disconnected');
              };
          } else {
              resolve();
          }
      });
  }

  
  processMessage(data) {
        const message = JSON.parse(data);

        const action = message.action;    
        if(!action) {
            console.error('Action is not defined in the message');
            return;
        }
        if (this.callbacks[action]) {
            this.callbacks[action].forEach(callback => { console.log('callbackfromusersocket',callback);
            callback(message.data)});

        }else {
            console.error(`No callback registered for action: ${action}`);
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
      } else {
          console.error('WebSocket is not connected.');
      }
  }
}
