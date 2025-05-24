// Data storage
let students = [];
let currentEditingId = null;

// Predefined questions based on the questionnaire
const questions = [
    "Els dies que faltaven a les classes, els explicaries els deures.",
    "Quan estàvem en fila, tu em posava al seu costat.",
    "Jugaries amb ells després de l'escola.",
    "Els prestaries el teu llapis o bolígraf.",
    "Els ajudaria a resoldre problemes de matemàtiques.",
    "Els protegiríeu si altres nins es burguessin d'ells.",
    "Parlaries amb ells durant el temps lliure a classe.",
    "Els convidaries a casa teva.",
    "T'asseieses al costat d'ells a classe.",
    "En el teu temps lliure a l'escola, jugaries amb ells.",
    "A classe, compartiríeu amb ells un secret que només uns quants nens sabien.",
    "T'hi acostaries i els diries \"hola\".",
    "Compartiries part del teu menjar amb ells.",
    "En els viatges escolars, us asseieu al seu costat a l'autobús.",
    "De vegades els trucaries des del teu telèfon o els enviaves missatges de text.",
    "Estaries del seu costat fins i tot quan fessin alguna cosa malament.",
    "Els diries de tu mateix (parlaries de tu mateix amb ells).",
    "Els ajudaria amb el treball de classe compartit.",
    "Els lloaríeu per les coses en què van tenir èxit.",
    "Els presentaríeu als vostres amics.",
    "Quan jugueu, els escolliu al vostre equip.",
    "Els diríeu coses sobre vosaltres mateixos que mai abans havíeu dit a ningú."
];

// Second questionnaire data
const questionnaire2Questions = [
    { id: 1, leftStatement: "A alguns nens els costa fer amics", rightStatement: "Altres nens troben que és molt fàcil fer amics" },
    { id: 2, leftStatement: "Alguns nens sovint no estan contents amb ells mateixos", rightStatement: "Altres nens estan bastant satisfets amb ells mateixos" },
    { id: 3, leftStatement: "Alguns nens senten que són tan intel·ligents com altres nens de la seva edat", rightStatement: "Altres nens no estan tan segurs i es pregunten si són tan intel·ligents" },
    { id: 4, leftStatement: "Alguns nens tenen molts amics", rightStatement: "Els altres nens no tenen gaires amics" },
    { id: 5, leftStatement: "Alguns nens voldrien tenir molts més amics", rightStatement: "Els altres nens tenen tants amics com volen" },
    { id: 6, leftStatement: "Alguns nens sovint obliden el que aprenen", rightStatement: "Altres nens poden recordar coses fàcilment" },
    { id: 7, leftStatement: "Alguns nens sempre estan fent coses amb molts nens", rightStatement: "Els altres nens solen fer les coses sols" },
    { id: 8, leftStatement: "Alguns nens desitgen que els agradin a més gent de la seva edat", rightStatement: "Altres nens senten que la majoria de la gent de la seva edat els agrada" },
    { id: 9, leftStatement: "En jocs alguns nens solen mirar en lloc de jugar", rightStatement: "Altres nens solen jugar en lloc de mirar" },
    { id: 10, leftStatement: "Alguns nens estan molt contents de ser com són", rightStatement: "Altres nens voldrien ser diferents" },
    { id: 11, leftStatement: "Alguns nens no ho fan bé amb els nous jocs a l'aire lliure", rightStatement: "Altres nens són bons en jocs nous de seguida" }
];

const questionnaire2Options = {
    left: [
        "Molt cert per a mi",
        "Una mica cert per a mi"
    ],
    right: [
        "Molt cert per a mi",
        "Una mica cert per a mi"
    ]
};

let currentQuestionnaire = 1;
const answerOptions = [
    "Segur que no ho faria mai",
    "Ho faria poques vegades",
    "Ni Sí ni No",
    "Ho faria sovint",
    "Sí, sempre ho faria"
];

function init() {
    generateQuestions();
    updateStudentsDisplay();
    updateSummaryDisplay();
}

function switchToQuestionnaire(questionnaireNum) {
    currentQuestionnaire = questionnaireNum;
    document.querySelectorAll('.questionnaire-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`q${questionnaireNum}-btn`).classList.add('active');
    clearForm();
    generateQuestions();
}

function generateQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';

    if (currentQuestionnaire === 1) {
        questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.innerHTML = `
                <label>Q${index + 1}:</label>
                <div style="flex: 1;">
                    <p style="margin-bottom: 8px; font-size: 0.9rem; color: #666;">${question}</p>
                    <select id="q${index + 1}" required>
                        <option value="">Select an answer...</option>
                        ${answerOptions.map((option, optIndex) =>
                `<option value="${optIndex + 1}">${option}</option>`
            ).join('')}
                    </select>
                </div>
            `;
            container.appendChild(questionDiv);
        });
    } else {
        questionnaire2Questions.forEach((question) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item q2-table-style';
            questionDiv.innerHTML = `
                <label>Q${question.id}:</label>
                <div class="q2-table-container">
                    <table class="q2-table">
                        <tr>
                            <th>Molt cert<br>per a mi</th>
                            <th>Una mica<br>cert per a<br>mi</th>
                            <th>Una mica<br>cert per a<br>mi</th>
                            <th>Molt cert<br>per a mi</th>
                        </tr>
                        <tr>
                            <td><input type="radio" name="q2_${question.id}" value="L2" required></td>
                            <td><input type="radio" name="q2_${question.id}" value="L1" required></td>
                            <td rowspan="2" class="statement-cell">${question.leftStatement}</td>
                            <td rowspan="2" class="pero-cell">← →<br>PERÒ</td>
                            <td rowspan="2" class="statement-cell">${question.rightStatement}</td>
                            <td><input type="radio" name="q2_${question.id}" value="R1" required></td>
                            <td><input type="radio" name="q2_${question.id}" value="R2" required></td>
                        </tr>
                    </table>
                </div>
            `;
            container.appendChild(questionDiv);
        });
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'manage-students') updateStudentsDisplay();
    else if (tabName === 'summary') updateSummaryDisplay();
}

function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentId').value.trim();
    
    if (!name || !id) {
        showAlert('Please fill in both student name and ID.', 'error');
        return;
    }
    
    if (currentEditingId === null && students.some(student => student.id === id)) {
        showAlert('This student ID already exists.', 'error');
        return;
    }
    
    const answers = {};
    let allAnswered = true;
    
    if (currentQuestionnaire === 1) {
        for (let i = 1; i <= questions.length; i++) {
            const answer = document.getElementById(`q${i}`).value;
            if (!answer) allAnswered = false;
            answers[`Q${i}`] = {
                question: questions[i-1],
                answer: answerOptions[parseInt(answer) - 1],
                value: parseInt(answer)
            };
        }
    } else {
        questionnaire2Questions.forEach(question => {
            const selected = document.querySelector(`input[name="q2_${question.id}"]:checked`);
            if (!selected) allAnswered = false;
            answers[`Q${question.id}`] = {
                question: `${question.leftStatement} / ${question.rightStatement}`,
                answer: selected.value,
                value: selected.value
            };
        });
    }
    
    if (!allAnswered) {
        showAlert('Please answer all questions.', 'error');
        return;
    }
    
    const student = {
        id: id,
        name: name,
        questionnaireType: currentQuestionnaire,
        answers: answers,
        timestamp: new Date().toISOString()
    };
    
    if (currentEditingId !== null) {
        students[students.findIndex(s => s.id === currentEditingId)] = student;
        currentEditingId = null;
        showAlert('Student updated successfully!', 'success');
    } else {
        students.push(student);
        showAlert('Student added successfully!', 'success');
    }
    
    clearForm();
    updateStudentsDisplay();
    updateSummaryDisplay();
}

function clearForm() {
    document.getElementById('studentName').value = '';
    document.getElementById('studentId').value = '';
    if (currentQuestionnaire === 1) {
        for (let i = 1; i <= questions.length; i++) {
            document.getElementById(`q${i}`).value = '';
        }
    } else {
        questionnaire2Questions.forEach(question => {
            document.querySelectorAll(`input[name="q2_${question.id}"]`).forEach(radio => radio.checked = false);
        });
    }
    currentEditingId = null;
    document.querySelector('.btn-primary').textContent = 'Add Student';
}

function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentId').value = student.id;
    currentEditingId = studentId;
    
    if (student.questionnaireType === 1) {
        Object.keys(student.answers).forEach(questionKey => {
            document.getElementById(questionKey.toLowerCase()).value = student.answers[questionKey].value;
        });
    } else {
        questionnaire2Questions.forEach(question => {
            const value = student.answers[`Q${question.id}`].value;
            document.querySelector(`input[name="q2_${question.id}"][value="${value}"]`).checked = true;
        });
    }
    
    document.querySelector('.btn-primary').textContent = 'Update Student';
    showTab('add-student');
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== studentId);
        updateStudentsDisplay();
        updateSummaryDisplay();
        showAlert('Student deleted successfully!', 'success');
    }
}

function updateStudentsDisplay() {
    const container = document.getElementById('studentsContainer');
    container.innerHTML = students.length === 0 
        ? '<p style="text-align: center; color: #666; font-style: italic;">No students registered yet.</p>'
        : students.map(student => `
            <div class="student-card fade-in">
                <h4>${student.name}</h4>
                <div class="student-id">ID: ${student.id}</div>
                <p>Questionnaire: ${student.questionnaireType === 1 ? 'Social Inclusion' : 'Self-Perception'}</p>
                <div>
                    <button class="btn btn-secondary" onclick="editStudent('${student.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteStudent('${student.id}')">Delete</button>
                </div>
            </div>
        `).join('');
}

function updateSummaryDisplay() {
    const container = document.getElementById('summaryContainer');
    if (students.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No data to display.</p>';
        return;
    }
    
    let tableHTML = `
        <div style="overflow-x: auto;">
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th>Questionnaire</th>
                        ${questions.map((_, i) => `<th>Q${i+1}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>`;
    
    students.forEach(student => {
        tableHTML += `
            <tr>
                <td>${student.name}</td>
                <td>${student.id}</td>
                <td>${student.questionnaireType === 1 ? 'Social Inclusion' : 'Self-Perception'}</td>
                ${questions.map((_, i) => {
                    const qKey = `Q${i+1}`;
                    const answer = student.answers[qKey];
                    if (!answer) return '<td>-</td>';
                    let text = student.questionnaireType === 1 
                        ? answer.answer 
                        : (answer.value.startsWith('L') 
                            ? questionnaire2Options.left[parseInt(answer.value.slice(1)) - 1]
                            : questionnaire2Options.right[parseInt(answer.value.slice(1)) - 1]);
                    return `<td>${text}</td>`;
                }).join('')}
            </tr>`;
    });
    
    container.innerHTML = tableHTML + `</tbody></table></div>`;
}

function exportToCSV() {
    if (students.length === 0) {
        showAlert('No data to export.', 'error');
        return;
    }
    
    let csv = 'Name,ID,Questionnaire Type' + questions.map((_, i) => `,Q${i+1}`).join('') + '\n';
    students.forEach(student => {
        csv += `"${student.name}","${student.id}","${student.questionnaireType === 1 ? 'Social Inclusion' : 'Self-Perception'}"`;
        csv += questions.map((_, i) => {
            const answer = student.answers[`Q${i+1}`];
            return `"${answer ? (student.questionnaireType === 1 
                ? answer.answer 
                : (answer.value.startsWith('L') 
                    ? questionnaire2Options.left[parseInt(answer.value.slice(1)) - 1]
                    : questionnaire2Options.right[parseInt(answer.value.slice(1)) - 1])) : ''}"`;
        }).join(',') + '\n';
    });
    
    downloadFile(csv, 'questionnaire_data.csv', 'text/csv');
    showExportStatus('Data exported to CSV successfully!', 'success');
}

function exportToExcel() {
    if (students.length === 0) {
        showAlert('No data to export.', 'error');
        return;
    }
    
    const data = [
        ['Name', 'ID', 'Questionnaire Type', ...questions.map((_, i) => `Q${i+1}`)],
        ...students.map(student => [
            student.name,
            student.id,
            student.questionnaireType === 1 ? 'Social Inclusion' : 'Self-Perception',
            ...questions.map((_, i) => {
                const answer = student.answers[`Q${i+1}`];
                return answer ? (student.questionnaireType === 1 
                    ? answer.answer 
                    : (answer.value.startsWith('L') 
                        ? questionnaire2Options.left[parseInt(answer.value.slice(1)) - 1]
                        : questionnaire2Options.right[parseInt(answer.value.slice(1)) - 1])) : '';
            })
        ])
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Questionnaire Data');
    XLSX.writeFile(wb, 'questionnaire_data.xlsx');
    showExportStatus('Data exported to Excel successfully!', 'success');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    const container = document.querySelector('.tab-content.active .form-section');
    container.prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

function showExportStatus(message, type) {
    const statusDiv = document.getElementById('exportStatus');
    statusDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => statusDiv.innerHTML = '', 5000);
}

document.addEventListener('DOMContentLoaded', init);
