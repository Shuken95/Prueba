// ========== APP STATE ==========
const defaultState = {
  calories: 1240,
  caloriesGoal: 2000,
  water: 1.5,
  waterGoal: 2.5,
  steps: 8432,
  protein: 85,
  carbs: 142,
  fats: 48,
  meals: [
    { type: 'breakfast', name: 'Desayuno', desc: 'Avena con frutas, cafe negro', time: '7:30 AM', calories: 420, protein: 12, carbs: 68, fats: 8, icon: '\uD83C\uDF05' },
    { type: 'lunch', name: 'Almuerzo', desc: 'Ensalada Cesar con pollo', time: '1:00 PM', calories: 580, protein: 35, carbs: 42, fats: 28, icon: '\u2600\uFE0F' },
    { type: 'snack', name: 'Snack', desc: 'Yogur griego con nueces', time: '4:30 PM', calories: 180, protein: 15, carbs: 12, fats: 10, icon: '\uD83E\uDD5C' },
    { type: 'dinner', name: 'Cena', desc: 'Salmon a la parrilla, brocoli', time: '8:00 PM', calories: 520, protein: 38, carbs: 8, fats: 22, icon: '\uD83C\uDF19' }
  ],
  profile: {
    name: 'Alex Martinez',
    age: 28,
    height: 182,
    weight: 74.2,
    goalWeight: 70,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'lose_weight',
    dietType: 'balanced',
    restrictions: '',
    trainingFocus: 'full_body',
    trainingDays: 4,
    cuisinePrefs: '',
    onboardingComplete: false
  },
  settings: { notifications: true, darkMode: true, units: 'metric' },
  apiKey: '',
  exerciseMinutes: 45,
  stressLevel: 40,
  heartRate: 72,
  sleepHours: 7.7,
  sleepQuality: 85,
  tdee: 0,
  macroTargets: { protein: 0, carbs: 0, fats: 0 }
};

let AppState = JSON.parse(JSON.stringify(defaultState));
const mealIcons = { breakfast: '\uD83C\uDF05', lunch: '\u2600\uFE0F', snack: '\uD83E\uDD5C', dinner: '\uD83C\uDF19' };
const mealNames = { breakfast: 'Desayuno', lunch: 'Almuerzo', snack: 'Snack', dinner: 'Cena' };

// Activity multipliers for TDEE
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

// Goal calorie adjustments
const GOAL_ADJUSTMENTS = {
  lose_weight: -500,
  maintain: 0,
  gain_muscle: 300,
  performance: 200
};

// Macro distributions by goal (%)
const MACRO_RATIOS = {
  lose_weight: { protein: 0.40, carbs: 0.30, fats: 0.30 },
  maintain: { protein: 0.30, carbs: 0.40, fats: 0.30 },
  gain_muscle: { protein: 0.35, carbs: 0.45, fats: 0.20 },
  performance: { protein: 0.30, carbs: 0.50, fats: 0.20 }
};

// ========== LOCAL STORAGE ==========
function loadState() {
  const saved = localStorage.getItem('wellnessGlassState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      AppState = { ...defaultState, ...parsed };
      if (parsed.meals) AppState.meals = parsed.meals;
      if (parsed.profile) AppState.profile = { ...defaultState.profile, ...parsed.profile };
      if (parsed.macroTargets) AppState.macroTargets = parsed.macroTargets;
      if (parsed.tdee) AppState.tdee = parsed.tdee;
    } catch(e) { console.error('Error loading state', e); }
  }
}
function saveState() {
  localStorage.setItem('wellnessGlassState', JSON.stringify(AppState));
}
function resetData() {
  if (confirm('\u00BFEstas seguro de que quieres borrar todos los datos?')) {
    localStorage.removeItem('wellnessGlassState');
    AppState = JSON.parse(JSON.stringify(defaultState));
    initApp();
    showToast('\uD83D\uDDD1\uFE0F Datos restablecidos');
  }
}

// ========== TDEE & MACRO CALCULATION ==========
function calculateTDEE() {
  const p = AppState.profile;
  let bmr;
  if (p.gender === 'female') {
    bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  } else {
    bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + 5;
  }
  const multiplier = ACTIVITY_MULTIPLIERS[p.activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);
  const adjustment = GOAL_ADJUSTMENTS[p.goal] || 0;
  AppState.tdee = tdee;
  AppState.caloriesGoal = tdee + adjustment;
  AppState.profile.goalCal = AppState.caloriesGoal;

  const ratios = MACRO_RATIOS[p.goal] || MACRO_RATIOS.maintain;
  const cal = AppState.caloriesGoal;
  AppState.macroTargets = {
    protein: Math.round((cal * ratios.protein) / 4),
    carbs: Math.round((cal * ratios.carbs) / 4),
    fats: Math.round((cal * ratios.fats) / 9)
  };
}

function getGoalLabel() {
  const labels = {
    lose_weight: 'Perder peso',
    maintain: 'Mantener peso',
    gain_muscle: 'Ganar musculo',
    performance: 'Rendimiento deportivo'
  };
  return labels[AppState.profile.goal] || 'Mantener';
}

function getActivityLabel() {
  const labels = {
    sedentary: 'Sedentario (poco o nada de ejercicio)',
    light: 'Ligero (1-3 dias/semana)',
    moderate: 'Moderado (3-5 dias/semana)',
    active: 'Activo (6-7 dias/semana)',
    very_active: 'Muy activo (trabajo fisico + ejercicio)'
  };
  return labels[AppState.profile.activityLevel] || 'Moderado';
}

function getDietLabel() {
  const labels = {
    balanced: 'Equilibrada',
    vegetarian: 'Vegetariana',
    vegan: 'Vegana',
    keto: 'Cetogenica (Keto)',
    paleo: 'Paleo',
    mediterranean: 'Mediterranea',
    low_carb: 'Baja en carbohidratos'
  };
  return labels[AppState.profile.dietType] || 'Equilibrada';
}

function getTrainingFocusLabel() {
  const labels = {
    full_body: 'Cuerpo completo',
    upper_body: 'Tren superior',
    lower_body: 'Tren inferior',
    core: 'Core y abdomen',
    cardio: 'Cardio y resistencia',
    strength: 'Fuerza pura',
    hypertrophy: 'Hipertrofia muscular',
    flexibility: 'Flexibilidad y movilidad'
  };
  return labels[AppState.profile.trainingFocus] || 'Cuerpo completo';
}

// ========== SCREEN NAVIGATION ==========
const SCREEN_ORDER = ['home', 'meals', 'exercise', 'health', 'profile'];
let currentScreenIndex = 0;
let isScrolling = false;
let scrollTimeout = null;

function getScreenIndex(screenName) {
  return SCREEN_ORDER.indexOf(screenName);
}

function switchScreen(screenName) {
  const idx = getScreenIndex(screenName);
  if (idx === -1) return;
  currentScreenIndex = idx;

  const container = document.querySelector('.screens-container');
  const screenWidth = container.clientWidth;
  container.scrollTo({ left: idx * screenWidth, behavior: 'smooth' });

  document.querySelectorAll('.screen').forEach((s, i) => {
    if (i === idx) s.classList.add('active');
    else s.classList.remove('active');
  });

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const nav = document.querySelector('.nav-item[data-screen="' + screenName + '"]');
  if (nav) nav.classList.add('active');

  // Update content for the new screen
  if (screenName === 'home') updateHome();
  if (screenName === 'meals') renderMeals();
  if (screenName === 'health') updateHealth();
  if (screenName === 'profile') updateProfile();
}

function syncNavFromScroll() {
  const container = document.querySelector('.screens-container');
  const screenWidth = container.clientWidth;
  const idx = Math.round(container.scrollLeft / screenWidth);
  if (idx >= 0 && idx < SCREEN_ORDER.length && idx !== currentScreenIndex) {
    currentScreenIndex = idx;
    const screenName = SCREEN_ORDER[idx];

    document.querySelectorAll('.screen').forEach((s, i) => {
      if (i === idx) s.classList.add('active');
      else s.classList.remove('active');
    });

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const nav = document.querySelector('.nav-item[data-screen="' + screenName + '"]');
    if (nav) nav.classList.add('active');

    if (screenName === 'home') updateHome();
    if (screenName === 'meals') renderMeals();
    if (screenName === 'health') updateHealth();
    if (screenName === 'profile') updateProfile();
  }
}

// Handle scroll end to snap and sync
function setupScrollSync() {
  const container = document.querySelector('.screens-container');
  container.addEventListener('scroll', function() {
    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      isScrolling = false;
      syncNavFromScroll();
    }, 150);
  });

  // Handle resize to recalculate positions
  window.addEventListener('resize', function() {
    const screenWidth = container.clientWidth;
    container.scrollTo({ left: currentScreenIndex * screenWidth, behavior: 'auto' });
  });
}

// ========== ONBOARDING ==========
function showOnboarding() {
  document.getElementById('screen-onboarding').style.display = 'block';
  document.querySelector('.bottom-nav').style.display = 'none';
  document.querySelector('.home-indicator').style.display = 'none';
}
function hideOnboarding() {
  document.getElementById('screen-onboarding').style.display = 'none';
  document.querySelector('.bottom-nav').style.display = 'flex';
  document.querySelector('.home-indicator').style.display = 'block';
  document.querySelector('.nav-item[data-screen="home"]').classList.add('active');
  // Ensure home screen is visible and positioned correctly
  const container = document.querySelector('.screens-container');
  container.scrollTo({ left: 0, behavior: 'auto' });
  currentScreenIndex = 0;
  document.querySelectorAll('.screen').forEach((s, i) => {
    if (i === 0) s.classList.add('active');
    else s.classList.remove('active');
  });
}
function saveOnboarding() {
  const p = AppState.profile;
  p.name = document.getElementById('onbName').value || 'Usuario';
  p.age = parseInt(document.getElementById('onbAge').value) || 28;
  p.height = parseInt(document.getElementById('onbHeight').value) || 175;
  p.weight = parseFloat(document.getElementById('onbWeight').value) || 70;
  p.goalWeight = parseFloat(document.getElementById('onbGoalWeight').value) || 65;
  p.gender = document.getElementById('onbGender').value;
  p.activityLevel = document.getElementById('onbActivity').value;
  p.goal = document.getElementById('onbGoal').value;
  p.dietType = document.getElementById('onbDiet').value;
  p.restrictions = document.getElementById('onbRestrictions').value;
  p.trainingFocus = document.getElementById('onbTrainingFocus').value;
  p.trainingDays = parseInt(document.getElementById('onbTrainingDays').value) || 3;
  p.cuisinePrefs = document.getElementById('onbCuisine').value;
  p.onboardingComplete = true;
  calculateTDEE();
  saveState();
  hideOnboarding();
  updateHome(); updateHealth(); updateProfile();
  showToast('\u2705 Perfil personalizado creado');
}

// ========== HOME ==========
function updateHome() {
  document.getElementById('calValue').textContent = Math.round(AppState.calories).toLocaleString();
  document.getElementById('calGoalDisplay').textContent = AppState.caloriesGoal.toLocaleString();
  document.getElementById('calProgress').style.width = Math.min((AppState.calories / AppState.caloriesGoal) * 100, 100) + '%';
  document.getElementById('waterValue').textContent = AppState.water.toFixed(1) + 'L';
  document.getElementById('waterGoalDisplay').textContent = AppState.waterGoal;
  document.getElementById('waterProgress').style.width = Math.min((AppState.water / AppState.waterGoal) * 100, 100) + '%';
  document.getElementById('stepsValue').textContent = AppState.steps.toLocaleString();
  document.getElementById('exerciseValue').textContent = AppState.exerciseMinutes + ' min';
  document.getElementById('proteinValue').textContent = Math.round(AppState.protein) + 'g';
  document.getElementById('carbsValue').textContent = Math.round(AppState.carbs) + 'g';
  document.getElementById('fatsValue').textContent = Math.round(AppState.fats) + 'g';

  const mt = AppState.macroTargets;
  document.getElementById('proteinBar').style.width = mt.protein ? Math.min((AppState.protein / mt.protein) * 100, 100) + '%' : '72%';
  document.getElementById('carbsBar').style.width = mt.carbs ? Math.min((AppState.carbs / mt.carbs) * 100, 100) + '%' : '78%';
  document.getElementById('fatsBar').style.width = mt.fats ? Math.min((AppState.fats / mt.fats) * 100, 100) + '%' : '56%';

  const hour = new Date().getHours();
  let greeting = 'Buenos dias';
  if (hour >= 14) greeting = 'Buenas tardes';
  if (hour >= 21) greeting = 'Buenas noches';
  document.getElementById('homeGreeting').textContent = greeting + (AppState.profile.name ? ', ' + AppState.profile.name.split(' ')[0] : '');
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  document.getElementById('homeDate').textContent = new Date().toLocaleDateString('es-ES', options);

  // Update macro labels with targets
  document.querySelector('.macro-item:nth-child(1) .macro-label').textContent = 'Proteinas (' + (mt.protein || 120) + 'g)';
  document.querySelector('.macro-item:nth-child(2) .macro-label').textContent = 'Carbos (' + (mt.carbs || 200) + 'g)';
  document.querySelector('.macro-item:nth-child(3) .macro-label').textContent = 'Grasas (' + (mt.fats || 80) + 'g)';
}

// ========== WATER ==========
function addWater() {
  AppState.water = Math.min(AppState.water + 0.25, AppState.waterGoal);
  updateHome();
  saveState();
  showToast('\uD83D\uDCA7 +250ml de agua anadidos');
}

// ========== MEALS ==========
function openAddMealModal() { document.getElementById('addMealModal').classList.add('active'); }
function closeAddMealModal() {
  document.getElementById('addMealModal').classList.remove('active');
  ['mealDesc','mealCalories','mealProtein','mealCarbs','mealFats'].forEach(id => document.getElementById(id).value = '');
}
function saveMeal() {
  const type = document.getElementById('mealType').value;
  const desc = document.getElementById('mealDesc').value;
  const cal = parseInt(document.getElementById('mealCalories').value) || 0;
  const prot = parseInt(document.getElementById('mealProtein').value) || 0;
  const carb = parseInt(document.getElementById('mealCarbs').value) || 0;
  const fat = parseInt(document.getElementById('mealFats').value) || 0;
  if (!desc || !cal) { showToast('\u26A0\uFE0F Completa descripcion y calorias'); return; }
  const now = new Date();
  const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  AppState.meals.push({ type, name: mealNames[type], desc, time: timeStr + ' \u2022 ' + cal + ' kcal', calories: cal, protein: prot, carbs: carb, fats: fat, icon: mealIcons[type] });
  AppState.calories += cal; AppState.protein += prot; AppState.carbs += carb; AppState.fats += fat;
  renderMeals(); updateHome(); saveState(); closeAddMealModal(); showToast('\u2705 Comida registrada');
}
function deleteMeal(index) {
  const m = AppState.meals[index];
  AppState.calories -= m.calories; AppState.protein -= (m.protein || 0);
  AppState.carbs -= (m.carbs || 0); AppState.fats -= (m.fats || 0);
  AppState.meals.splice(index, 1);
  renderMeals(); updateHome(); saveState(); showToast('\uD83D\uDDD1\uFE0F Comida eliminada');
}
function renderMeals() {
  const list = document.getElementById('mealsList');
  list.innerHTML = '';
  AppState.meals.forEach((meal, i) => {
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.innerHTML = '<div class="meal-icon">' + meal.icon + '</div><div class="meal-info"><h3>' + meal.name + '</h3><p>' + meal.desc + '</p><span class="meal-time">' + meal.time + '</span></div><div class="meal-calories">' + meal.calories + '<span>kcal</span></div><button class="meal-delete-btn" onclick="event.stopPropagation();deleteMeal(' + i + ')">\u00D7</button>';
    list.appendChild(card);
  });
}

// ========== EXERCISE ==========
let timerInterval = null, timerSeconds = 0, timerRunning = false;
function startWorkout() {
  document.getElementById('workoutTimerCard').style.display = 'block';
  showToast('\uD83C\uDFCB\uFE0F Entrenamiento iniciado');
}
function toggleTimer() {
  const btn = document.getElementById('timerStartBtn');
  if (timerRunning) {
    clearInterval(timerInterval); timerRunning = false;
    btn.textContent = '\u25B6 Continuar'; btn.className = 'timer-btn start';
  } else {
    timerRunning = true; btn.textContent = '\u23F8 Pausar'; btn.className = 'timer-btn pause';
    timerInterval = setInterval(() => {
      timerSeconds++;
      const h = String(Math.floor(timerSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(timerSeconds % 60).padStart(2, '0');
      document.getElementById('timerDisplay').textContent = h + ':' + m + ':' + s;
    }, 1000);
  }
}
function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const mins = Math.round(timerSeconds / 60);
  if (mins > 0) {
    AppState.exerciseMinutes += mins;
    AppState.steps += Math.floor(mins * 30);
    saveState(); updateHome();
    showToast('\u2705 Entrenamiento: +' + mins + ' min');
  }
  timerRunning = false; timerSeconds = 0; timerInterval = null;
  document.getElementById('timerDisplay').textContent = '00:00:00';
  document.getElementById('timerStartBtn').textContent = '\u25B6 Iniciar'; document.getElementById('timerStartBtn').className = 'timer-btn start';
  document.getElementById('workoutTimerCard').style.display = 'none';
}
function showCategory(cat) {
  const names = { cardio: 'Cardio', strength: 'Fuerza', flex: 'Flexibilidad', balance: 'Equilibrio' };
  showToast('\uD83D\uDCC2 ' + names[cat] + ' \u2014 proximamente mas rutinas');
}

// ========== HEALTH ==========
function updateHealth() {
  document.getElementById('heartRate').innerHTML = AppState.heartRate + '<span>bpm</span>';
  document.getElementById('weightValue').innerHTML = AppState.profile.weight + '<span>kg</span>';
  const diff = (AppState.profile.weight - AppState.profile.goalWeight).toFixed(1);
  document.getElementById('weightChange').textContent = (diff > 0 ? '-' : '+') + Math.abs(diff) + ' kg hasta meta';
  document.getElementById('stressBar').style.width = AppState.stressLevel + '%';
  document.getElementById('stressText').textContent = (AppState.stressLevel < 30 ? 'Bajo' : AppState.stressLevel < 60 ? 'Moderado' : 'Alto') + ' \u2022 ' + AppState.stressLevel + '%';
  document.getElementById('stressStatus').textContent = AppState.stressLevel < 30 ? 'Excelente' : AppState.stressLevel < 60 ? 'Bien' : 'Cuidado';
  document.getElementById('stressStatus').style.color = AppState.stressLevel < 30 ? 'var(--accent-green)' : AppState.stressLevel < 60 ? 'var(--accent-yellow)' : 'var(--accent-coral)';
  document.getElementById('stressRec').textContent = AppState.stressLevel < 30 ? '\u00A1Sigue asi! Manten tu rutina' : AppState.stressLevel < 60 ? 'Recomendado: Meditacion 10 min' : 'Recomendado: Descanso y meditacion 20 min';
  const h = AppState.profile.height / 100;
  const bmi = (AppState.profile.weight / (h * h)).toFixed(1);
  document.getElementById('bmiNumber').textContent = bmi;
  let bmiStatus = 'Normal', bmiColor = 'var(--accent-teal)', marker = 50;
  if (bmi < 18.5) { bmiStatus = 'Bajo peso'; bmiColor = 'var(--accent-teal)'; marker = 15; }
  else if (bmi < 25) { bmiStatus = 'Normal'; bmiColor = 'var(--accent-teal)'; marker = 40 + ((bmi - 18.5) / 6.5) * 30; }
  else if (bmi < 30) { bmiStatus = 'Sobrepeso'; bmiColor = 'var(--accent-yellow)'; marker = 70 + ((bmi - 25) / 5) * 15; }
  else { bmiStatus = 'Obesidad'; bmiColor = 'var(--accent-coral)'; marker = 90; }
  document.getElementById('bmiStatus').textContent = bmiStatus;
  document.getElementById('bmiStatus').style.color = bmiColor;
  document.getElementById('bmiMarker').style.left = marker + '%';
}

// ========== PROFILE ==========
function updateProfile() {
  document.getElementById('profileName').textContent = AppState.profile.name || 'Usuario';
  document.getElementById('avatarLetter').textContent = (AppState.profile.name || 'U').charAt(0).toUpperCase();
  document.getElementById('ageValue').textContent = AppState.profile.age || '--';
  document.getElementById('heightValue').textContent = AppState.profile.height || '--';
  document.getElementById('weightValue2').textContent = AppState.profile.weight || '--';
  document.getElementById('goalWeight').textContent = AppState.profile.goalWeight || '--';
  const diff = (AppState.profile.weight - AppState.profile.goalWeight).toFixed(1);
  document.getElementById('goalWeightDiff').textContent = (diff >= 0 ? '-' : '+') + Math.abs(diff) + ' kg';
  document.getElementById('goalCal').textContent = AppState.caloriesGoal.toLocaleString();
  document.getElementById('goalCalDisplay').textContent = AppState.caloriesGoal.toLocaleString() + ' kcal';
  document.getElementById('goalSteps').textContent = AppState.profile.goalSteps.toLocaleString();
  document.getElementById('goalStepsDisplay').textContent = AppState.profile.goalSteps.toLocaleString();
  document.getElementById('apiKeyInput').value = AppState.apiKey || '';
  updateApiKeyStatus();

  // Update profile summary
  const summaryEl = document.getElementById('profileSummary');
  if (summaryEl) {
    summaryEl.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--text-secondary)">' +
      '<div>\uD83C\uDFAF ' + getGoalLabel() + '</div>' +
      '<div>\uD83D\uDCAA ' + getActivityLabel().split('(')[0] + '</div>' +
      '<div>\uD83E\uDD57 ' + getDietLabel() + '</div>' +
      '<div>\uD83C\uDFCB\uFE0F ' + getTrainingFocusLabel() + '</div>' +
      '<div>\uD83D\uDD25 TDEE: ' + AppState.tdee + ' kcal</div>' +
      '<div>\uD83D\uDCC6 ' + AppState.profile.trainingDays + ' dias/semana</div>' +
      '</div>';
  }
}
function openProfileModal() {
  document.getElementById('editName').value = AppState.profile.name;
  document.getElementById('editAge').value = AppState.profile.age;
  document.getElementById('editHeight').value = AppState.profile.height;
  document.getElementById('editWeight').value = AppState.profile.weight;
  document.getElementById('editGoalWeight').value = AppState.profile.goalWeight;
  document.getElementById('editGoalCal').value = AppState.caloriesGoal;
  document.getElementById('editGoalSteps').value = AppState.profile.goalSteps;
  document.getElementById('profileModal').classList.add('active');
}
function closeProfileModal() { document.getElementById('profileModal').classList.remove('active'); }
function saveProfile() {
  AppState.profile.name = document.getElementById('editName').value || 'Usuario';
  AppState.profile.age = parseInt(document.getElementById('editAge').value) || 28;
  AppState.profile.height = parseInt(document.getElementById('editHeight').value) || 182;
  AppState.profile.weight = parseFloat(document.getElementById('editWeight').value) || 74.2;
  AppState.profile.goalWeight = parseFloat(document.getElementById('editGoalWeight').value) || 70;
  AppState.profile.goalCal = parseInt(document.getElementById('editGoalCal').value) || 2000;
  AppState.profile.goalSteps = parseInt(document.getElementById('editGoalSteps').value) || 10000;
  AppState.caloriesGoal = AppState.profile.goalCal;
  calculateTDEE();
  saveState(); updateProfile(); updateHome(); updateHealth(); closeProfileModal(); showToast('\u2705 Perfil actualizado');
}
function toggleSetting(el) {
  const toggle = el.querySelector('.toggle-switch');
  if (toggle) { toggle.classList.toggle('active'); showToast((toggle.classList.contains('active') ? '\u2705 ' : '\u274C ') + el.querySelector('.setting-label').textContent + ' ' + (toggle.classList.contains('active') ? 'activado' : 'desactivado')); }
}
function openUnitsModal() { showToast('\uD83D\uDCCF Unidades: ' + (AppState.settings.units === 'metric' ? 'Metrico' : 'Imperial')); }

// ========== AI INTEGRATION ==========
function getApiKey() { return AppState.apiKey || ''; }
function saveApiKey() {
  AppState.apiKey = document.getElementById('apiKeyInput').value.trim();
  saveState(); updateApiKeyStatus();
  showToast(AppState.apiKey ? '\uD83D\uDD11 API key guardada' : '\uD83D\uDD11 API key eliminada');
}
function updateApiKeyStatus() {
  const status = document.getElementById('apiKeyStatus');
  if (!AppState.apiKey) { status.textContent = 'Introduce tu API key para activar la IA'; status.className = 'api-key-status pending'; }
  else if (AppState.apiKey.startsWith('sk-') && AppState.apiKey.length > 20) { status.textContent = '\u2705 API key configurada correctamente'; status.className = 'api-key-status ok'; }
  else { status.textContent = '\u26A0\uFE0F La API key no parece valida'; status.className = 'api-key-status error'; }
}

function buildSystemPrompt() {
  const p = AppState.profile;
  const mt = AppState.macroTargets;
  let prompt = 'Eres un asistente de salud y fitness EXPERTO y PERSONALIZADO. ';
  prompt += 'PERFIL DEL USUARIO: ' + p.name + ', ' + p.age + ' anos, ' + p.gender + ', ' + p.height + 'cm, ' + p.weight + 'kg. ';
  prompt += 'OBJETIVO: ' + getGoalLabel() + '. Peso meta: ' + p.goalWeight + 'kg. ';
  prompt += 'NIVEL DE ACTIVIDAD: ' + getActivityLabel() + '. ';
  prompt += 'TIPO DE DIETA: ' + getDietLabel() + '. ';
  prompt += p.restrictions ? 'RESTRICCIONES: ' + p.restrictions + '. ' : '';
  prompt += 'ENFOQUE DE ENTRENAMIENTO: ' + getTrainingFocusLabel() + ', ' + p.trainingDays + ' dias/semana. ';
  prompt += 'PREFERENCIAS CULINARIAS: ' + (p.cuisinePrefs || 'Ninguna especifica') + '. ';
  prompt += 'TDEE CALCULADO: ' + AppState.tdee + ' kcal. Meta diaria: ' + AppState.caloriesGoal + ' kcal. ';
  prompt += 'MACROS OBJETIVO: Proteinas ' + mt.protein + 'g, Carbohidratos ' + mt.carbs + 'g, Grasas ' + mt.fats + 'g. ';
  prompt += 'PROGRESO DE HOY: ' + Math.round(AppState.calories) + '/' + AppState.caloriesGoal + ' kcal consumidas, ';
  prompt += Math.round(AppState.protein) + '/' + mt.protein + 'g prot, ';
  prompt += Math.round(AppState.carbs) + '/' + mt.carbs + 'g carb, ';
  prompt += Math.round(AppState.fats) + '/' + mt.fats + 'g grasa, ';
  prompt += AppState.water.toFixed(1) + 'L agua, ' + AppState.steps.toLocaleString() + ' pasos, ';
  prompt += AppState.exerciseMinutes + ' min ejercicio. ';
  prompt += 'INSTRUCCIONES: Adapta TODAS tus respuestas a este perfil. ';
  prompt += 'Responde en espanol. Se preciso, motivador y practico. ';
  prompt += 'Cuando recomiendes comidas, respeta el tipo de dieta y restricciones. ';
  prompt += 'Cuando recomiendes ejercicios, respeta el enfoque de entrenamiento y dias disponibles. ';
  prompt += 'Ajusta las calorias y macros de tus recomendaciones a los objetivos del usuario. ';
  prompt += 'Si el usuario esta por debajo de su meta de proteinas, sugiere alimentos ricos en proteina. ';
  prompt += 'Si el usuario esta cerca de su limite calorico, sugiere opciones bajas en calorias.';
  return prompt;
}

async function callOpenAI(messages, temperature) {
  temperature = temperature || 0.7;
  const key = getApiKey();
  if (!key) throw new Error('No API key configured');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: messages, temperature: temperature, max_tokens: 1500 })
  });
  if (!res.ok) {
    const err = await res.json().catch(function() { return {}; });
    throw new Error(err.error ? err.error.message : 'Error ' + res.status);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ========== AI CHAT ==========
function openAIChat() { switchScreen('ai-chat'); }
function sendQuickMessage(text) { document.getElementById('aiChatInput').value = text; sendAIMessage(); }
function addAIMessage(text, role) {
  const container = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = 'ai-message ' + role;
  if (role === 'assistant') {
    div.innerHTML = text + '<span class="msg-time">' + new Date().toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'}) + '</span>';
  } else {
    div.textContent = text;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
function showAILoading() {
  const container = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = 'ai-message assistant';
  div.id = 'aiLoadingMsg';
  div.innerHTML = '<div class="ai-loading"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
function hideAILoading() {
  const el = document.getElementById('aiLoadingMsg');
  if (el) el.remove();
}
async function sendAIMessage() {
  const input = document.getElementById('aiChatInput');
  const text = input.value.trim();
  if (!text) return;
  if (!getApiKey()) { showToast('\u26A0\uFE0F Configura tu API key en Perfil primero'); switchScreen('profile'); return; }
  addAIMessage(text, 'user');
  input.value = '';
  showAILoading();
  document.getElementById('aiSendBtn').disabled = true;
  try {
    const systemMsg = buildSystemPrompt();
    const response = await callOpenAI([{role:'system', content:systemMsg}, {role:'user', content:text}]);
    hideAILoading();
    addAIMessage(response, 'assistant');
  } catch(e) {
    hideAILoading();
    addAIMessage('\u274C Error: ' + e.message, 'assistant');
  }
  document.getElementById('aiSendBtn').disabled = false;
}

// ========== AI MEAL ANALYZER ==========
function openAIMealAnalyzer() { switchScreen('ai-meal'); }
async function analyzeMealWithAI() {
  const input = document.getElementById('mealAnalyzerInput');
  const text = input.value.trim();
  if (!text) { showToast('\u26A0\uFE0F Describe la comida primero'); return; }
  if (!getApiKey()) { showToast('\u26A0\uFE0F Configura tu API key en Perfil'); switchScreen('profile'); return; }
  const btn = document.getElementById('analyzeMealBtn');
  const result = document.getElementById('mealAnalyzerResult');
  btn.disabled = true; btn.textContent = '\u23F3 Analizando...';
  try {
    const systemMsg = buildSystemPrompt() + ' Analiza la comida que el usuario describe y devuelve SOLO un objeto JSON.';
    const prompt = 'Analiza esta comida y devuelve SOLO un objeto JSON con este formato exacto: {"name":"Nombre corto","calories":123,"protein":12,"carbs":34,"fats":10,"description":"Breve descripcion"}. Comida: ' + text;
    const response = await callOpenAI([{role:'system', content:systemMsg}, {role:'user', content:prompt}], 0.3);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!data) throw new Error('No se pudo parsear la respuesta');
    result.innerHTML = '<div class="recipe-card"><h3>\uD83C\uDF7D\uFE0F ' + escapeHtml(data.name) + '</h3><div class="recipe-meta"><span>\uD83D\uDD25 ' + data.calories + ' kcal</span><span>\uD83E\uDD69 ' + data.protein + 'g prot</span><span>\uD83C\uDF5E ' + data.carbs + 'g carb</span><span>\uD83E\uDD51 ' + data.fats + 'g grasa</span></div><p>' + escapeHtml(data.description) + '</p><div class="recipe-actions"><button class="recipe-btn" onclick="addAnalyzedMeal(\'' + escapeJs(data.name) + '\',' + data.calories + ',' + data.protein + ',' + data.carbs + ',' + data.fats + ')">\u2795 Anadir al diario</button></div></div>';
  } catch(e) {
    result.innerHTML = '<div style="padding:12px;background:rgba(255,107,107,0.1);border-radius:12px;color:var(--accent-coral);font-size:13px">\u274C Error: ' + escapeHtml(e.message) + '</div>';
  }
  btn.disabled = false; btn.textContent = '\uD83D\uDD0D Analizar Comida';
}
function addAnalyzedMeal(name, cal, prot, carb, fat) {
  const now = new Date();
  const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  AppState.meals.push({ type:'snack', name:'Analizado', desc:name, time:timeStr + ' \u2022 ' + cal + ' kcal', calories:cal, protein:prot, carbs:carb, fats:fat, icon:'\uD83E\uDD16' });
  AppState.calories += cal; AppState.protein += prot; AppState.carbs += carb; AppState.fats += fat;
  saveState(); updateHome(); showToast('\u2705 Comida anadida al diario');
}

// ========== AI WORKOUT GENERATOR ==========
function openAIWorkout() { switchScreen('ai-workout'); }
async function generateWorkoutWithAI() {
  const type = document.getElementById('workoutType').value;
  const level = document.getElementById('workoutLevel').value;
  const duration = document.getElementById('workoutDuration').value;
  const equipment = document.getElementById('workoutEquipment').value;
  if (!getApiKey()) { showToast('\u26A0\uFE0F Configura tu API key en Perfil'); switchScreen('profile'); return; }
  const btn = document.getElementById('generateWorkoutBtn');
  const result = document.getElementById('workoutGeneratorResult');
  btn.disabled = true; btn.textContent = '\u23F3 Generando...';
  try {
    const systemMsg = buildSystemPrompt() + ' Genera una rutina de entrenamiento personalizada.';
    const prompt = 'Crea una rutina de entrenamiento de ' + duration + ' minutos para nivel ' + level + ', tipo ' + type + '. Equipo: ' + (equipment || 'ninguno especifico') + '. Devuelve SOLO un array JSON de objetos con formato: [{"name":"Nombre del ejercicio","sets":"3x12","rest":"60s","notes":"Nota opcional"}]. Maximo 8 ejercicios.';
    const response = await callOpenAI([{role:'system', content:systemMsg}, {role:'user', content:prompt}], 0.5);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    const exercises = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    if (!exercises.length) throw new Error('No se generaron ejercicios');
    let html = '<div style="font-size:14px;font-weight:600;margin-bottom:12px">\uD83C\uDFCB\uFE0F Tu rutina personalizada</div>';
    exercises.forEach(function(ex, i) {
      html += '<div class="exercise-item" style="margin-bottom:8px"><span>' + (i+1) + '. ' + escapeHtml(ex.name) + '</span><span class="exercise-sets">' + escapeHtml(ex.sets) + '</span></div>';
      if (ex.notes) html += '<div style="font-size:11px;color:var(--text-tertiary);margin:-4px 0 8px 20px">' + escapeHtml(ex.notes) + '</div>';
    });
    html += '<button class="start-workout-btn" style="margin-top:12px" onclick="switchScreen(\'exercise\')">\u25B6 Ir a entrenar</button>';
    result.innerHTML = html;
  } catch(e) {
    result.innerHTML = '<div style="padding:12px;background:rgba(255,107,107,0.1);border-radius:12px;color:var(--accent-coral);font-size:13px">\u274C Error: ' + escapeHtml(e.message) + '</div>';
  }
  btn.disabled = false; btn.textContent = '\u26A1 Generar Rutina';
}

// ========== AI RECIPE GENERATOR ==========
function openAIRecipes() { switchScreen('ai-recipes'); }
async function generateRecipeWithAI() {
  const type = document.getElementById('recipeType').value;
  const prefs = document.getElementById('recipePrefs').value;
  const maxCal = document.getElementById('recipeMaxCal').value;
  if (!getApiKey()) { showToast('\u26A0\uFE0F Configura tu API key en Perfil'); switchScreen('profile'); return; }
  const btn = document.getElementById('generateRecipeBtn');
  const result = document.getElementById('recipeGeneratorResult');
  btn.disabled = true; btn.textContent = '\u23F3 Generando...';
  try {
    const systemMsg = buildSystemPrompt() + ' Genera una receta saludable personalizada.';
    const prompt = 'Crea una receta saludable' + (type !== 'any' ? ' para ' + type : '') + (prefs ? ' (' + prefs + ')' : '') + ' con maximo ' + maxCal + ' kcal por porcion. Devuelve SOLO un objeto JSON: {"name":"Nombre","calories":123,"protein":12,"carbs":34,"fats":10,"ingredients":["ing1","ing2"],"instructions":"Paso 1. Paso 2.","time":"30 min","servings":2}';
    const response = await callOpenAI([{role:'system', content:systemMsg}, {role:'user', content:prompt}], 0.7);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const recipe = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!recipe) throw new Error('No se pudo parsear la receta');
    result.innerHTML = '<div class="recipe-card"><h3>\uD83C\uDF73 ' + escapeHtml(recipe.name) + '</h3><div class="recipe-meta"><span>\u23F1\uFE0F ' + escapeHtml(recipe.time) + '</span><span>\uD83D\uDD25 ' + recipe.calories + ' kcal</span><span>\uD83C\uDF7D\uFE0F ' + recipe.servings + ' porciones</span><span>\uD83E\uDD69 ' + recipe.protein + 'g prot</span></div><p style="margin-bottom:8px"><strong>Ingredientes:</strong></p><p style="margin-bottom:12px">' + escapeHtml(recipe.ingredients.join(', ')) + '</p><p style="margin-bottom:8px"><strong>Preparacion:</strong></p><p>' + escapeHtml(recipe.instructions) + '</p><div class="recipe-actions"><button class="recipe-btn primary" onclick="addRecipeToMeals(\'' + escapeJs(recipe.name) + '\',' + recipe.calories + ',' + recipe.protein + ',' + recipe.carbs + ',' + recipe.fats + ')">\u2795 Anadir al diario</button></div></div>';
  } catch(e) {
    result.innerHTML = '<div style="padding:12px;background:rgba(255,107,107,0.1);border-radius:12px;color:var(--accent-coral);font-size:13px">\u274C Error: ' + escapeHtml(e.message) + '</div>';
  }
  btn.disabled = false; btn.textContent = '\uD83C\uDF73 Generar Receta';
}
function addRecipeToMeals(name, cal, prot, carb, fat) {
  const now = new Date();
  const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  AppState.meals.push({ type:'dinner', name:'Receta IA', desc:name, time:timeStr + ' \u2022 ' + cal + ' kcal', calories:cal, protein:prot, carbs:carb, fats:fat, icon:'\uD83C\uDF73' });
  AppState.calories += cal; AppState.protein += prot; AppState.carbs += carb; AppState.fats += fat;
  saveState(); updateHome(); showToast('\u2705 Receta anadida al diario');
}

// ========== UTILITIES ==========
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg; toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2500);
}
function updateTime() {
  const now = new Date();
  document.getElementById('statusTime').textContent = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
}

// ========== INIT ==========
function initApp() {
  loadState();

  // Calculate TDEE and macros if not done
  if (!AppState.tdee || AppState.tdee === 0) {
    calculateTDEE();
  }

  // Show onboarding if not complete
  if (!AppState.profile.onboardingComplete) {
    showOnboarding();
  }

  updateTime(); setInterval(updateTime, 60000);
  updateHome(); renderMeals(); updateHealth(); updateProfile();

  // Setup horizontal scroll sync
  setupScrollSync();

  // Prevent body scroll but allow screens-container scroll
  document.body.addEventListener('touchmove', function(e) {
    const target = e.target;
    const inContainer = target.closest('.screens-container');
    const inModal = target.closest('.modal-content');
    if (inContainer || inModal) return;
    e.preventDefault();
  }, { passive: false });

  let lastTouch = 0;
  document.addEventListener('touchend', function(e) { const now = Date.now(); if (now - lastTouch <= 300) e.preventDefault(); lastTouch = now; }, { passive: false });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() { console.log('SW registration failed'); });
  }
}
document.addEventListener('DOMContentLoaded', initApp);