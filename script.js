

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const jsonUpload = document.getElementById('jsonUpload');
    const curriculumGrid = document.getElementById('curriculumGrid');
    const totalUcSpan = document.getElementById('totalUc');
    const careerModal = document.getElementById('careerModal'); // <- Nuevo: Referencia al popup

    let courseData = [];
    let completedCourses = new Set();

    

    // --- Función para cargar y renderizar una malla curricular ---
    function loadCurriculum(fileName) {
        fetch(`data/${fileName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`No se pudo cargar el archivo ${fileName}.`);
                }
                return response.json();
            })
            .then(data => {
                courseData = data;
                console.log(courseData);
                completedCourses = new Set(); // Reiniciar materias completadas
                renderCurriculum();
                careerModal.style.display = 'none'; // Ocultar el popup después de cargar
            })
            .catch(error => {
                alert('Error al cargar la malla curricular.');
                console.error(error);
            });
    }
    
    // --- Lógica del Popup de Selección de Carrera ---
    careerModal.addEventListener('click', (event) => {
        // Comprobar si se hizo clic en un botón con el atributo 'data-file'
        const targetButton = event.target.closest('button[data-file]');
        if (targetButton) {
            const fileName = targetButton.dataset.file;
            loadCurriculum(fileName);
        }
    });

    // Función para actualizar el contador de UC (sin cambios)
    function updateUcCounter() {
        let totalUc = 0;
        completedCourses.forEach(courseCode => {
            const course = courseData.find(c => c.cod === courseCode);
            if (course && course.uc) {
                totalUc += parseInt(course.uc);
            }
        });
        totalUcSpan.textContent = totalUc;
    }

    // Función para renderizar la malla curricular (sin cambios)
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
                if (course.hell == "yes") {
                    subjectCard.addEventListener('click', showHellMessage);
                    console.log(course.asig)
                } 

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

        updateUcCounter();
    }

    // Función para verificar si una materia se puede desbloquear (sin cambios)
    function canUnlockCourse(courseCode) {
        const course = courseData.find(c => c.cod === courseCode);
        if (!course) return false;
        if (!course.requisitos || course.requisitos.length === 0) {
            return true;
        }
        return course.requisitos.every(req => completedCourses.has(req));
    }

    // Función para marcar/desmarcar una materia (sin cambios)
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
        renderCurriculum();
    }
    
    // Listener para subir un archivo JSON (sin cambios)
    jsonUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    courseData = JSON.parse(e.target.result);
                    completedCourses = new Set();
                    renderCurriculum();
                    careerModal.style.display = 'none'; // Ocultar popup si se sube archivo
                } catch (error) {
                    alert('Error al parsear el archivo JSON.');
                    console.error('Error parsing JSON:', error);
                }
            };
            reader.readAsText(file);
        }
    });

});





// Función para mostrar el overlay
const showHellMessage = () => {
    const overlay = document.getElementById('hell-overlay');
    // Añade la clase 'show' para activar el CSS
    overlay.classList.add('show');

    // Después de 3 segundos (duración de la animación), oculta el overlay
    setTimeout(() => {
        overlay.classList.remove('show');
    }, 3000);
};

// Añadir el evento de clic a cada elemento encontrado

