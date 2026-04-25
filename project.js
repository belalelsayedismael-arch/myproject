let patients = [
    { name: "John Doe", bed: "ICU-01", heartRate: 75, oxygen: 98, notes: "Recovering well from minor surgery." },
    { name: "Alex Smith", bed: "WARD-05", heartRate: 110, oxygen: 89, notes: "Experiencing respiratory distress. Monitor closely." }
];

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    if(pageId === 'patients-view') renderDashboard();
}

function renderDashboard() {
    const container = document.getElementById('patients');
    container.innerHTML = "";
    patients.forEach((p, i) => {
        const isCritical = p.oxygen < 90 || p.heartRate > 105;
        container.innerHTML += `
            <div class="monitor-card" style="background:white; color:black; border-left: 10px solid ${isCritical ? '#ef4444' : '#10b981'}; margin-bottom:15px; cursor:pointer;" onclick="openTelemetry(${i})">
                <div style="display:flex; justify-content:space-between;">
                    <h3>${p.name}</h3>
                    <span style="color: ${isCritical ? 'red' : 'green'}">${isCritical ? 'CRITICAL' : 'STABLE'}</span>
                </div>
                <p>Location: ${p.bed}</p>
            </div>
        `;
    });
}

function openTelemetry(index) {
    const p = patients[index];
    document.getElementById('det-name').innerText = p.name;
    document.getElementById('det-bed').innerText = `Location: ${p.bed}`;
    document.getElementById('det-notes').innerText = p.notes || "No notes.";
    
    showPage('patient-details');
    startIoTStream(p);
}

function startIoTStream(patient) {
    if(window.liveInterval) clearInterval(window.liveInterval);

    const hrSpan = document.getElementById('det-hr');
    const oxSpan = document.getElementById('det-ox');
    const oxFill = document.getElementById('ox-fill');
    const detailSection = document.getElementById('patient-details');

    window.liveInterval = setInterval(() => {
        if(detailSection.style.display === 'none') {
            clearInterval(window.liveInterval);
            return;
        }

        // SIMULATE LIVE DATA FROM WEARABLE
        let liveHR = patient.heartRate + (Math.floor(Math.random() * 5) - 2);
        let liveOX = patient.oxygen;

        hrSpan.innerText = liveHR;
        oxSpan.innerText = liveOX;
        oxFill.style.width = liveOX + "%";

        // UI Alert Logic
        if(liveHR > 110 || liveOX < 90) {
            detailSection.classList.add('status-critical');
        } else {
            detailSection.classList.remove('status-critical');
        }
    }, 2000); // Updates every 2 seconds to feel "Live"
}

// Admit Patient Logic
document.getElementById('patient-form').addEventListener('submit', (e) => {
    e.preventDefault();
    patients.push({
        name: document.getElementById('name').value,
        bed: document.getElementById('bed').value,
        notes: document.getElementById('patient-notes').value,
        heartRate: Math.floor(Math.random() * (100 - 60) + 60),
        oxygen: Math.floor(Math.random() * (100 - 90) + 90)
    });
    e.target.reset();
    showPage('patients-view');
});

// Initialize
showPage('patients-view');