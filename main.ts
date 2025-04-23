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
//% color=#34c3a2 weight=90 icon="\uf1eb" block="IoT"
namespace IoT {

    function writeToSerial(data: string, waitTime: number): void {
        serial.writeString(data + "\u000D" + "\u000A")
        if (waitTime > 0) {
            basic.pause(waitTime)
        }
    }

    let pauseBaseValue: number = 1000

    /**
     * Change HTTP method wait period.
     * @param newPauseBaseValue Base value, eg: 1000
     */
    //% weight=1
    export function changeHttpMethodWaitPeriod(newPauseBaseValue: number): void {
        pauseBaseValue = newPauseBaseValue
    }

    let isWifiConnected = false
    /**
     * Make a serial connection between micro:bit and ESP8266.
     */
    /**
    //% blockId="ESP8266_connect" block="connect to ESP8266|TX %txPin|RX %rxPin|Baud rate %baudrate|SSID = %ssid|Password = %passwd"
    //% txPin.defl=SerialPin.P15
    //% rxPin.defl=SerialPin.P1
    //% baudRate.defl=BaudRate.BaudRate115200
    //% weight=100
    */
    export function Initialize_ESP8266(txPin: SerialPin, rxPin: SerialPin, baudRate: BaudRate, ssid: string, passwd: string): void {
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
     * Disconnect from WiFi network.
     */
    //% weight=98
    //% blockId="wfb_wifi_off" block="disconnect from WiFi network"
    export function disconnectFromWiFiNetwork(): void {
        // Disconnect from AP:
        writeToSerial("AT+CWQAP", 6000)
    }

    /**
     * Execute HTTP method.
     * @param method HTTP method, eg: HttpMethod.GET
     * @param host Host, eg: "google.com"
     * @param port Port, eg: 80
     * @param urlPath Path, eg: "api/search?q=something"
     * @param parameter_name_1 Name of paramter 1
     * @param parameter_1 Value of paramter 1
     * @param parameter_name_2 Name of paramter 2
     * @param parameter_2 Value of paramter 2
     */
    //% weight=96
    //% blockId="wfb_http" block="execute HTTP method %method|host: %host|port: %port|path: %urlPath||parameter_name_1: %parameter_name_1|parameter_1: %parameter_1|parameter_name_2: %parameter_name_2|parameter_2: %parameter_2"
    export function executeHttpMethod(method: HttpMethod, host: string, port: number, urlPath: string, parameter_name_1?: string, parameter_1?: number, parameter_name_2?: string, parameter_2?: number): void {
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
        // Establish TCP connection:
        let data: string = "AT+CIPSTART=\"TCP\",\"" + host + "\"," + port
        writeToSerial(data, pauseBaseValue * 6)
        data = myMethod + " " + urlPath
        if (parameter_name_1 && parameter_name_1.length > 0) {
            data += "&" + parameter_name_1 + "=" + parameter_1
        }

        data += " HTTP/1.1" + "\u000D" + "\u000A"
            + "Host: " + host + "\u000D" + "\u000A"
        // Send data:
        writeToSerial("AT+CIPSEND=" + (data.length + 2), pauseBaseValue * 3)
        writeToSerial(data, pauseBaseValue * 6)
        // Close TCP connection:
        writeToSerial("AT+CIPCLOSE", pauseBaseValue * 3)
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
