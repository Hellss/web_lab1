'use strict';

const state = {
    x: 0,
    y: 0.0,
    r: 1,
};


function validateState() {
    if (isNaN(state.x) || state.x < -5 || state.x > 3) {
        return false;
    }

    if (isNaN(state.y) || state.y < -3 || state.y > 3) {
        return false;
    }

    if (isNaN(state.r) || state.r <= 0 || state.r > 5) {
        return false;
    }
    return true;
}


/* this part throws error if y is invalid */
function validateY() {
    const error = document.getElementById('errorY');
    if (isNaN(state.y) || state.y < -3 || state.y > 3) {
        error.hidden = false;
        error.innerText = 'Y must be in [-3;3]';
        throw new Error('Invalid state');
    }
    error.hidden = true;
}


document.getElementById('y').addEventListener('change', validateY);

document.getElementById('x').addEventListener('change', (ev) => {
    state.x = parseInt(ev.target.value);
});

document.getElementById('y').addEventListener('change', (ev) => {
    state.y = parseFloat(ev.target.value);
});

document.querySelectorAll('input[name="r"]').forEach((radio) => {
    radio.addEventListener('change', (ev) => {
        state.r = parseInt(ev.target.value);
        updateShapes();
    });
});


const resultsPerPage = 5; // Количество результатов на странице
let results = []; // Массив для хранения данных
let currentPage = 1; // Текущая страница


// Функция для рендеринга таблицы
function renderTable() {
    const tableBody = document.getElementById('result');
    tableBody.innerHTML = ''; // Очистить таблицу перед рендерингом

    // Рассчитать диапазон записей для текущей страницы
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = Math.min(startIndex + resultsPerPage, results.length);

    // Отобразить записи для текущей страницы
    for (let i = startIndex; i < endIndex; i++) {
        const row = document.createElement('tr');

        const xCell = document.createElement('td');
        xCell.textContent = results[i].x;
        row.appendChild(xCell);

        const yCell = document.createElement('td');
        yCell.textContent = results[i].y;
        row.appendChild(yCell);

        const rCell = document.createElement('td');
        rCell.textContent = results[i].r;
        row.appendChild(rCell);

        const hitCell = document.createElement('td');
        hitCell.textContent = results[i].hit;
        row.appendChild(hitCell);

        const timeCell = document.createElement('td');
        timeCell.textContent = results[i].CurTime;
        row.appendChild(timeCell);

        const scriptTimeCell = document.createElement('td');
        scriptTimeCell.textContent = results[i].ExecutionTime;
        row.appendChild(scriptTimeCell);

        tableBody.appendChild(row);
    }

    updatePaginationControls();
}

// Функция для обновления кнопок пагинации
function updatePaginationControls() {
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = ''; // Очистить перед обновлением

    const totalPages = Math.ceil(results.length / resultsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.disabled = i === currentPage; // Заблокировать текущую страницу
        button.addEventListener('click', () => {
            currentPage = i;
            renderTable();
        });
        paginationControls.appendChild(button);
    }
}

document.getElementById('data-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();

    if (!validateState()) {
        return;
    }


    const table = document.getElementById('result');

    const x = state.x;
    const y = state.y;
    const r = state.r;
    let CurTime = '?';
    let hit = '?';
    let ExecutionTime = '?';

    const params = new URLSearchParams(state);

    const response = await fetch('/fcgi-bin/web_lab1.jar?' + params.toString());

    if (response.ok) {
        const result = await response.json();

        if (result.result) {
            hit = 'Попал';
        } else {
            hit = 'Промазал';
        }

        CurTime = result.currentTime.toString();
        ExecutionTime = (result.executionTimeMs / 1_000_000_000).toString();
    } else if (response.status === 400) {
        const result = await response.json();
        rowResult.textContent = `error: ${result.reason}`;
        console.error(response.status + " " + response.statusText);
    } else {
        rowResult.textContent = `error: ${response.statusText}`;
        console.error(response.status + " " + response.statusText);
    }

    results.unshift({
        x: x,
        y: y,
        r: r,
        hit: hit,
        CurTime: CurTime,
        ExecutionTime: ExecutionTime,
    });

    renderTable();
});

// Первичная инициализация
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
});


/**/
/* ЗДЕСЬ НАЧИНАЕТСЯ ЧАСТЬ С ГРАФИКОМ*/
/**/
function updateShapes() {
    /* get radius */
    const radius = state.r * 24;


    /* redraw triangle */
    const trianglePoints = `150,150 ${150 + radius/2},150 150,${150 + radius/2}`;
    document.getElementById('triangle').setAttribute('points', trianglePoints);

    /* redraw square */
    document.getElementById('square').setAttribute('width', radius);
    document.getElementById('square').setAttribute('height', radius/2);
    document.getElementById('square').setAttribute('y', 150-radius/2);

    /* redraw quarter circle */
    const quarterCirclePath = `M 150 150 L ${150 - radius} 150 A ${radius} ${radius} 0 0 1 150 ${150 - radius} Z`;
    document.getElementById('quarterCircle').setAttribute('d', quarterCirclePath);

}


window.onload = function() { /* this func matches figure to selected Radius after refreshing page */
    // Получаем текущее значение r из поля ввода
    document.querySelectorAll('input[name="r"]').forEach((radio) => {
        radio.addEventListener('change', (ev) => {
            state.r = parseInt(ev.target.value);
            updateShapes();
        });
    });

    // Добавим такие же слушатели на X и Y
    document.getElementById('x').addEventListener('change', (ev) => {
        state.x = parseInt(ev.target.value);
        // updateShapes();
        drawPoint();
    });
    document.getElementById('y').addEventListener('input', (ev) => {
        state.y = parseFloat(ev.target.value);
        // updateShapes();
        validateY();
        drawPoint();
    });

    // Обновляем фигуры на графике при загрузке страницы
    updateShapes();
    drawPoint();
};


// функции для отрисовки точки
function drawPoint() {
    // Вычисляем положение точки относительно центра графика
    const svgCenterX = 150; // Центр по оси X
    const svgCenterY = 150; // Центр по оси Y

    // Масштабируем координаты с учётом радиуса r
    const scaledX = svgCenterX + state.x * 24;
    const scaledY = svgCenterY - state.y * 24; // Отрицательное, чтобы двигать вверх

    // Получаем элемент circle для отрисовки точки или создаём, если его нет
    let pointElement = document.getElementById('point');
    if (!pointElement) {
        pointElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pointElement.setAttribute('id', 'point');
        pointElement.setAttribute('r', 3); // Радиус самой точки
        pointElement.setAttribute('fill', 'red'); // Цвет точки
        document.getElementById('svg').appendChild(pointElement);
    }

    // Устанавливаем новые координаты для точки
    pointElement.setAttribute('cx', scaledX);
    pointElement.setAttribute('cy', scaledY);
}
