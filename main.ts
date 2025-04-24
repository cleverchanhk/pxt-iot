enum HttpMethod {
    GET,
    POST,
    PUT,
    HEAD,
    DELETE,
    PATCH,
    OPTIONS,
    CONNECT,
    TRACE
}

/**
 * IoT commands.
 */
//% color=#34c3a2 icon="\uf1eb" block="IoT"
namespace iot {

    let isWifiConnected = false
    /**
     * Make a serial connection between micro:bit and ESP8266.
     */
    //% block="connect to ESP8266|TX %txPin|RX %rxPin|Baud rate %baudrate|SSID = %ssid|Password = %passwd"
    //% txPin.defl=SerialPin.P15
    //% rxPin.defl=SerialPin.P1
    //% baudRate.defl=BaudRate.BaudRate115200
    export function initialize_ESP8266(txPin: SerialPin, rxPin: SerialPin, baudRate: BaudRate, ssid: string, passwd: string): void {
        let result = 0

        isWifiConnected = false

        serial.redirect(
            txPin,
            rxPin,
            baudRate
        )
        sendAtCmd("AT")
        result = waitAtResponse("OK", "ERROR", "None", 1000)

        sendAtCmd("AT+CWMODE=1")
        result = waitAtResponse("OK", "ERROR", "None", 1000)

        sendAtCmd(`AT+CWJAP="${ssid}","${passwd}"`)
        result = waitAtResponse("WIFI GOT IP", "ERROR", "None", 20000)

        if (result == 1) {
            isWifiConnected = true
        }
    }

    /**
     * Check if it is connected to Wifi
     */
    //% block="Wifi OK?"
    export function wifiOK() {
        return isWifiConnected
    }

    /**
     * Execute HTTP method.
     * @param method HTTP method, eg: HttpMethod.GET
     * @param host Host, eg: "google.com"
     * @param port Port, eg: 80
     * @param urlPath Path, eg: "/api/search?q=something"
     * @param parameter_name_1 Name of paramter 1
     * @param parameter_1 Value of paramter 1
     * @param parameter_name_2 Name of paramter 2
     * @param parameter_2 Value of paramter 2
     */
    //% block="execute HTTP method %method|host: %host|port: %port|path: %urlPath||parameter_name_1: %parameter_name_1|parameter_1: %parameter_1|parameter_name_2: %parameter_name_2|parameter_2: %parameter_2"
    export function executeHttpMethod(method: HttpMethod, host: string, port: number, urlPath: string, parameter_name_1?: string, parameter_1?: number, parameter_name_2?: string, parameter_2?: number): void {
        let result = 0
        let retry = 2

        let myMethod: string
        switch (method) {
            case HttpMethod.GET: myMethod = "GET"; break;
            case HttpMethod.POST: myMethod = "POST"; break;
            case HttpMethod.PUT: myMethod = "PUT"; break;
            case HttpMethod.HEAD: myMethod = "HEAD"; break;
            case HttpMethod.DELETE: myMethod = "DELETE"; break;
            case HttpMethod.PATCH: myMethod = "PATCH"; break;
            case HttpMethod.OPTIONS: myMethod = "OPTIONS"; break;
            case HttpMethod.CONNECT: myMethod = "CONNECT"; break;
            case HttpMethod.TRACE: myMethod = "TRACE";
        }

        // close the previous TCP connection
        if (isWifiConnected) {
            sendAtCmd("AT+CIPCLOSE")
            waitAtResponse("OK", "ERROR", "None", 2000)
        }

        while (isWifiConnected && retry > 0) {
            retry = retry - 1;
            // Establish TCP connection:
            sendAtCmd("AT+CIPSTART=\"TCP\",\"" + host + "\"," + port.toString())
            result = waitAtResponse("OK", "ALREADY CONNECTED", "ERROR", 2000)
            if (result == 3) continue
            let data = myMethod + " " + urlPath
            if (parameter_name_1 && parameter_name_1.length > 0) {
                data += "&" + parameter_name_1 + "=" + parameter_1.toString()
            }
            if (parameter_name_2 && parameter_name_2.length > 0) {
                data += "&" + parameter_name_2 + "=" + parameter_2.toString()
            }
            data += " HTTP/1.1" + "\u000D" + "\u000A"
                + "Host: " + host + "\u000D" + "\u000A"
            // Send data:
            sendAtCmd("AT+CIPSEND=" + (data.length + 2))
            result = waitAtResponse(">", "OK", "ERROR", 2000)
            if (result == 3) continue
            sendAtCmd(data)
            result = waitAtResponse("SEND OK", "SEND FAIL", "ERROR", 5000)

            // close the TCP connection
            sendAtCmd("AT+CIPCLOSE")
            waitAtResponse("OK", "ERROR", "None", 2000)

            if (result == 1) break
        }
    }

    function waitAtResponse(target1: string, target2: string, target3: string, timeout: number) {
        let buffer = ""
        let start = input.runningTime()

        while ((input.runningTime() - start) < timeout) {
            buffer += serial.readString()

            if (buffer.includes(target1)) return 1
            if (buffer.includes(target2)) return 2
            if (buffer.includes(target3)) return 3

            basic.pause(100)
        }

        return 0
    }

    function sendAtCmd(cmd: string) {
        serial.writeString(cmd + "\u000D\u000A")
    }
}
