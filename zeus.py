import requests
import json
import time
import random

API_BASE = "https://roverdata2-production.up.railway.app/api"
ROVER_SPEED = 5
OBSTACLE_THRESHOLD = 0.2
RECHARGE_START = 0.05
RECHARGE_END = 0.8
COMM_LOSS_THRESHOLD = 0.1
COMM_REGAIN_THRESHOLD = 0.1
INTERMITTENT_COMM_DELAY = 2
SENSOR_NOISE_LEVEL = 0.05

def simulate_sensor_noise(value):
    noise = random.uniform(-SENSOR_NOISE_LEVEL, SENSOR_NOISE_LEVEL) * value
    return value + noise

def simulate_comm_delay():
    time.sleep(random.uniform(0, INTERMITTENT_COMM_DELAY))

def check_battery_status(status):
    battery_level = status.get("battery_level", 1.0)
    if battery_level <= RECHARGE_START:
        print("Battery low, initiating recharge.")
        return True
    return False

def is_communication_lost(status):
    battery_level = status.get("battery_level", 1.0)
    if battery_level < COMM_LOSS_THRESHOLD:
        print("Communication lost due to low battery.")
        return True
    return False

def can_communicate(status):
    battery_level = status.get("battery_level", 1.0)
    if battery_level > COMM_REGAIN_THRESHOLD:
        print("Communication regained.")
        return True
    return False

def start_session():
    try:
        response = requests.post(f"{API_BASE}/session/start")
        response.raise_for_status()
        data = response.json()
        session_id = data.get("session_id")
        if session_id:
            print(f"Session started! Your session ID: {session_id}")
            return session_id
        else:
            print("Error: Could not retrieve session ID.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error starting session: {e}")
        return None

def move_rover(session_id, direction):
    if direction not in ["forward", "backward", "left", "right"]:
        print("Error: Invalid direction.")
        return False
    try:
        response = requests.post(
            f"{API_BASE}/rover/move?session_id={session_id}&direction={direction}"
        )
        response.raise_for_status()
        print(f"Rover moved {direction}.")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error moving rover: {e}")
        return False

def stop_rover(session_id):
    try:
        response = requests.post(f"{API_BASE}/rover/stop?session_id={session_id}")
        response.raise_for_status()
        print("Rover stopped.")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error stopping rover: {e}")
        return False

def get_rover_status(session_id):
    try:
        response = requests.get(f"{API_BASE}/rover/status?session_id={session_id}")
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error getting rover status: {e}")
        return None

def get_sensor_data(session_id):
    try:
        response = requests.get(f"{API_BASE}/rover/sensor-data?session_id={session_id}")
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error getting sensor data: {e}")
        return None

def navigate(session_id, sensor_data):
    front_distance = sensor_data.get("ultrasonic_front")
    if front_distance is not None and front_distance < OBSTACLE_THRESHOLD:
        stop_rover(session_id)
        turn_direction = random.choice(["left", "right"])
        move_rover(session_id, turn_direction)
        time.sleep(1)
        move_rover(session_id, "forward")
    else:
        move_rover(session_id, "forward")

def identify_survivors(sensor_data):
    rfid_tag = sensor_data.get("rfid_tag")
    if rfid_tag == "SurvivorTag123":
        print("Survivor detected! (RFID)")
        return True
    return False

def deliver_aid(session_id):
    stop_rover(session_id)
    print("Aid delivered!")
    time.sleep(5)
    move_rover(session_id, "backward")

if __name__ == "__main__":
    session_id = start_session()
    if not session_id:
        exit()
    communication_active = True
    try:
        while True:
            if communication_active:
                simulate_comm_delay()
                rover_status = get_rover_status(session_id)
                if rover_status:
                    if check_battery_status(rover_status):
                        stop_rover(session_id)
                        print("Recharging...")
                        while check_battery_status(rover_status):
                            time.sleep(5)
                            rover_status = get_rover_status(session_id)
                            if rover_status is None:
                                communication_active = False
                                break
                        if communication_active:
                            move_rover(session_id, "forward")
                    if is_communication_lost(rover_status):
                        communication_active = False
                else:
                    communication_active = False
            else:
                print("Attempting to regain communication...")
                time.sleep(10)
                rover_status = get_rover_status(session_id)
                if rover_status and can_communicate(rover_status):
                    communication_active = True
            if communication_active:
                sensor_data = get_sensor_data(session_id)
                if sensor_data:
                    navigate(session_id, sensor_data)
                    identify_survivors(sensor_data)
                else:
                    print("Failed to get sensor data.")
            else:
                print("No communication with the rover.")
    except KeyboardInterrupt:
        print("Program interrupted. Stopping rover...")
        if communication_active:
            stop_rover(session_id)
    finally:
        print("Exiting program.")
