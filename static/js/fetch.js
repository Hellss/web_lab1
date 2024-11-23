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

document.getElementById('data-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();

    if (!validateState()) {
        alert('Sorry, you are not able to submit your variables. Some of them are invalid.')
        return;
    }


    const table = document.getElementById('result');

    const newRow = table.insertRow(-1);

    const rowX = newRow.insertCell(0);
    const rowY = newRow.insertCell(1);
    const rowR = newRow.insertCell(2);
    const rowResult = newRow.insertCell(3);

    const rowCurTime = newRow.insertCell(4);
    const rowExecutionTime = newRow.insertCell(5);

    rowX.innerText = state.x;
    rowY.innerText = state.y;
    rowR.innerText = state.r;

    const params = new URLSearchParams(state);

    const response = await fetch('/fcgi-bin/web_lab1.jar?' + params.toString());

    if (response.ok) {
        const result = await response.json();

        rowResult.textContent = result.result.toString();
        if (result.result) {
            rowResult.textContent = 'Попал';
        } else {
            rowResult.textContent = 'Промазал'
        }

        rowCurTime.textContent = result.currentTime.toString();
        rowExecutionTime.textContent = (result.executionTimeMs / 1_000_000_000).toString();
    } else if (response.status === 400) {
        const result = await response.json();
        rowResult.textContent = `error: ${result.reason}`;
        console.error(response.status + " " + response.statusText);
    } else {
        rowResult.textContent = `error: ${response.statusText}`;
        console.error(response.status + " " + response.statusText);
    }
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