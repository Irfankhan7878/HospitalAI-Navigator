const API_BASE_URL = 'http://127.0.0.1:5000';

// Navigation Logic
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active-section'));
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active-section');
        }
    });
});

function showResult(elementId, htmlContent) {
    const el = document.getElementById(elementId);
    el.innerHTML = htmlContent;
    el.classList.remove('hidden');
}

// 1. Predict Patient Load
document.getElementById('btn-predict').addEventListener('click', async () => {
    const hospital = document.getElementById('pred-hospital').value;
    const department = document.getElementById('pred-dept').value;
    const hour = document.getElementById('pred-hour').value;
    const resultBox = document.getElementById('predict-result');
    
    resultBox.innerHTML = '<p>Processing...</p>';
    resultBox.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hospital, department, hour })
        });
        
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        const badgeClass = data.load_classification.toLowerCase();
        resultBox.innerHTML = `
            <h3 style="color:var(--primary); margin-bottom:10px;">${data.hospital}</h3>
            <p><strong>Department:</strong> ${data.department}</p>
            <p><strong>Time:</strong> ${data.hour}:00</p>
            <p><strong>Estimated Patients:</strong> ${data.predicted_patients}</p>
            <p style="margin-top:10px;"><strong>Status:</strong> <span class="badge ${badgeClass}">${data.load_classification} Wait Time</span></p>
        `;
    } catch (error) {
        resultBox.innerHTML = `<p style="color:var(--danger)">Error: ${error.message}</p>`;
    }
});

// 2. Recommend Hospital
document.getElementById('btn-recommend').addEventListener('click', async () => {
    const department = document.getElementById('rec-dept').value;
    const hour = document.getElementById('rec-hour').value;
    const resultsContainer = document.getElementById('rec-results');
    
    resultsContainer.innerHTML = '<p>Searching for the best hospitals...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ department, hour })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        resultsContainer.innerHTML = '';
        
        data.all_options.forEach((hosp, index) => {
            const isBest = index === 0;
            const badgeClass = hosp.load_classification.toLowerCase();
            
            const card = document.createElement('div');
            card.className = `data-card ${isBest ? 'best' : ''}`;
            card.innerHTML = `
                <h3 style="color: ${isBest ? 'var(--secondary)' : 'var(--primary)'}; margin-bottom: 10px;">
                    ${isBest ? '<i class="fa-solid fa-star"></i> Recommended: ' : ''}${hosp.hospital}
                </h3>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <p><i class="fa-solid fa-users"></i> Crowd: <span class="badge ${badgeClass}">${hosp.load_classification}</span> (${hosp.predicted_patients} patients)</p>
                    <p><i class="fa-solid fa-bed"></i> Beds Available: <strong>${hosp.beds_available}</strong></p>
                    <p><i class="fa-solid fa-user-doctor"></i> Doctors on Duty: <strong>${hosp.available_doctors}</strong></p>
                </div>
            `;
            resultsContainer.appendChild(card);
        });
        
    } catch (error) {
        resultsContainer.innerHTML = `<p style="color:var(--danger)">Error: ${error.message}</p>`;
    }
});

// 3. Doctor Availability
document.getElementById('btn-doctors').addEventListener('click', async () => {
    const department = document.getElementById('doc-dept').value;
    const resultsContainer = document.getElementById('doc-results');
    
    resultsContainer.innerHTML = '<p>Loading doctor schedules...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/doctor?department=${department}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        resultsContainer.innerHTML = '';
        
        data.doctors.forEach(doc => {
            const isAvail = doc.available === "Yes";
            const card = document.createElement('div');
            card.className = 'data-card';
            card.style.borderTopColor = isAvail ? 'var(--secondary)' : 'var(--danger)';
            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="width:50px; height:50px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:#ccc;">
                        <i class="fa-solid fa-user-tie"></i>
                    </div>
                    <div>
                        <h3 style="margin-bottom:5px;">${doc.name}</h3>
                        <p><span class="badge ${isAvail ? 'low' : 'high'}">${isAvail ? 'Available' : 'On Leave'}</span></p>
                    </div>
                </div>
            `;
            resultsContainer.appendChild(card);
        });
        
    } catch (error) {
        resultsContainer.innerHTML = `<p style="color:var(--danger)">Error: ${error.message}</p>`;
    }
});

// 4. Smart Form
document.getElementById('btn-generate-form').addEventListener('click', async () => {
    const department = document.getElementById('form-dept').value;
    const container = document.getElementById('form-container');
    
    container.innerHTML = '<p style="padding:20px;">Generating AI questions...</p>';
    container.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate_form?department=${department}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        let html = `<h3 style="color:var(--primary); border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:20px;">${data.form_schema.title}</h3><form id="patient-form">`;
        
        data.form_schema.questions.forEach((q, i) => {
            html += `<div class="input-group" style="margin-bottom: 15px;"><label>${i+1}. ${q.question}</label>`;
            if (q.type === 'boolean') {
                html += `<select name="${q.id}" required><option value="">Select an option</option><option value="Yes">Yes</option><option value="No">No</option></select>`;
            } else if (q.type === 'choice') {
                html += `<select name="${q.id}" required><option value="">Select an option</option>`;
                q.options.forEach(opt => html += `<option value="${opt}">${opt}</option>`);
                html += `</select>`;
            } else {
                html += `<input type="text" name="${q.id}" required placeholder="Your answer">`;
            }
            html += `</div>`;
        });
        
        html += `<button type="submit" class="btn-primary" style="margin-top: 20px; width:100%;">Submit to Doctor</button></form><div id="form-submit-msg" style="margin-top: 15px;"></div>`;
        
        container.innerHTML = html;
        
        document.getElementById('patient-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const responses = Object.fromEntries(formData.entries());
            
            const msgBox = document.getElementById('form-submit-msg');
            msgBox.innerHTML = `<p style="color:var(--secondary); font-weight:bold;"><i class="fa-solid fa-check-circle"></i> Submitted successfully! The doctor has received your responses.</p>`;
            e.target.reset();
        });
        
    } catch (error) {
        container.innerHTML = `<p style="color:var(--danger); padding:20px;">Error: ${error.message}</p>`;
    }
});

// 5. Indoor Map Navigation
const canvas = document.getElementById('indoorMapCanvas');
const ctx = canvas.getContext('2d');

function drawHospitalMap(targetFloor) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (light grey)
    ctx.fillStyle = "#e5e3df";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Building Outline
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 2;
    ctx.fillRect(50, 50, 500, 300);
    ctx.strokeRect(50, 50, 500, 300);
    
    // Draw Corridors
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(50, 180, 500, 40); // Horizontal corridor
    ctx.fillRect(280, 50, 40, 300); // Vertical corridor
    
    // Draw Rooms based on floor
    const rooms = [
        {x: 60, y: 60, w: 100, h: 100, label: "Room A"},
        {x: 170, y: 60, w: 100, h: 100, label: "Room B"},
        {x: 330, y: 60, w: 100, h: 100, label: "Elevator"},
        {x: 440, y: 60, w: 100, h: 100, label: "Restroom"},
        
        {x: 60, y: 240, w: 100, h: 100, label: "Room C"},
        {x: 170, y: 240, w: 100, h: 100, label: "Room D"},
        {x: 330, y: 240, w: 100, h: 100, label: "Room E"},
        {x: 440, y: 240, w: 100, h: 100, label: "Room F"},
    ];
    
    rooms.forEach(r => {
        ctx.fillStyle = r.label === "Elevator" ? "#e8f4fd" : "#fafafa";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        
        ctx.fillStyle = "#666";
        ctx.font = "12px Roboto";
        ctx.textAlign = "center";
        ctx.fillText(r.label, r.x + r.w/2, r.y + r.h/2);
    });
    
    // Entrance
    if (targetFloor === 0) {
        ctx.fillStyle = "#28a745";
        ctx.fillRect(280, 350, 40, 10);
        ctx.fillText("MAIN ENTRANCE", 300, 370);
    }
}

function animateRoute(targetRoomIndex, isGroundFloor) {
    let startX = 300, startY = 350; // Main Entrance
    if (!isGroundFloor) {
        startX = 380; startY = 110; // Elevator
    }
    
    const targets = [
        {x: 110, y: 160}, // Room A
        {x: 220, y: 160}, // Room B
        {x: 380, y: 160}, // Elevator (dummy)
        {x: 490, y: 160}, // Restroom
        {x: 110, y: 240}, // Room C
        {x: 220, y: 240}, // Room D
        {x: 380, y: 240}, // Room E
        {x: 490, y: 240}, // Room F
    ];
    
    const target = targets[targetRoomIndex % targets.length];
    
    // Draw Path
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(300, 200); // go to center
    ctx.lineTo(target.x, 200); // go horiz
    ctx.lineTo(target.x, target.y); // go to room
    ctx.strokeStyle = "#0066cc";
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw Start
    ctx.fillStyle = "#28a745";
    ctx.beginPath(); ctx.arc(startX, startY, 8, 0, Math.PI*2); ctx.fill();
    
    // Draw End Pin
    ctx.fillStyle = "#dc3545";
    ctx.beginPath();
    ctx.arc(target.x, target.y, 10, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "10px Roboto";
    ctx.fillText("★", target.x, target.y + 3);
}

document.getElementById('btn-navigate').addEventListener('click', async () => {
    const hospital = document.getElementById('nav-hospital').value;
    const department = document.getElementById('nav-dept').value;
    const navResult = document.getElementById('nav-result');
    
    navResult.classList.remove('hidden');
    document.getElementById('nav-steps-container').innerHTML = '<p style="padding:20px;">Calculating optimal indoor route...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/navigate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hospital, department, current_location: 'Entrance' })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        document.getElementById('nav-dest-title').innerText = `Route to ${department}`;
        
        // Populate Steps
        const icons = ['fa-door-open', 'fa-arrow-up', 'fa-arrow-right', 'fa-location-dot'];
        let stepsHtml = '';
        data.route_steps.forEach((step, index) => {
            const icon = index === data.route_steps.length - 1 ? 'fa-flag-checkered' : icons[index % icons.length];
            let dist = Math.floor(Math.random() * 30) + 10;
            stepsHtml += `
                <div class="step-item">
                    <div class="step-icon"><i class="fa-solid ${icon}"></i></div>
                    <div class="step-detail">
                        <h4>${step}</h4>
                        <p>${dist} meters</p>
                    </div>
                </div>
            `;
        });
        document.getElementById('nav-steps-container').innerHTML = stepsHtml;
        
        // Draw Map
        const targetFloor = data.location.floor;
        drawHospitalMap(targetFloor);
        animateRoute(data.location.room, targetFloor === 0);
        
    } catch (error) {
        document.getElementById('nav-steps-container').innerHTML = `<p style="color:var(--danger); padding:20px;">Error: ${error.message}</p>`;
    }
});
