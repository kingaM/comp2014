#include <MyServer.h>
#include <WiFi.h>

WiFiServer server(80);
MyServer myServer("virginmedia6048706", "ehfekscx");
int reedOpenPin = 8;
int reedClosePin = 9;
boolean currentOpen = LOW;
boolean currentClose = LOW;
boolean lastOpen = LOW;
boolean lastClose = LOW;
int openState = 1;
int closeState = 0;

//VARS
//the time we give the sensor to calibrate (10-60 secs according to the datasheet)
int calibrationTime = 30;        

//the time when the sensor outputs a low impulse
long unsigned int lowIn;         

//the amount of milliseconds the sensor has to be low 
//before we assume all motion has stopped
long unsigned int pause = 1000;  

boolean lockLow = true;
boolean takeLowTime;  

int pir1Pin = 8;    //the digital pin connected to the PIR sensor's output
int pir2Pin = 8;    //the digital pin connected to the PIR sensor's output

void handleCommand(WiFiClient client, char* cmd) {
  if (strcmp(cmd, "status") == 0) {
    Serial.println(currentOpen);
    Serial.println(currentClose);
    getStatus(client);
  } 
  else {
    myServer.send404(client);
  }  
}

void getStatus(WiFiClient client) {
  if (currentOpen == 1 && currentClose == 0) {
    myServer.sendStatus(client, "{status : 1}");
  } 
  else {
    myServer.sendStatus(client, "{status : 0}");
  }
}

boolean debounce(boolean last, int pin)
{
  boolean current = digitalRead(pin);
  delay(5);
  current = digitalRead(pin);
  return current;
}

void setup() {
  //myServer.setupWifi();
  //server.begin();
  //myServer.printWifiStatus();
  Serial.begin(9600);
  pinMode(reedOpenPin, INPUT);
  pinMode(reedClosePin, INPUT);
  pinMode(pir1Pin, INPUT);
  digitalWrite(pir1Pin, LOW);
  pinMode(pir2Pin, INPUT);
  digitalWrite(pir2Pin, LOW);
  //give the sensor some time to calibrate
  Serial.print("calibrating sensor ");
  for(int i = 0; i < calibrationTime; i++){
    Serial.print(".");
    delay(1000);
  }
  Serial.println(" done");
  Serial.println("SENSOR ACTIVE");
  delay(50);
}

void respondToRequest() {

  WiFiClient client = server.available();
  if (client) {
    boolean currentLineIsBlank = true;
    while (client.connected()) {
      if (client.available()) {
        char c = myServer.readClient(client);
        int nSegments = myServer.countSegments();
        char **pathsegments = myServer.parse();
        //        Serial.print("===");
        //  Serial.print(c);
        //  Serial.println("===");]
        Serial.print("Num of segments: ");
        Serial.println(nSegments);
        int i = 0;
        for(i=0; i<nSegments; i++) {
          Serial.print(i);
          Serial.print("==");
          Serial.println(pathsegments[i]);
        }
        if (c == '\n' && currentLineIsBlank) {
          Serial.println(pathsegments[0]);
          handleCommand(client, pathsegments[0]);     
        }
        if (c == '\n' || c == '\r') {
          currentLineIsBlank = true;
        } 
        else if (c != '\r') {
          currentLineIsBlank = false;
        }
      }
    }
    delay(1);
    client.stop();
    Serial.println("Client disonnected");
  }
}

int pir(int pirPin) {
  if(digitalRead(pirPin) == HIGH){
    delay(50);
    return 1;      
  }

  if(digitalRead(pirPin) == LOW){       
    delay(50);
    return 0;
  }
}

void loop() {
  //respondToRequest();
  currentOpen = debounce(lastOpen, reedOpenPin);
  currentClose = debounce(lastClose, reedClosePin);
  if (currentOpen == LOW) {
    openState = 0;
  } 
  else {
    openState = 1;
  }
  if (currentClose == LOW) {
    closeState = 0;
  } 
  else {
    closeState = 1;
  }
  lastOpen = currentOpen;
  lastClose = currentClose;
  Serial.print("Open: ");
  Serial.println(currentOpen);
  Serial.print("Close: ");
  Serial.println(currentClose);
  if (currentOpen == 1 && currentClose == 0) {
    Serial.println("{status : 1}");
  } 
  else {
    Serial.println("{status : 0}");
  }
  if (pir(pir1Pin) == 1 || pir(pir2Pin) == 1) {
    Serial.println("Motion Detected"); 
  }
  delay(1000);
}







