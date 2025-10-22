

class WebSLCAN {
    static canSpeed = Object.freeze({
        _10K: 0,
        _20K: 1,
        _50K: 2,
        _100K: 3,
        _125K: 4,
        _250K: 5,
        _500K: 6,
        _750K: 7,
        _1M: 8
    });

    constructor() {
        this.isConnected = false
        this.port = null
        this.reader = null
        this.writer = null
        this.baudRate = 115200
        this.leftOver = '';

        this.onConnectCallback = null;
        this.onDisconnectCallback = null;
        this.onMessageCallback = null;
    }

    async connect(baudRate = 115200) {
        try {
            // Request a port and open a connection
            this.port = await navigator.serial.requestPort();
            this.baudRate = baudRate
    
            await this.port.open({ baudRate: baudRate });

            this.reader = this.port.readable.getReader();
            this.writer = this.port.writable.getWriter();
    
            if (this.port.connected) {
                this.isConnected = true;
                if(this.onConnectCallback) {
                    this.onConnectCallback();
                }
            }
    
            this.processSerialData();
            
        } catch (err) {
            this.isConnected = false;
            if(this.onDisconnectCallback) {
                this.onDisconnectCallback();
            }
            console.log(`Error connecting: ${err.message}`);
        }
    }

    async disconnect() {
        if (this.reader) {
            await this.reader.cancel();
            this.reader.releaseLock();
            this.reader = null;
        }
        if (this.writer) {
            await this.writer.close();
            this.writer.releaseLock();
            this.writer = null;
        }
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
        this.isConnected = false;
        if(this.onDisconnectCallback) {
            this.onDisconnectCallback();
        }
    }

    async open(speed) {
        if(!this.isConnected) {
            throw Error("Not connected to serial port");
        }   
        switch (speed) {
            case WebSLCAN.canSpeed._10K:
                await this.writer.write(new TextEncoder().encode("S0\r"));
                break;
            case WebSLCAN.canSpeed._20K:
                await this.writer.write(new TextEncoder().encode("S1\r"));
                break;
            case WebSLCAN.canSpeed._50K:
                await this.writer.write(new TextEncoder().encode("S2\r"));
                break;
            case WebSLCAN.canSpeed._100K:
                await this.writer.write(new TextEncoder().encode("S3\r"));
                break;
            case WebSLCAN.canSpeed._125K:
                await this.writer.write(new TextEncoder().encode("S4\r"));
                break;
            case WebSLCAN.canSpeed._250K:
                await this.writer.write(new TextEncoder().encode("S5\r"));
                break;
            case WebSLCAN.canSpeed._500K:
                await this.writer.write(new TextEncoder().encode("S6\r"));
                break;
            case WebSLCAN.canSpeed._750K:
                await this.writer.write(new TextEncoder().encode("S7\r"));
                break;
            case WebSLCAN.canSpeed._1M:
                await this.writer.write(new TextEncoder().encode("S8\r"));
                break;
            default:
                throw Error("Invalid CAN speed");
        }
        // Open the CAN channel
        await this.writer.write(new TextEncoder().encode("O\r"));
    }

    async close() {
        if(!this.isConnected) {
            throw Error("Not connected to serial port");
        }   
        // Close the CAN channel
        await this.writer.write(new TextEncoder().encode("C\r"));
    }

    setOnConnectCallback(callback) {
        this.onConnectCallback = callback;
    }

    setOnDisconnectCallback(callback) {
        this.onDisconnectCallback = callback;
    }

    setOnMessageCallback(callback) {
        this.onMessageCallback = callback;
    }

    async sendSingleFrame(ID, Data) {
        if(!this.isConnected) {
            throw Error("Not connected to serial port");
        }

        if (ID > 0x7FF) {
            throw Error("ID exceeds standard frame limit of 0x7FF");
        }
    
        if (Data.length > 8) {
            throw Error("Data length exceeds 8 bytes for standard frame");
        }
    
        let toSend = 't';
        toSend += ID.toString(16).toUpperCase().padStart(3, '0');
        toSend += Data.length;
        toSend += this.bytesToHex(Data);
        toSend += '\r';
    
        await this.writer.write(new TextEncoder().encode(toSend));
    }

    receiveFrame(text) {
        let frameID = Number(`0x${text.substr(0, 3)}`);
        let payloadLength = Number(text.substr(3, 1));
        let payload = this.hexToBytes(text.substr(4));
    
        console.log(`Received frame ID: ${frameID.toString(16)}, length: ${payloadLength}, payload: ${payload}`);
    
        if (payloadLength !== payload.length) {
          throw Error(`Wrong length for received frame: ${text}`);
        }

        if(this.onMessageCallback) {
            this.onMessageCallback(frameID, payload);
        }
      }

    async processSerialData() {
        const decoder = new TextDecoder();
        while (this.port.readable) {
            try {
              while (true) {
                const { value, done } = await this.reader.read();
                if (done) {
                  break;
                }
                let s = decoder.decode(value);
                this.processPacketSLCAN(s);
              }
            } catch (error) {
                console.log(`Wrong length for received frame: ${error}`);
            } finally {
              this.reader.releaseLock();
              break;
            }
        }
    }


    processPacketSLCAN(string) {
        string = this.leftOver + string.replace(/\x07/g, '\x07\r');

        while (string.includes('\r')) {
            let position = string.indexOf('\r');
            let currentString = string.substring(0, position);
            string = string.substring(position + 1);
            let type = currentString.charAt(0);

            switch (type) {
                case 'T':
                    // Type 'T' indicates an extended frame
                    try {
                        this.receiveFrameExtId(currentString.substring(1));
                    } catch (e) {
                        console.log(e);
                    }
                    break;
                case 't':
                    // Type 't' indicates a standard frame
                    try {
                        this.receiveFrame(currentString.substring(1));
                    } catch (e) {
                        console.log(e);
                    }
                    break;
                case '':
                    console.log('Received carriage return');
                    break;
                case '\u0007':
                    console.log('Received ERROR');
                    break;
                default:
                    console.log(`Unknown type of frame: "${currentString}"`);
            }

        }
        this.leftOver = string;
    }

    hexToBytes(text) {
        return text
          .split(/(..)/)
          .filter((value) => value)
          .map((value) => Number(`0x${value}`));
      }
    
    bytesToHex(bytes) {
        let text = '';
        for (let byte of bytes) {
          text += Number(byte & 255)
            .toString(16)
            .padStart(2, '0');
        }
        return text;
      }



}