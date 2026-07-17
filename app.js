// ========== APP STATE ==========
const AppState = {
    calories: 1240,
    caloriesGoal: 2000,
    water: 1.5,
    waterGoal: 2.5,
    steps: 8432,
    protein: 85,
    carbs: 142,
    fats: 48,
    meals: [
        { type: 'breakfast', name: 'Desayuno', desc: 'Avena con frutas, café negro', time: '7:30 AM', calories: 420, icon: 'sun' },
        { type: 'lunch', name: 'Almuerzo', desc: 'Ensalada César con pollo', time: '1:00 PM', calories: 580, icon: 'lunch' },
        { type: 'snack', name: 'Snack', desc: 'Yogur griego con nueces', time: '4:30 PM', calories: 180, icon: 'snack' },
        { type: 'dinner', name: 'Cena', desc: 'Salmón a la parrilla, brócoli', time: '8:00 PM', calories: 520, icon: 'dinner' }
    ]
};

// ========== SCREEN NAVIGATION ==========
function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    document.getElementById('screen-' + screenName).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.nav-item[data-screen="' + screenName + '"]').classList.add('active');

    document.querySelector('.screens-container').scrollTop = 0;
}

// ========== WATER TRACKING ==========
function addWater() {
    AppState.water = Math.min(AppState.water + 0.25, AppState.waterGoal);
    updateWaterDisplay();
    showToast('+250ml de agua añadidos');
}

function updateWaterDisplay() {
    const waterEl = document.getElementById('waterValue');
    const waterPercent = (AppState.water / AppState.waterGoal) * 100;

    waterEl.textContent = AppState.water.toFixed(1) + 'L';

    const progressBar = document.querySelector('.progress-water');
    if (progressBar) {
        progressBar.style.width = waterPercent + '%';
    }
}

// ========== MEAL MANAGEMENT ==========
function openAddMealModal() {
    document.getElementById('addMealModal').classList.add('active');
}

function closeAddMealModal() {
    document.getElementById('addMealModal').classList.remove('active');
    document.getElementById('mealDesc').value = '';
    document.getElementById('mealCalories').value = '';
}

function saveMeal() {
    const type = document.getElementById('mealType').value;
    const desc = document.getElementById('mealDesc').value;
    const calories = parseInt(document.getElementById('mealCalories').value);

    if (!desc || !calories) {
        showToast('Completa todos los campos');
        return;
    }

    const mealNames = {
        breakfast: 'Desayuno',
        lunch: 'Almuerzo',
        snack: 'Snack',
        dinner: 'Cena'
    };

    const mealIcons = {
        breakfast: 'sun',
        lunch: 'lunch',
        snack: 'snack',
        dinner: 'dinner'
    };

    const now = new Date();
    const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

    const newMeal = {
        type: type,
        name: mealNames[type],
        desc: desc,
        time: timeStr + ' • ' + calories + ' kcal',
        calories: calories,
        icon: mealIcons[type]
    };

    AppState.meals.push(newMeal);
    AppState.calories += calories;

    renderMeals();
    updateCaloriesDisplay();
    closeAddMealModal();
    showToast('Comida registrada correctamente');
}

function renderMeals() {
    const mealsList = document.getElementById('mealsList');
    mealsList.innerHTML = '';

    AppState.meals.forEach(meal => {
        const mealCard = document.createElement('div');
        mealCard.className = 'meal-card';
        mealCard.setAttribute('data-meal', meal.type);
        mealCard.innerHTML = `
            <div class="meal-icon">
                <svg viewBox="0 0 24 24"><use href="icons/svg/${meal.icon}.svg"/></svg>
            </div>
            <div class="meal-info">
                <h3>${meal.name}</h3>
                <p>${meal.desc}</p>
                <span class="meal-time">${meal.time}</span>
            </div>
            <div class="meal-calories">${meal.calories}<span>kcal</span></div>
        `;
        mealsList.appendChild(mealCard);
    });
}

function updateCaloriesDisplay() {
    const calEl = document.getElementById('calValue');
    const calPercent = (AppState.calories / AppState.caloriesGoal) * 100;

    calEl.textContent = AppState.calories.toLocaleString();

    const progressBar = document.querySelector('.progress-cal');
    if (progressBar) {
        progressBar.style.width = Math.min(calPercent, 100) + '%';
    }
}

// ========== EXERCISE ==========
function startWorkout() {
    showToast('Iniciando entrenamiento...');

    setTimeout(() => {
        showToast('Entrenamiento completado: +45 min');
        AppState.steps += 1200;
        document.getElementById('stepsValue').textContent = AppState.steps.toLocaleString();
    }, 2000);
}

function showCategory(category) {
    const categoryNames = {
        cardio: 'Cardio',
        strength: 'Fuerza',
        flex: 'Flexibilidad',
        balance: 'Equilibrio'
    };
    showToast('Abriendo rutinas de ' + categoryNames[category] + '...');
}

// ========== SETTINGS ==========
function toggleSetting(element) {
    const toggle = element.querySelector('.toggle-switch');
    if (toggle) {
        toggle.classList.toggle('active');
        const isActive = toggle.classList.contains('active');
        const label = element.querySelector('.setting-label').textContent;
        showToast(label + ' ' + (isActive ? 'activado' : 'desactivado'));
    }
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ========== STATUS BAR TIME ==========
function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('statusTime').textContent = hours + ':' + minutes;
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    setInterval(updateTime, 60000);

    document.body.addEventListener('touchmove', function(e) {
        if (e.target.closest('.screens-container')) return;
        e.preventDefault();
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {
            console.log('Service Worker registration failed');
        });
    }
});
