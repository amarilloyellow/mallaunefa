document.addEventListener('DOMContentLoaded', () => {
    const jsonUpload = document.getElementById('jsonUpload');
    const curriculumGrid = document.getElementById('curriculumGrid');
    const totalUcSpan = document.getElementById('totalUc'); // Nuevo: Span para mostrar las UC totales

    let courseData = [];
    let completedCourses = new Set();

    // Función para actualizar el contador de UC
    function updateUcCounter() {
        let totalUc = 0;
        completedCourses.forEach(courseCode => {
            const course = courseData.find(c => c.cod === courseCode);
            if (course && course.uc) {
                totalUc += parseInt(course.uc); // Sumar las unidades de crédito
            }
        });
        totalUcSpan.textContent = totalUc; // Actualizar el texto del contador
    }

    // Función para renderizar la malla curricular
    function renderCurriculum() {
        curriculumGrid.innerHTML = '';

        const semesters = courseData.reduce((acc, course) => {
            const sem = course.sem.toString();
            if (!acc[sem]) {
                acc[sem] = [];
            }
            acc[sem].push(course);
            return acc;
        }, {});

        const sortedSemesters = Object.keys(semesters).sort((a, b) => parseInt(a) - parseInt(b));

        sortedSemesters.forEach(semNum => {
            const semesterBlock = document.createElement('div');
            semesterBlock.classList.add('semester-block');

            const semesterTitle = document.createElement('h2');
            semesterTitle.classList.add('semester-title');
            semesterTitle.textContent = `Semestre ${semNum}`;
            semesterBlock.appendChild(semesterTitle);

            semesters[semNum].forEach(course => {
                const subjectCard = document.createElement('div');
                subjectCard.classList.add('subject-card');
                subjectCard.dataset.cod = course.cod;
                subjectCard.innerHTML = `
                    <div class="name">${course.asig}</div>
                    <div class="code">${course.cod}</div>`;

                if (completedCourses.has(course.cod)) {
                    subjectCard.classList.add('completed');
                } else if (!canUnlockCourse(course.cod)) {
                    subjectCard.classList.add('locked');
                }

                subjectCard.addEventListener('click', () => toggleCourseCompletion(course.cod));
                semesterBlock.appendChild(subjectCard);
            });
            curriculumGrid.appendChild(semesterBlock);
        });

        updateUcCounter(); // Actualizar el contador cada vez que se renderiza la malla
    }

    function canUnlockCourse(courseCode) {
        const course = courseData.find(c => c.cod === courseCode);
        if (!course) return false;

        if (!course.requisitos || course.requisitos.length === 0) {
            return true;
        }

        return course.requisitos.every(req => completedCourses.has(req));
    }

    function toggleCourseCompletion(courseCode) {
        const courseElement = document.querySelector(`.subject-card[data-cod="${courseCode}"]`);

        if (!courseElement) return;

        if (completedCourses.has(courseCode)) {
            completedCourses.delete(courseCode);
        } else {
            if (canUnlockCourse(courseCode)) {
                completedCourses.add(courseCode);
            } else {
                alert('¡No puedes marcar esta materia! Completa los requisitos primero.');
                return;
            }
        }
        renderCurriculum(); // Llama a renderCurriculum para actualizar la UI y el contador
    }

    jsonUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    courseData = JSON.parse(e.target.result);
                    completedCourses = new Set();
                    renderCurriculum();
                } catch (error) {
                    alert('Error al parsear el archivo JSON. Asegúrate de que el formato sea correcto.');
                    console.error('Error parsing JSON:', error);
                }
            };
            reader.readAsText(file);
        }
    });

    // Opcional: Cargar un archivo JSON de ejemplo al inicio si existe
    fetch('data/plan_de_estudio.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de ejemplo JSON.');
            }
            return response.json();
        })
        .then(data => {
            courseData = data;
            renderCurriculum();
        })
        .catch(error => console.warn(error.message));
});