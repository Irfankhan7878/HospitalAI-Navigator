const API_BASE_URL = 'http://127.0.0.1:5000';

// Navigation Logic
document.querySelectorAll('.nav-links li').forEach(link => {
    link.addEventListener('click', () => {
        // Remove active class from all
        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active-section'));
        
        // Add active class to clicked
        link.classList.add('active');
        const targetId = link.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active-section');
        }
    });
});

// Helper to show results
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
    
    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hospital, department, hour })
        });
        
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        const badgeClass = data.load_classification.toLowerCase();
        const html = `
            <h4>Prediction Results</h4>
            <p><strong>Hospital:</strong> ${data.hospital}</p>
            <p><strong>Department:</strong> ${data.department} (Hour: ${data.hour}:00)</p>
            <p><strong>Predicted Patients:</strong> ${data.predicted_patients}</p>
            <p><strong>Status:</strong> <span class="badge ${badgeClass}">${data.load_classification} Load</span></p>
        `;
        showResult('predict-result', html);
    } catch (error) {
        showResult('predict-result', `<p style="color:var(--danger)">Error: ${error.message}. Is the backend running?</p>`);
    }
});

// 2. Recommend Hospital
document.getElementById('btn-recommend').addEventListener('click', async () => {
    const department = document.getElementById('rec-dept').value;
    const hour = document.getElementById('rec-hour').value;
    const resultsContainer = document.getElementById('rec-results');
    
    resultsContainer.innerHTML = '<p>Analyzing hospital data...</p>';
    
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
            card.className = 'data-card';
            card.innerHTML = `
                <h4 style="color: ${isBest ? 'var(--accent)' : 'var(--text-main)'}; margin-bottom: 10px;">
                    ${isBest ? '<i class="fa-solid fa-trophy"></i> Best Option: ' : ''}${hosp.hospital}
                </h4>
                <p><strong>Crowd:</strong> <span class="badge ${badgeClass}">${hosp.load_classification}</span> (${hosp.predicted_patients} patients)</p>
                <p><strong>Beds Available:</strong> ${hosp.beds_available}</p>
                <p><strong>Doctors Available:</strong> ${hosp.available_doctors}</p>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top:10px;">Score: ${hosp.score.toFixed(2)}</p>
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
    
    resultsContainer.innerHTML = '<p>Fetching duty rosters...</p>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/doctor?department=${department}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        resultsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; margin-bottom: 15px;">
                <h4>${department} Department Roster</h4>
                <p>Available Doctors: ${data.available_doctors} / ${data.total_doctors}</p>
            </div>
        `;
        
        data.doctors.forEach(doc => {
            const isAvail = doc.available === "Yes";
            const card = document.createElement('div');
            card.className = 'data-card';
            card.innerHTML = `
                <h4 style="margin-bottom: 10px;">${doc.name}</h4>
                <p><strong>Status:</strong> <span class="badge ${isAvail ? 'low' : 'high'}">${isAvail ? 'Duty' : 'On Leave'}</span></p>
            `;
            resultsContainer.appendChild(card);
        });
        
    } catch (error) {
        resultsContainer.innerHTML = `<p style="color:var(--danger)">Error: ${error.message}</p>`;
    }
});

// 4. Smart Form Generation
document.getElementById('btn-generate-form').addEventListener('click', async () => {
    const department = document.getElementById('form-dept').value;
    const container = document.getElementById('form-container');
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate_form?department=${department}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        let html = `<h4>${data.form_schema.title}</h4><form id="patient-form" style="margin-top:20px;">`;
        
        data.form_schema.questions.forEach(q => {
            html += `<div class="form-question"><label>${q.question}</label>`;
            
            if (q.type === 'boolean') {
                html += `
                    <select name="${q.id}" required>
                        <option value="">Select an option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                `;
            } else if (q.type === 'choice') {
                html += `<select name="${q.id}" required><option value="">Select an option</option>`;
                q.options.forEach(opt => html += `<option value="${opt}">${opt}</option>`);
                html += `</select>`;
            } else {
                html += `<input type="text" name="${q.id}" required placeholder="Type your answer...">`;
            }
            html += `</div>`;
        });
        
        html += `<button type="submit" class="btn-primary" style="margin-top: 15px;">Submit Form</button></form>`;
        html += `<div id="form-submit-msg" style="margin-top: 15px;"></div>`;
        
        container.innerHTML = html;
        container.classList.remove('hidden');
        
        // Handle Form Submit
        document.getElementById('patient-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const responses = Object.fromEntries(formData.entries());
            
            const submitResponse = await fetch(`${API_BASE_URL}/submit_form`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department, responses })
            });
            const resData = await submitResponse.json();
            
            const msgBox = document.getElementById('form-submit-msg');
            msgBox.innerHTML = `<p style="color:var(--accent); font-weight:600;"><i class="fa-solid fa-circle-check"></i> ${resData.message}</p>`;
            e.target.reset();
        });
        
    } catch (error) {
        container.innerHTML = `<p style="color:var(--danger)">Error: ${error.message}</p>`;
        container.classList.remove('hidden');
    }
});

// 5. Hospital Navigation
document.getElementById('btn-navigate').addEventListener('click', async () => {
    const hospital = document.getElementById('nav-hospital').value;
    const department = document.getElementById('nav-dept').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/navigate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hospital, department, current_location: 'Entrance' })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        let html = `
            <h4>Navigation Guide to ${data.department}</h4>
            <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin: 15px 0;">
                <p style="font-size:1.2rem; color:var(--primary); font-weight:600;">
                    Floor ${data.location.floor} - Room ${data.location.room}
                </p>
            </div>
            <ul style="list-style-position: inside; color:var(--text-muted); line-height: 1.8;">
        `;
        
        data.route_steps.forEach(step => {
            html += `<li>${step}</li>`;
        });
        html += `</ul>`;
        
        showResult('nav-result', html);
    } catch (error) {
        showResult('nav-result', `<p style="color:var(--danger)">Error: ${error.message}</p>`);
    }
});
