import csv
import random

hospitals = {
    "City Hospital": {"lat": 28.61, "long": 77.20},
    "Metro Hospital": {"lat": 28.65, "long": 77.25},
    "Green Valley Hospital": {"lat": 28.70, "long": 77.30}
}
departments = {
    "Emergency": {"floor": 0, "doctors": ["Dr Khan", "Dr Allen", "Dr Smith", "Dr Doe"]},
    "Dental": {"floor": 1, "doctors": ["Dr Singh", "Dr Ali", "Dr Wong"]},
    "Orthopedic": {"floor": 2, "doctors": ["Dr Sharma", "Dr Verma", "Dr Reddy", "Dr Patel"]},
    "Cardiology": {"floor": 3, "doctors": ["Dr Gupta", "Dr Lee", "Dr Kim", "Dr Wright"]},
    "X-ray": {"floor": 4, "doctors": ["Dr Ray", "Dr Das"]}
}

years = [2022, 2023, 2024]
hours = list(range(0, 24))

def get_smooth_patients(hour, department):
    # Applying realistic hourly patterns with higher count in peak hours
    if 10 <= hour <= 14: # Peak 1
        base = random.uniform(60, 95)
    elif 18 <= hour <= 21: # Peak 2
        base = random.uniform(70, 105)
    elif 1 <= hour <= 6: # Deep night
        base = random.uniform(2, 12)
    else: # Normal hours
        base = random.uniform(25, 55)
        
    if department == "Emergency":
        # Emergency has higher load consistently, even at night
        base = base * 1.5 + random.uniform(15, 35)
    elif department == "X-ray":
        # Moderate load, logically depends on other departments
        base = base * 0.6 + random.uniform(5, 15)
    elif department == "Dental":
        # Realistic operations: practically empty at deep night
        if hour < 8 or hour > 20: 
            base = random.uniform(0, 4)
    
    return int(max(0, base))

total_records = 22500
header = ["hospital","lat","long","year","hour","patients","wait_time","department","doctor_name","available","leave_status","floor","room","beds_available"]

unique_rows = set()

with open('hospital_master.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    
    attempts = 0
    generated = 0
    
    while generated < total_records and attempts < total_records * 10:
        attempts += 1
        
        h_name = random.choice(list(hospitals.keys()))
        h_info = hospitals[h_name]
        dept_name = random.choice(list(departments.keys()))
        dept_info = departments[dept_name]
        
        doc = random.choice(dept_info["doctors"])
        
        # 10-20% leave -> available must be No logically
        leave = "Yes" if random.random() < 0.15 else "No"
        available = "No" if leave == "Yes" else "Yes"
        
        year = random.choice(years)
        hour = random.choice(hours)
        
        patients = get_smooth_patients(hour, dept_name)
        
        if patients == 0:
            wait_time = 0
        else:
            # Wait time increases as patient count increases
            base_wait = patients * random.uniform(0.4, 0.7) + random.randint(1, 5)
            # Wait time further increases if doctors unavailable
            if available == "No":
                base_wait += random.uniform(20, 40)
            wait_time = int(max(1, base_wait))
            
        # Total room capacity simulating beds 2-10 rule
        room_capacity = random.randint(6, 10)
        if dept_name == "Emergency":
            room_capacity = random.randint(4, 7) # Fewer beds but high demand
            
        occupancy_ratio = min(patients / 100.0, 1.0)
        if dept_name == "Emergency":
             occupancy_ratio = min(patients / 130.0, 1.0)
             
        # Inverse mapping: as patients increase -> beds available decrease
        beds_occupied = int(room_capacity * occupancy_ratio)
        beds_available = room_capacity - beds_occupied
        
        beds_available += random.randint(-1, 1) # Introduce minor randomness
        beds_available = max(0, min(beds_available, room_capacity))
        
        if dept_name == "Emergency" and patients > 100:
             beds_available = 0 # No beds if completely overrun
        
        floor = dept_info["floor"]
        room_num = f"{floor}{random.randint(10, 99)}" if floor > 0 else f"{random.randint(10, 99)}"
        
        row_tuple = (h_name, h_info["lat"], h_info["long"], year, hour, patients, wait_time, dept_name, doc, available, leave, floor, room_num, beds_available)
        
        # Preventing duplicate rows
        if row_tuple not in unique_rows:
            unique_rows.add(row_tuple)
            writer.writerow(row_tuple)
            generated += 1

print(f"Generated {generated} unique, realistic rows successfully.")
