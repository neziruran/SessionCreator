class GroupShuffler {
    constructor() {
        this.students = [];
        this.sessions = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File upload
        const dropArea = document.getElementById('dropArea');
        const fileInput = document.getElementById('fileInput');
        const loadExcelBtn = document.getElementById('loadExcelBtn');

        dropArea.addEventListener('click', () => fileInput.click());

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('dragover');
            });
        });

        dropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length) {
                fileInput.files = files;
                this.updateFileNameDisplay(files[0].name);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                this.updateFileNameDisplay(fileInput.files[0].name);
            }
        });

        loadExcelBtn.addEventListener('click', () => {
            if (fileInput.files.length) {
                this.loadFromExcel(fileInput.files[0]);
            } else {
                this.showStatus('Please select an Excel file first', 'error');
            }
        });

        // Other buttons
        document.getElementById('createStructureBtn').addEventListener('click', () => {
            if (fileInput.files.length) {
                this.createStructure();
            } else {
                this.showStatus('Please select an Excel file first', 'error');
            }
        });

        document.getElementById('exportSessionsBtn').addEventListener('click', () => {
            this.exportSessions();
        });

        // Student filter dropdown
        document.getElementById('studentFilter').addEventListener('change', (e) => {
            this.highlightStudent(e.target.value);
        });
    }

    updateFileNameDisplay(name) {
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        fileNameDisplay.textContent = name;
        fileNameDisplay.style.display = 'block';
    }

    showStatus(message, type = 'success') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.className = 'status-message status-' + type;
        statusEl.style.display = 'block';

        // Auto hide after 5 seconds
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }

    loadFromExcel(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // Use XLSX library to parse the Excel file
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get the first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert sheet to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Check if required columns exist
                if (jsonData.length > 0 && 'full names' in jsonData[0] && 'tag' in jsonData[0]) {
                    // Reset students array
                    this.students = [];

                    // Map Excel data to students
                    jsonData.forEach((row, index) => {
                        this.students.push({
                            id: index + 1,
                            name: row['full names'],
                            tag: row['tag'] || 'Regular' // Default to Regular if tag is missing
                        });
                    });

                    // Populate student filter dropdown
                    this.populateStudentDropdown();

                    this.showStatus(`Successfully loaded ${this.students.length} students.`);
                } else {
                    this.showStatus("Excel file must contain 'full names' and 'tag' columns", 'error');
                }
            } catch (e) {
                this.showStatus(`Failed to parse Excel file: ${e.message}`, 'error');
            }
        };

        reader.onerror = () => {
            this.showStatus("Error reading file", 'error');
        };

        reader.readAsArrayBuffer(file);
    }

    populateStudentDropdown() {
        const dropdown = document.getElementById('studentFilter');
        // Clear previous options except the first one
        while (dropdown.options.length > 1) {
            dropdown.remove(1);
        }

        // Add students to dropdown with ID and name
        this.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `#${student.id} - ${student.name}`;

            // Add special styling for ASC students
            if (student.tag === 'ASC') {
                option.classList.add('dropdown-asc');
            }

            dropdown.appendChild(option);
        });

        // Show the filter container
        document.getElementById('studentFilterContainer').style.display = 'flex';
    }

    highlightStudent(studentId) {
        // Remove previous highlights
        document.querySelectorAll('.student-item').forEach(el => {
            el.classList.remove('student-highlighted');
        });

        if (!studentId) return; // If "All Students" is selected

        // Highlight selected student
        document.querySelectorAll(`.student-id-${studentId}`).forEach(el => {
            el.classList.add('student-highlighted');
        });
    }

    createStructure() {
        // If no students loaded, generate default ones with full names
        if (!this.students.length)
        {
            return;
        }

        const numSessions = 12;
        const groupSize = 4;
        this.sessions = [];

        // Track ASC history for each student (which teammates they've been with when ASC)
        const ascHistory = {};
        this.students.forEach(s => { ascHistory[s.name] = new Set(); });

        // Find actual ASC students from the loaded data
        const ascStudents = this.students.filter(s => s.tag === 'ASC');

        for (let sess = 1; sess <= numSessions; sess++) {
            const sessionGroups = [];

            // --- Select an actual ASC student (if any) and form their group ---
            if (ascStudents.length > 0) {
                let eligible = [];

                // Find eligible ASC students (those who can still be paired with enough new students)
                for (let s of ascStudents) {
                    const available = new Set(
                        this.students
                            .filter(stu => stu.name !== s.name)
                            .map(stu => stu.name)
                    );

                    // Remove students already grouped with this student when they were ASC
                    if (ascHistory[s.name]) {
                        ascHistory[s.name].forEach(name => available.delete(name));
                    }

                    if (available.size >= groupSize - 1) {
                        eligible.push(s);
                    }
                }

                if (!eligible.length) {
                    // Reset histories if no candidate qualifies
                    ascStudents.forEach(s => { ascHistory[s.name] = new Set(); });
                    eligible = [...ascStudents];
                }

                const ascStudent = this.getRandomItem(eligible);

                // Get available students who haven't been with this ASC before
                const availableNames = this.students
                    .filter(stu => stu.name !== ascStudent.name)
                    .map(stu => stu.name)
                    .filter(name => !ascHistory[ascStudent.name].has(name));

                const teammates = this.getRandomItems(availableNames, groupSize - 1);

                // Update ASC history
                teammates.forEach(name => {
                    ascHistory[ascStudent.name].add(name);
                });

                // Create ASC group
                const ascGroup = [{ ...ascStudent }]; // Keep original tag, no need to override
                for (let name of teammates) {
                    const studentObj = this.students.find(stu => stu.name === name);
                    ascGroup.push({ ...studentObj });
                }
                sessionGroups.push(ascGroup);

                // --- Group the remaining students ---
                const usedNames = new Set([ascStudent.name, ...teammates]);
                let remaining = this.students.filter(s => !usedNames.has(s.name));
                this.shuffleArray(remaining);

                const groupsNeeded = Math.ceil(remaining.length / groupSize);
                const totalSlots = groupsNeeded * groupSize;
                const duplicatesNeeded = totalSlots - remaining.length;

                if (duplicatesNeeded > 0) {
                    const duplicates = this.getRandomItems(remaining, duplicatesNeeded);
                    remaining = [...remaining, ...duplicates];
                    this.shuffleArray(remaining);
                }

                for (let i = 0; i < remaining.length; i += groupSize) {
                    const group = remaining.slice(i, i + groupSize);
                    sessionGroups.push(group);
                }
            } else {
                // No ASC students, just create regular groups
                let allStudents = [...this.students];
                this.shuffleArray(allStudents);

                const groupsNeeded = Math.ceil(allStudents.length / groupSize);
                const totalSlots = groupsNeeded * groupSize;
                const duplicatesNeeded = totalSlots - allStudents.length;

                if (duplicatesNeeded > 0) {
                    const duplicates = this.getRandomItems(allStudents, duplicatesNeeded);
                    allStudents = [...allStudents, ...duplicates];
                    this.shuffleArray(allStudents);
                }

                for (let i = 0; i < allStudents.length; i += groupSize) {
                    const group = allStudents.slice(i, i + groupSize);
                    sessionGroups.push(group);
                }
            }

            // *** NEW CODE: Randomize the order of groups in the session ***
            this.shuffleArray(sessionGroups);

            this.sessions.push(sessionGroups);
        }

        // Enable export button
        document.getElementById('exportSessionsBtn').disabled = false;
        document.getElementById('exportSessionsBtn').classList.remove('btn-disabled');

        // Display the results
        this.renderSessions();

        this.showStatus("Successfully generated groups for 12 sessions.");
    }

    renderSessions() {
        const container = document.getElementById('sessionsContainer');
        const tabs = document.getElementById('sessionTabs');

        // Clear previous content
        container.innerHTML = '';
        tabs.innerHTML = '';

        // Create tabs
        this.sessions.forEach((session, index) => {
            const tab = document.createElement('div');
            tab.className = 'session-tab';
            tab.textContent = `Session ${index + 1}`;
            tab.dataset.index = index;

            if (index === 0) tab.classList.add('active');

            tab.addEventListener('click', () => {
                document.querySelectorAll('.session-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.session-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`session-${index}`).classList.add('active');
            });

            tabs.appendChild(tab);
        });

        // Create session content
        this.sessions.forEach((session, sessionIndex) => {
            const sessionElement = document.createElement('div');
            sessionElement.id = `session-${sessionIndex}`;
            sessionElement.className = 'session-content';
            if (sessionIndex === 0) sessionElement.classList.add('active');

            const groupsContainer = document.createElement('div');
            groupsContainer.className = 'groups-container';

            // Create horizontal rows of 6 groups each
            const rowCount = Math.ceil(session.length / 6);

            for (let row = 0; row < rowCount; row++) {
                const rowElement = document.createElement('div');
                rowElement.className = 'groups-row';

                // Add 6 groups per row (or fewer for the last row)
                for (let col = 0; col < 6; col++) {
                    const groupIndex = row * 6 + col;

                    if (groupIndex < session.length) {
                        const group = session[groupIndex];
                        const groupCard = document.createElement('div');
                        groupCard.className = 'group-card';

                        const groupHeader = document.createElement('div');
                        groupHeader.className = 'group-header';
                        groupHeader.innerHTML = `
                            <span>Group ${groupIndex + 1}</span>
                            <span class="tooltip">
                                <i class="fas fa-info-circle"></i>
                                <span class="tooltip-text">${group.length} students</span>
                            </span>
                        `;

                        const studentsList = document.createElement('ul');
                        studentsList.className = 'students-list';

                        group.forEach(student => {
                            const studentItem = document.createElement('li');
                            studentItem.className = `student-item student-id-${student.id}`;
                            if (student.tag === 'ASC') studentItem.classList.add('student-asc');

                            studentItem.innerHTML = `
                                <span class="student-name"><span class="student-id">#${student.id}</span> ${student.name}</span>
                                <span class="tag tag-${student.tag.toLowerCase()}">${student.tag}</span>
                            `;

                            studentsList.appendChild(studentItem);
                        });

                        groupCard.appendChild(groupHeader);
                        groupCard.appendChild(studentsList);
                        rowElement.appendChild(groupCard);
                    }
                }

                groupsContainer.appendChild(rowElement);
            }

            sessionElement.appendChild(groupsContainer);
            container.appendChild(sessionElement);
        });
    }

    exportSessions() {
        if (!this.sessions.length) {
            this.showStatus('No sessions available to export.', 'error');
            return;
        }

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // For each session, create a worksheet
        this.sessions.forEach((session, sessionIndex) => {
            const sessionData = [];

            // Add header row
            const headerRow = ["Group", "Student ID", "Name", "Tag"];
            sessionData.push(headerRow);

            // Add data rows
            session.forEach((group, groupIndex) => {
                group.forEach(student => {
                    sessionData.push([
                        `Group ${groupIndex + 1}`,
                        student.id,
                        student.name,
                        student.tag
                    ]);
                });
            });

            // Create worksheet and add to workbook
            const ws = XLSX.utils.aoa_to_sheet(sessionData);
            XLSX.utils.book_append_sheet(wb, ws, `Session ${sessionIndex + 1}`);
        });

        // Generate Excel file and trigger download
        XLSX.writeFile(wb, "group_sessions.xlsx");

        this.showStatus('Sessions exported successfully.');
    }

    // Helper methods
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomItems(array, count) {
        const shuffled = [...array];
        this.shuffleArray(shuffled);
        return shuffled.slice(0, count);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new GroupShuffler();
});