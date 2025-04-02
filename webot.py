from controller import Robot


TIME_STEP = 64

robot = Robot()

left_motor = robot.getDevice("motor.left")
right_motor = robot.getDevice("motor.right")

if left_motor is None or right_motor is None:
    print("Error: Motors not found! Check Webots Scene Tree.")
    exit()


left_motor.setPosition(float('inf'))
right_motor.setPosition(float('inf'))
left_motor.setVelocity(0.0)
right_motor.setVelocity(0.0)


proximity_sensors = []
sensor_names = [
    "prox.horizontal.0", "prox.horizontal.1", "prox.horizontal.2",
    "prox.horizontal.3", "prox.horizontal.4", "prox.horizontal.5", "prox.horizontal.6"
]
for name in sensor_names:
    sensor = robot.getDevice(name)
    sensor.enable(TIME_STEP)
    proximity_sensors.append(sensor)


ground_sensors = []
ground_sensor_names = ["prox.ground.0", "prox.ground.1"]
for name in ground_sensor_names:
    sensor = robot.getDevice(name)
    sensor.enable(TIME_STEP)
    ground_sensors.append(sensor)


button_names = ["button.left", "button.right", "button.forward", "button.backward", "button.center"]
buttons = {}
for name in button_names:
    button = robot.getDevice(name)
    button.enable(TIME_STEP)
    buttons[name] = button


accelerometer = robot.getDevice("acc")
accelerometer.enable(TIME_STEP)

leds = robot.getDevice("leds.circle")


def move_forward():
    left_motor.setVelocity(3.0)
    right_motor.setVelocity(3.0)

def move_backward():
    left_motor.setVelocity(-3.0)
    right_motor.setVelocity(-3.0)

def turn_left():
    left_motor.setVelocity(-2.0)
    right_motor.setVelocity(2.0)

def turn_right():
    left_motor.setVelocity(2.0)
    right_motor.setVelocity(-2.0)

def stop():
    left_motor.setVelocity(0.0)
    right_motor.setVelocity(0.0)


def obstacle_avoidance():
    front_values = [proximity_sensors[2].getValue(), proximity_sensors[3].getValue(), proximity_sensors[4].getValue()]
    
    if any(value > 200 for value in front_values):  # Obstacle detected
        stop()
        turn_left()
        return True
    return False


def identify_survivors():
    if any(sensor.getValue() > 800 for sensor in proximity_sensors):  
        print("Survivor Detected!")
        leds.set(0xFF0000) 
        return True
    return False


def deliver_aid():
    stop()
    print("Delivering Aid...")
    leds.set(0x00FF00)  
    robot.step(5000)  
    move_backward()
    robot.step(2000)
    return


def check_cliff():
    ground_values = [ground_sensors[0].getValue(), ground_sensors[1].getValue()]
    
    if any(value < 200 for value in ground_values):  
        print("Cliff Detected! Reversing...")
        leds.set(0xFFFF00)  
        move_backward()
        robot.step(1000)
        turn_right()
        robot.step(1000)
        return True
    return False


def check_acceleration():
    acc_values = accelerometer.getValues()
    
    if abs(acc_values[0]) > 5 or abs(acc_values[1]) > 5 or abs(acc_values[2]) > 5:
        print("Sudden movement detected! Stopping.")
        leds.set(0x0000FF)  
        stop()
        return True
    return False


def check_buttons():
    if buttons["button.center"].getValue() > 0:  
        print("Stopping Robot!")
        stop()
        return True
    return False


while robot.step(TIME_STEP) != -1:
    if check_buttons():  
        break
    if check_acceleration():  
    if check_cliff():  
        continue
    if obstacle_avoidance():  
        continue
    if identify_survivors(): 
        deliver_aid()
        continue
    
    move_forward() 
