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

                    // Count ASC students
                    const ascCount = this.students.filter(s => s.tag === 'ASC').length;
                    this.showStatus(`Successfully loaded ${this.students.length} students (including ${ascCount} ASC students).`);
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
        // If no students loaded, return
        if (!this.students.length) {
            return;
        }

        const numSessions = 12;
        const coreGroupSize = 4; // Core group size
        const totalGroupSize = coreGroupSize + 2; // Including 2 substitutes
        this.sessions = [];

        // Track ASC history for each student (which teammates they've been with)
        const ascHistory = {};
        this.students.forEach(s => {
            ascHistory[s.name] = new Set();
        });

        // Find all ASC students from the loaded data
        const ascStudents = this.students.filter(s => s.tag === 'ASC');

        for (let sess = 1; sess <= numSessions; sess++) {
            const sessionGroups = [];

            // Track which students are already assigned to groups in this session
            const assignedStudents = new Set();

            // First, handle groups with ASC students (one ASC student per group)
            const eligibleAscStudents = [...ascStudents];
            this.shuffleArray(eligibleAscStudents);

            for (const ascStudent of eligibleAscStudents) {
                // Skip if this ASC student is already assigned
                if (assignedStudents.has(ascStudent.name)) continue;

                // Find eligible teammates who haven't been with this ASC student before
                // and aren't already assigned to a group in this session
                const availableStudents = this.students.filter(stu =>
                    stu.name !== ascStudent.name &&
                    !assignedStudents.has(stu.name) &&
                    stu.tag !== 'ASC' && // Ensure no other ASC students in this group
                    !ascHistory[ascStudent.name].has(stu.name)
                );

                // If we don't have enough available students who haven't been with this ASC student before,
                // reset the history for this ASC student
                if (availableStudents.length < coreGroupSize - 1) {
                    ascHistory[ascStudent.name] = new Set();

                    // Try again with reset history
                    const resetAvailableStudents = this.students.filter(stu =>
                        stu.name !== ascStudent.name &&
                        !assignedStudents.has(stu.name) &&
                        stu.tag !== 'ASC' // Ensure no other ASC students in this group
                    );

                    // If we still don't have enough students, skip this ASC student for this session
                    if (resetAvailableStudents.length < coreGroupSize - 1) {
                        continue;
                    }

                    // Create a group with this ASC student
                    const teammates = this.getRandomItems(resetAvailableStudents, coreGroupSize - 1);

                    // Create a group with core members
                    const group = [{ ...ascStudent }];
                    teammates.forEach(student => {
                        group.push({ ...student });
                        assignedStudents.add(student.name);
                        ascHistory[ascStudent.name].add(student.name);
                    });

                    // Add substitutes
                    const possibleSubstitutes = this.students.filter(stu =>
                        !assignedStudents.has(stu.name) &&
                        stu.tag !== 'ASC' // No ASC students as substitutes
                    );

                    if (possibleSubstitutes.length >= 2) {
                        const substitutes = this.getRandomItems(possibleSubstitutes, 2);
                        substitutes.forEach(sub => {
                            group.push({ ...sub, isSubstitute: true });
                            assignedStudents.add(sub.name);
                        });
                    } else {
                        // Not enough students for substitutes, use duplicates from other groups
                        const duplicates = this.getRandomItems(this.students.filter(s => s.tag !== 'ASC'), 2);
                        duplicates.forEach(dup => {
                            group.push({ ...dup, isSubstitute: true, isDuplicate: true });
                        });
                    }

                    sessionGroups.push(group);
                    assignedStudents.add(ascStudent.name);
                } else {
                    // We have enough available students, create the group
                    const teammates = this.getRandomItems(availableStudents, coreGroupSize - 1);

                    // Create a group with core members
                    const group = [{ ...ascStudent }];
                    teammates.forEach(student => {
                        group.push({ ...student });
                        assignedStudents.add(student.name);
                        ascHistory[ascStudent.name].add(student.name);
                    });

                    // Add substitutes
                    const possibleSubstitutes = this.students.filter(stu =>
                        !assignedStudents.has(stu.name) &&
                        stu.tag !== 'ASC' // No ASC students as substitutes
                    );

                    if (possibleSubstitutes.length >= 2) {
                        const substitutes = this.getRandomItems(possibleSubstitutes, 2);
                        substitutes.forEach(sub => {
                            group.push({ ...sub, isSubstitute: true });
                            assignedStudents.add(sub.name);
                        });
                    } else {
                        // Not enough students for substitutes, use duplicates from other groups
                        const duplicates = this.getRandomItems(this.students.filter(s => s.tag !== 'ASC'), 2);
                        duplicates.forEach(dup => {
                            group.push({ ...dup, isSubstitute: true, isDuplicate: true });
                        });
                    }

                    sessionGroups.push(group);
                    assignedStudents.add(ascStudent.name);
                }
            }

            // Now handle remaining students without ASC
            const remainingStudents = this.students.filter(s => !assignedStudents.has(s.name));
            this.shuffleArray(remainingStudents);

            // Calculate how many groups we need for remaining students
            const groupsNeeded = Math.ceil(remainingStudents.length / coreGroupSize);

            for (let i = 0; i < groupsNeeded; i++) {
                // Get the next batch of students for the core group
                const startIdx = i * coreGroupSize;
                const endIdx = Math.min(startIdx + coreGroupSize, remainingStudents.length);
                const coreMembers = remainingStudents.slice(startIdx, endIdx);

                // If we don't have enough students for a complete core group, supplement with duplicates
                if (coreMembers.length < coreGroupSize) {
                    const duplicatesNeeded = coreGroupSize - coreMembers.length;
                    const duplicates = this.getRandomItems(this.students.filter(s => s.tag !== 'ASC'), duplicatesNeeded);
                    duplicates.forEach(dup => {
                        coreMembers.push({ ...dup, isDuplicate: true });
                    });
                }

                // Add substitutes from the remaining students if possible
                const group = [...coreMembers];
                const availableForSubs = this.students.filter(s =>
                    !coreMembers.some(member => member.name === s.name) &&
                    !assignedStudents.has(s.name) &&
                    s.tag !== 'ASC' // No ASC students as substitutes
                );

                if (availableForSubs.length >= 2) {
                    const substitutes = this.getRandomItems(availableForSubs, 2);
                    substitutes.forEach(sub => {
                        group.push({ ...sub, isSubstitute: true });
                        assignedStudents.add(sub.name);
                    });
                } else {
                    // Not enough students for substitutes, use duplicates
                    const duplicateSubs = this.getRandomItems(this.students.filter(s => s.tag !== 'ASC'), 2);
                    duplicateSubs.forEach(dup => {
                        group.push({ ...dup, isSubstitute: true, isDuplicate: true });
                    });
                }

                // Add the group to the session
                sessionGroups.push(group);

                // Mark core members as assigned
                coreMembers.forEach(member => {
                    if (!member.isDuplicate) {
                        assignedStudents.add(member.name);
                    }
                });
            }

            // Shuffle the order of groups in this session
            this.shuffleArray(sessionGroups);

            // Add the session to our sessions array
            this.sessions.push(sessionGroups);
        }

        // Enable export button
        document.getElementById('exportSessionsBtn').disabled = false;
        document.getElementById('exportSessionsBtn').classList.remove('btn-disabled');

        // Display the results
        this.renderSessions();

        this.showStatus("Successfully generated groups for 12 sessions with substitutes.");
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

                        // Count core members and substitutes
                        const coreMembers = group.filter(s => !s.isSubstitute);
                        const substitutes = group.filter(s => s.isSubstitute);

                        const groupHeader = document.createElement('div');
                        groupHeader.className = 'group-header';
                        groupHeader.innerHTML = `
                            <span>Group ${groupIndex + 1}</span>
                            <span class="tooltip">
                                <i class="fas fa-info-circle"></i>
                                <span class="tooltip-text">${coreMembers.length} core + ${substitutes.length} substitutes</span>
                            </span>
                        `;

                        // Create core members list
                        const coreList = document.createElement('div');
                        coreList.className = 'student-section';

                        const coreTitle = document.createElement('div');
                        coreTitle.className = 'section-title';
                        coreTitle.textContent = 'Core Members';
                        coreList.appendChild(coreTitle);

                        const coreStudentsList = document.createElement('ul');
                        coreStudentsList.className = 'students-list';

                        coreMembers.forEach(student => {
                            const studentItem = document.createElement('li');
                            studentItem.className = `student-item student-id-${student.id}`;
                            if (student.tag === 'ASC') studentItem.classList.add('student-asc');
                            if (student.isDuplicate) studentItem.classList.add('student-duplicate');

                            studentItem.innerHTML = `
                                <span class="student-name"><span class="student-id">#${student.id}</span> ${student.name}</span>
                                <span class="tag tag-${student.tag.toLowerCase()}">${student.tag}</span>
                            `;

                            coreStudentsList.appendChild(studentItem);
                        });

                        coreList.appendChild(coreStudentsList);

                        // Create substitutes list
                        const subList = document.createElement('div');
                        subList.className = 'student-section substitutes-section';

                        const subTitle = document.createElement('div');
                        subTitle.className = 'section-title';
                        subTitle.textContent = 'Substitutes';
                        subList.appendChild(subTitle);

                        const subStudentsList = document.createElement('ul');
                        subStudentsList.className = 'students-list';

                        substitutes.forEach(student => {
                            const studentItem = document.createElement('li');
                            studentItem.className = `student-item student-id-${student.id} student-substitute`;
                            if (student.tag === 'ASC') studentItem.classList.add('student-asc');
                            if (student.isDuplicate) studentItem.classList.add('student-duplicate');

                            studentItem.innerHTML = `
                                <span class="student-name"><span class="student-id">#${student.id}</span> ${student.name}</span>
                                <span class="tag tag-${student.tag.toLowerCase()}">${student.tag}</span>
                            `;

                            subStudentsList.appendChild(studentItem);
                        });

                        subList.appendChild(subStudentsList);

                        // Assemble the group card
                        groupCard.appendChild(groupHeader);
                        groupCard.appendChild(coreList);
                        groupCard.appendChild(subList);
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
            const headerRow = ["Group", "Role", "Student ID", "Name", "Tag"];
            sessionData.push(headerRow);

            // Add data rows
            session.forEach((group, groupIndex) => {
                group.forEach(student => {
                    sessionData.push([
                        `Group ${groupIndex + 1}`,
                        student.isSubstitute ? 'Substitute' : 'Core',
                        student.id,
                        student.name,
                        student.tag + (student.isDuplicate ? ' (Duplicate)' : '')
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
