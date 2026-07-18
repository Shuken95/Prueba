// ========== SUPABASE AUTH ==========
// Mismo backend que Nura — Wellness Glass la reemplaza en el mismo dominio
const SUPA_URL = 'https://ijrhkdpdkocqrzmqdtnx.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcmhrZHBka29jcXJ6bXFkdG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0Mzc2ODYsImV4cCI6MjA5NDAxMzY4Nn0.KKr8KKkwesBr1SHp26NQ9W-yuMKSrVNjzdchW7EQGsU';
const supa = supabase.createClient(SUPA_URL, SUPA_KEY, {
    auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
    }
});

let currentUser = null;

// Scopes de Google Fit — se piden en el momento del login (mismo flujo que Nura)
const FITNESS_SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.location.read'
].join(' ');

async function loginWithGoogle() {
    const btn = document.querySelector('.login-btn-google');
    if (btn) { btn.disabled = true; btn.textContent = 'Conectando...'; }

    try {
        const { error } = await supa.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href,
                scopes: FITNESS_SCOPES,
                queryParams: { access_type: 'offline', prompt: 'consent' }
            }
        });
        if (error) throw error;
    } catch (err) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Continuar con Google';
        }
        showLoginError('Error: ' + (err.message || 'No se pudo conectar con Google.'));
    }
}

function continueOffline() {
    document.getElementById('loginScreen').classList.add('hide');
}

async function accountSignOut() {
    await supa.auth.signOut();
    currentUser = null;
    updateAccountUI(null);
    document.getElementById('loginScreen').classList.remove('hide');
}

function showLoginError(message) {
    let errDiv = document.getElementById('loginError');
    if (!errDiv) {
        errDiv = document.createElement('div');
        errDiv.id = 'loginError';
        errDiv.className = 'login-error';
        document.getElementById('loginScreen').appendChild(errDiv);
    }
    errDiv.textContent = message;
}

function updateAccountUI(user) {
    const avatarEl = document.querySelector('.profile-avatar');
    const avatarSpan = avatarEl ? avatarEl.querySelector('span') : null;
    const nameEl = document.querySelector('.profile-name');
    const infoEl = document.getElementById('accountRowInfo');
    const actionEl = document.getElementById('accountRowAction');

    if (user) {
        if (avatarEl && user.user_metadata?.avatar_url) {
            avatarEl.style.backgroundImage = `url(${user.user_metadata.avatar_url})`;
            avatarEl.style.backgroundSize = 'cover';
            if (avatarSpan) avatarSpan.style.display = 'none';
        } else if (avatarSpan) {
            avatarSpan.textContent = (user.email || '?')[0].toUpperCase();
        }
        if (nameEl) nameEl.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
        if (infoEl) infoEl.textContent = user.email || 'Conectado con Google';
        if (actionEl) {
            actionEl.textContent = 'Cerrar sesión';
            actionEl.onclick = accountSignOut;
        }
    } else {
        if (infoEl) infoEl.textContent = 'Usando sin cuenta';
        if (actionEl) {
            actionEl.textContent = 'Iniciar sesión';
            actionEl.onclick = loginWithGoogle;
        }
    }
}

supa.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateAccountUI(null);
        return;
    }
    if (session?.user) {
        currentUser = session.user;
        updateAccountUI(session.user);
        document.getElementById('loginScreen')?.classList.add('hide');
    }
});

(async function initAuth() {
    try {
        const { data: { session } } = await supa.auth.getSession();
        if (session?.user) {
            currentUser = session.user;
            updateAccountUI(session.user);
        } else {
            document.getElementById('loginScreen')?.classList.remove('hide');
        }
    } catch (err) {
        console.log('No se pudo comprobar la sesión, continuando sin cuenta');
        document.getElementById('loginScreen')?.classList.remove('hide');
    }
})();

// ========== APP STATE ==========
const AppState = {
    calories: 1240,
    caloriesGoal: 2000,
    water: 1.5,
    waterGoal: 2.5,
    steps: 8432,
    stepsGoal: 10000,
    exerciseMinutes: 45,
    exerciseGoalMinutes: 60,
    protein: 85,
    carbs: 142,
    fats: 48,
    settings: {
        notifications: true,
        darkMode: true,
        units: 'metric'
    },
    heightCm: 182,
    weightKg: 74.2,
    weightGoalKg: 70,
    aiApiKey: '',
    chatMessages: [],
    meals: [
        { type: 'breakfast', name: 'Desayuno', desc: 'Avena con frutas, café negro', time: '7:30 AM', calories: 420, icon: 'sun' },
        { type: 'lunch', name: 'Almuerzo', desc: 'Ensalada César con pollo', time: '1:00 PM', calories: 580, icon: 'lunch' },
        { type: 'snack', name: 'Snack', desc: 'Yogur griego con nueces', time: '4:30 PM', calories: 180, icon: 'snack' },
        { type: 'dinner', name: 'Cena', desc: 'Salmón a la parrilla, brócoli', time: '8:00 PM', calories: 520, icon: 'dinner' }
    ]
};

// ========== PERSISTENCE ==========
const STORAGE_KEY = 'wellnessGlassState';

function saveState() {
    const dataToSave = {
        calories: AppState.calories,
        water: AppState.water,
        steps: AppState.steps,
        exerciseMinutes: AppState.exerciseMinutes,
        meals: AppState.meals,
        settings: AppState.settings,
        aiApiKey: AppState.aiApiKey,
        chatMessages: AppState.chatMessages
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        AppState.calories = data.calories ?? AppState.calories;
        AppState.water = data.water ?? AppState.water;
        AppState.steps = data.steps ?? AppState.steps;
        AppState.exerciseMinutes = data.exerciseMinutes ?? AppState.exerciseMinutes;
        AppState.meals = data.meals ?? AppState.meals;
        AppState.settings = data.settings ?? AppState.settings;
        AppState.aiApiKey = data.aiApiKey ?? AppState.aiApiKey;
        AppState.chatMessages = data.chatMessages ?? AppState.chatMessages;
    } catch (e) {
        console.log('No se pudo cargar el estado guardado');
    }
}

// ========== HAPTIC FEEDBACK ==========
// Portado de Nura: vibración táctil en interacciones clave
function haptic(type = 'medium') {
    if (typeof navigator.vibrate === 'function') {
        const patterns = { light: 10, medium: 20, success: [10, 50, 10], error: [50, 30, 50] };
        navigator.vibrate(patterns[type] || 20);
    }
}

// ========== SCREEN NAVIGATION ==========
function switchScreen(screenName) {
    haptic('light');

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
    saveState();
    haptic('light');
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
    updateActivityRings();
    saveState();
    closeAddMealModal();
    haptic('success');
    showToast('Comida registrada correctamente');
}

// ========== ACTIVITY RINGS ==========
// Portado de Nura: los anillos ya existían visualmente, ahora reflejan datos reales
function updateActivityRings() {
    const ringsConfig = [
        { selector: '.rings-svg circle[stroke="url(#gradCal)"]', value: AppState.calories, goal: AppState.caloriesGoal, circumference: 314 },
        { selector: '.rings-svg circle[stroke="url(#gradSteps)"]', value: AppState.steps, goal: AppState.stepsGoal, circumference: 226 },
        { selector: '.rings-svg circle[stroke="#00D4AA"]', value: AppState.exerciseMinutes, goal: AppState.exerciseGoalMinutes, circumference: 138 }
    ];

    ringsConfig.forEach(ring => {
        const circle = document.querySelector(ring.selector);
        if (!circle) return;
        const pct = Math.min(1, ring.value / ring.goal);
        circle.style.strokeDashoffset = Math.round(ring.circumference * (1 - pct));
    });

    const exerciseEl = document.getElementById('exerciseValue');
    if (exerciseEl) exerciseEl.textContent = AppState.exerciseMinutes + ' min';
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
    haptic('light');

    setTimeout(() => {
        showToast('Entrenamiento completado: +45 min');
        AppState.steps += 1200;
        AppState.exerciseMinutes += 45;
        updateStepsDisplay();
        updateActivityRings();
        saveState();
        haptic('success');
    }, 2000);
}

function updateStepsDisplay() {
    document.getElementById('stepsValue').textContent = AppState.steps.toLocaleString();
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

        const key = element.dataset.setting;
        if (key) {
            AppState.settings[key] = isActive;
            saveState();
        }

        haptic('light');
        showToast(label + ' ' + (isActive ? 'activado' : 'desactivado'));
    }
}

function applySettingsUI() {
    document.querySelectorAll('.setting-card[data-setting]').forEach(card => {
        const key = card.dataset.setting;
        const toggle = card.querySelector('.toggle-switch');
        if (toggle && AppState.settings[key] !== undefined) {
            toggle.classList.toggle('active', AppState.settings[key]);
        }
    });
    updateUnitsDisplay();
}

// ========== UNITS (metric / imperial) ==========
function kgToLb(kg) {
    return kg * 2.20462;
}

function cmToFeetInches(cm) {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return feet + "'" + inches + '"';
}

function toggleUnits() {
    AppState.settings.units = AppState.settings.units === 'metric' ? 'imperial' : 'metric';
    updateUnitsDisplay();
    saveState();
    haptic('light');
    showToast('Unidades: ' + (AppState.settings.units === 'metric' ? 'Métrico (kg/cm)' : 'Imperial (lb/ft)'));
}

function updateUnitsDisplay() {
    const imperial = AppState.settings.units === 'imperial';

    const heightVal = document.getElementById('profileHeightValue');
    const heightLabel = document.getElementById('profileHeightLabel');
    if (heightVal && heightLabel) {
        heightVal.textContent = imperial ? cmToFeetInches(AppState.heightCm) : AppState.heightCm;
        heightLabel.textContent = imperial ? 'alto' : 'cm';
    }

    const weightVal = document.getElementById('profileWeightValue');
    const weightLabel = document.getElementById('profileWeightLabel');
    if (weightVal && weightLabel) {
        weightVal.textContent = imperial ? kgToLb(AppState.weightKg).toFixed(1) : AppState.weightKg;
        weightLabel.textContent = imperial ? 'lb' : 'kg';
    }

    const healthWeightVal = document.getElementById('healthWeightValue');
    const healthWeightUnit = document.getElementById('healthWeightUnit');
    if (healthWeightVal && healthWeightUnit) {
        healthWeightVal.textContent = imperial ? kgToLb(AppState.weightKg).toFixed(1) : AppState.weightKg;
        healthWeightUnit.textContent = imperial ? 'lb' : 'kg';
    }

    const goalMeta = document.getElementById('goalWeightMeta');
    if (goalMeta) {
        goalMeta.textContent = 'Meta: ' + (imperial ? kgToLb(AppState.weightGoalKg).toFixed(1) + ' lb' : AppState.weightGoalKg + ' kg');
    }

    const goalDelta = document.getElementById('goalWeightDelta');
    if (goalDelta) {
        const deltaKg = AppState.weightGoalKg - AppState.weightKg;
        const deltaVal = imperial ? kgToLb(deltaKg) : deltaKg;
        const unit = imperial ? 'lb' : 'kg';
        goalDelta.textContent = (deltaVal >= 0 ? '+' : '') + deltaVal.toFixed(1) + ' ' + unit;
    }
}

// ========== AI COACH CHAT ==========
// Portado de Nura: llamada directa al navegador a la API de Anthropic,
// con contexto real de métricas del usuario (mismo patrón que aiFetch/sendChat en Nura)
async function aiFetch(body) {
    const key = AppState.aiApiKey;
    if (!key) {
        throw new Error('Configura tu clave de API en Ajustes primero');
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
            'x-api-key': key
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || ('Error ' + res.status));
    }
    return res.json();
}

function buildCoachSystemPrompt() {
    const dataLines = [
        'Datos de hoy (' + new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) + '):',
        'Calorías: ' + AppState.calories + ' kcal (objetivo ' + AppState.caloriesGoal + ')',
        'Agua: ' + AppState.water + 'L (objetivo ' + AppState.waterGoal + 'L)',
        'Pasos: ' + AppState.steps + ' (objetivo ' + AppState.stepsGoal + ')',
        'Ejercicio: ' + AppState.exerciseMinutes + ' min (objetivo ' + AppState.exerciseGoalMinutes + ' min)'
    ].join('\n');

    return 'Eres un coach de salud personal experto, empático y directo. Respondes en español, en máximo 3-4 frases concisas y accionables. Sin emojis. Tienes acceso a los datos reales del usuario:\n\n' + dataLines + '\n\nUsa estos datos para respuestas personalizadas. No repitas los datos literalmente.';
}

async function sendChat() {
    if (!AppState.aiApiKey) {
        showToast('Configura tu clave de API en Ajustes primero');
        return;
    }

    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    haptic('light');
    input.value = '';

    AppState.chatMessages.push({ role: 'user', text: text, ts: Date.now() });
    saveState();
    renderChatMessages(true);

    const history = AppState.chatMessages.slice(-20).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
    }));

    try {
        const data = await aiFetch({
            model: 'claude-sonnet-4-5',
            max_tokens: 300,
            system: buildCoachSystemPrompt(),
            messages: history
        });
        const reply = (data.content || []).map(c => c.text || '').join('') || 'No pude responder.';
        AppState.chatMessages.push({ role: 'ai', text: reply, ts: Date.now() });
    } catch (err) {
        AppState.chatMessages.push({ role: 'ai', text: '⚠️ ' + err.message, ts: Date.now() });
    }

    saveState();
    renderChatMessages();
}

function renderChatMessages(showTyping) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    container.innerHTML = AppState.chatMessages.map(m =>
        `<div class="chat-bubble ${m.role}">${escapeHtml(m.text)}</div>`
    ).join('') + (showTyping ? '<div class="chat-bubble ai" id="chatTyping">Escribiendo...</div>' : '');

    container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function saveApiKey(value) {
    AppState.aiApiKey = value.trim();
    saveState();
    showToast('Clave de API guardada');
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
    loadState();
    renderMeals();
    updateCaloriesDisplay();
    updateWaterDisplay();
    updateStepsDisplay();
    updateActivityRings();
    applySettingsUI();
    renderChatMessages();

    const apiKeyInput = document.getElementById('aiApiKeyInput');
    if (apiKeyInput) apiKeyInput.value = AppState.aiApiKey;

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
