// ===== ASL Real-time Recognition App (Integrated AI Mode) =====
import { WORD_LIST } from './dictionary.js';

// Global Variables
let model = null;
let hands = null;
let camera = null;
let isModelLoaded = false;
let isHandsLoaded = false;

// Recognition State
let predictionHistory = [];
let lastPredictionTime = 0;
let letterBuffer = []; // Current word buffer
let completedWords = []; // Completed words list

// Parameters
const CONFIG = {
    CONFIRMATION_THRESHOLD: 4,     // Consecutive frames to confirm letter (0.2s @ 20FPS)
    CONFIDENCE_THRESHOLD: 0.6,     // Minimum confidence
    NO_HAND_THRESHOLD: 20,         // No hand frames to confirm word (1.0s @ 20FPS)
    HISTORY_SIZE: 5                // Prediction history size
};

let lastConfirmedLetter = null;
let confirmationCount = 0;
let noHandCount = 0;
let isAIEnabled = false;  // AI Toggle
let letterJustAdded = false;  // Letter added flag
let cooldownCount = 0;        // Cooldown counter

// ASL Alphabet Labels
const LABELS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'nothing', 'space', 'del' // Special classes
];

// DOM Elements
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const currentLetterDisplay = document.getElementById('currentLetter');
const confidenceDisplay = document.getElementById('confidence');
const letterBufferDisplay = document.getElementById('letterBuffer');
const completedWordsDisplay = document.getElementById('completedWords');
const clearBtn = document.getElementById('clearBtn');
const spaceBtn = document.getElementById('spaceBtn');
const backspaceBtn = document.getElementById('backspaceBtn');
const aiToggle = document.getElementById('aiToggle');

// ===== Initialization =====
async function init() {
    updateStatus('Initializing camera...');

    // Initialize AI Toggle
    if (aiToggle) {
        aiToggle.addEventListener('change', (e) => {
            isAIEnabled = e.target.checked;
            console.log(`AI Assistance is ${isAIEnabled ? 'ON' : 'OFF'}`);

            // Toggle AI result display
            const aiDisplay = document.getElementById('aiResultDisplay');
            if (!isAIEnabled && aiDisplay) {
                aiDisplay.style.display = 'none';
            }
        });
    }

    try {
        // Initialize MediaPipe Hands
        hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });

        hands.onResults(onHandResults);
        isHandsLoaded = true;
        updateStatus('Loading model...');

        // Load TensorFlow.js Model
        await loadModel();

        // Initialize Camera
        await setupCamera();

        updateStatus('Ready', true);

        // Dictionary loaded immediately
        console.log(`Dictionary loaded, total ${WORD_LIST.length} words`);

    } catch (error) {
        console.error('Initialization Failed:', error);
        updateStatus('Init Failed: ' + error.message);
    }
}

// ===== Load Model =====
async function loadModel() {
    try {
        // Try loading default model...
        console.log('Attempting to load default model...');

        // Build different paths to try loading
        // 1. Relative path
        // 2. Absolute path for GitHub Pages (if we know repo name)
        // 3. Current URL base path

        const pathsToTry = [
            './model/model.json',
            'model/model.json',
            // Get current path and append model/model.json
            window.location.href.replace(/\/[^/]*$/, '/model/model.json')
        ];

        let loaded = false;
        let lastError = null;

        for (const path of pathsToTry) {
            try {
                console.log(`Trying to load from: ${path}`);
                model = await tf.loadLayersModel(path);
                loaded = true;
                console.log(`Successfully loaded from ${path}`);
                break;
            } catch (err) {
                console.warn(`Failed to load from ${path}:`, err);
                lastError = err;
            }
        }

        if (loaded) {
            isModelLoaded = true;
            updateStatus('Ready', true);
        } else {
            throw lastError || new Error('All model paths failed');
        }

    } catch (error) {
        updateStatus('Model Load Failed');
        isModelLoaded = false;
    }
}

// ===== Setup Camera =====
// ===== Setup Camera =====
// ===== Setup Camera =====
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }
        });

        videoElement.srcObject = stream;

        return new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                canvasElement.width = videoElement.videoWidth;
                canvasElement.height = videoElement.videoHeight;
                videoElement.play();
                startCameraLoop();
                resolve();
            };
        });
    } catch (err) {
        console.error('Camera Error:', err);
        updateStatus('Camera Error: ' + err.message);
        throw err;
    }
}

// ===== Camera Loop (Manual RequestAnimationFrame) =====
let isProcessingFrame = false;
let lastProcessTime = 0;
const PROCESS_INTERVAL = 50; // Limit AI to ~20 FPS (50ms interval) for smoother feel

function startCameraLoop() {
    async function renderFrame() {
        const now = performance.now();

        // Only process if enough time passed AND not currently processing
        if (!isProcessingFrame &&
            isHandsLoaded &&
            videoElement.readyState >= 2 &&
            (now - lastProcessTime >= PROCESS_INTERVAL)) {

            isProcessingFrame = true;
            lastProcessTime = now;

            // Failsafe: Reset processing flag after 500ms if stuck
            const timer = setTimeout(() => {
                isProcessingFrame = false;
            }, 500);

            try {
                await hands.send({ image: videoElement });
            } catch (error) {
                console.error('MediaPipe Send Error:', error);
            } finally {
                clearTimeout(timer);
                isProcessingFrame = false;
            }
        }
        requestAnimationFrame(renderFrame);
    }
    renderFrame();
}

// ===== MediaPipe Results Handling =====
function onHandResults(results) {
    // Only clear, do not resize (sized in setupCamera)
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Note: Video is displayed via the <video> element. 
    // We only draw landmarks here. DO NOT drawImage.

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        noHandCount = 0; // Reset no-hand counter

        const landmarks = results.multiHandLandmarks[0];
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });

        // Predict
        if (isModelLoaded) {
            predictLetter(landmarks);
        }
    } else {
        // No hand detected
        handleNoHand();
    }

    canvasCtx.restore();
}

// ===== Feature Extraction & Prediction =====
function predictLetter(landmarks) {
    // Extract features (21 points × 2 coordinates = 42 dimensions)
    const features = extractFeatures(landmarks);

    let prediction, confidence;

    if (isModelLoaded && model) {
        // Use real model for prediction
        const input = tf.tensor2d([features]);
        const output = model.predict(input);
        const probabilities = output.dataSync();

        const maxIndex = probabilities.indexOf(Math.max(...probabilities));

        // Use user model's label map, or default labels
        if (model.reverseLabelMap) {
            prediction = model.reverseLabelMap[maxIndex] || '-';
        } else {
            prediction = LABELS[maxIndex] || '-';
        }
        confidence = probabilities[maxIndex];

        input.dispose();
        output.dispose();
    } else {
        // Model not loaded, show error
        prediction = '?';
        confidence = 0;
    }

    // Update display
    currentLetterDisplay.textContent = prediction;
    confidenceDisplay.textContent = `Confidence: ${(confidence * 100).toFixed(1)}%`;

    // Handle letter confirmation logic
    handleLetterConfirmation(prediction, confidence);
}

// ===== Feature Extraction (with scale normalization, Z-axis removed) =====
function extractFeatures(landmarks) {
    const features = [];
    const wrist = landmarks[0];

    // 1. Centering and calculating max distance (Scale based on 2D)
    const relativePoints = [];
    let maxDist = 0;

    landmarks.forEach(point => {
        const dx = point.x - wrist.x;
        const dy = point.y - wrist.y;
        // Remove Z-axis

        relativePoints.push({ x: dx, y: dy });

        // Use 2D distance to calculate Scale
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) maxDist = dist;
    });

    // Prevent division by zero
    if (maxDist < 1e-6) maxDist = 1.0;

    // 2. Normalization
    relativePoints.forEach(p => {
        features.push(p.x / maxDist);
        features.push(p.y / maxDist);
        // Only keep X, Y
    });

    return features;
}



// ===== Letter Confirmation Logic (Improved: supports repeated letters) =====
function handleLetterConfirmation(prediction, confidence) {
    // If confidence is too low, reset count AND allow same letter to be triggered again
    if (confidence < CONFIG.CONFIDENCE_THRESHOLD) {
        confirmationCount = 0;
        letterJustAdded = false; // Fix: Allow repeating same letter after relaxing hand
        return;
    }

    // If in cooldown period, skip (prevent multiple triggers from same gesture)
    if (cooldownCount > 0) {
        cooldownCount--;
        return;
    }

    // Calculate stability of current prediction
    if (prediction === lastConfirmedLetter) {
        confirmationCount++;
    } else {
        lastConfirmedLetter = prediction;
        confirmationCount = 1;
        letterJustAdded = false;  // Reset when switching letters
    }

    // If appears consecutively enough times, confirm letter
    if (confirmationCount >= CONFIG.CONFIRMATION_THRESHOLD && !letterJustAdded) {
        // Add letter (allow repetition, as user needs to move hand away and sign again)
        letterBuffer.push(prediction);
        updateLetterBuffer();

        // Animation effect
        currentLetterDisplay.classList.add('confirmed');
        setTimeout(() => currentLetterDisplay.classList.remove('confirmed'), 300);

        // Set cooldown period (prevent multiple triggers from same gesture)
        letterJustAdded = true;
        cooldownCount = 15;  // Approx. 0.5 seconds cooldown
        confirmationCount = 0;
    }
}

// ===== Handle No Hand Detected =====
function handleNoHand() {
    noHandCount++;
    currentLetterDisplay.textContent = '-';
    confidenceDisplay.textContent = 'Confidence: --%';

    // Reset state after short absence (allows repeating same letter)
    if (noHandCount >= 8) {
        letterJustAdded = false;
        cooldownCount = 0;
        lastConfirmedLetter = null;
        confirmationCount = 0;
    }

    // Auto-confirm word if hand is gone for a long time
    if (noHandCount >= CONFIG.NO_HAND_THRESHOLD && letterBuffer.length > 0) {
        confirmWord();
    }
}

// ===== Update Letter Buffer Display =====
function updateLetterBuffer() {
    if (letterBuffer.length === 0) {
        letterBufferDisplay.textContent = 'Waiting for input...';
    } else {
        letterBufferDisplay.textContent = letterBuffer.join('');
    }
}

// ===== Common English Words Dictionary =====
const COMMON_WORDS = [
    // Greetings
    'HELLO', 'HI', 'HEY', 'GOOD', 'BYE', 'GOODBYE', 'THANKS', 'THANK', 'PLEASE',
    // Common Verbs
    'LOVE', 'LIKE', 'WANT', 'NEED', 'HELP', 'COME', 'GO', 'SEE', 'LOOK', 'KNOW',
    'THINK', 'FEEL', 'MAKE', 'TAKE', 'GIVE', 'GET', 'HAVE', 'DO', 'SAY', 'ASK',
    // 常用名詞
    'FRIEND', 'FAMILY', 'HOME', 'FOOD', 'WATER', 'TIME', 'DAY', 'NIGHT', 'WORK',
    'SCHOOL', 'NAME', 'BOOK', 'PHONE', 'MONEY', 'LIFE', 'WORLD', 'YEAR', 'PEOPLE',
    // 形容詞
    'GOOD', 'BAD', 'HAPPY', 'SAD', 'BIG', 'SMALL', 'NEW', 'OLD', 'HOT', 'COLD',
    'NICE', 'FINE', 'GREAT', 'COOL', 'BEAUTIFUL', 'FUNNY',
    // 代名詞/疑問詞
    'YOU', 'YES', 'NO', 'OK', 'WHAT', 'WHERE', 'WHEN', 'WHY', 'HOW', 'WHO',
    // 其他常用
    'SORRY', 'WELCOME', 'MORE', 'VERY', 'AGAIN', 'NOW', 'TODAY', 'TOMORROW'
];

// ===== 計算編輯距離 (Levenshtein Distance) =====
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// ===== 智慧拼字校正 =====
function autoCorrect(word) {
    const upperWord = word.toUpperCase();

    // 如果已經是正確的單字，直接返回
    if (COMMON_WORDS.includes(upperWord)) {
        return upperWord;
    }

    // 找最接近的單字
    let bestMatch = upperWord;
    let minDistance = Infinity;

    for (const dictWord of COMMON_WORDS) {
        // 只考慮長度相近的單字 (±2)
        if (Math.abs(dictWord.length - upperWord.length) > 2) continue;

        const distance = levenshteinDistance(upperWord, dictWord);

        // 如果編輯距離 <= 2 且比當前最佳更好，則更新
        if (distance < minDistance && distance <= 2) {
            minDistance = distance;
            bestMatch = dictWord;
        }
    }

    // 如果找到了更好的匹配，顯示校正訊息
    if (bestMatch !== upperWord && minDistance <= 2) {
        console.log(`🔧 自動校正: ${upperWord} → ${bestMatch}`);
    }

    return bestMatch;
}

// ===== 確認單字 =====
// ===== 確認單字 =====
function confirmWord() {
    if (letterBuffer.length === 0) return;

    // 暫停介面互動
    const rawWord = letterBuffer.join('');
    let finalWord = rawWord;

    // 若啟用 AI，進行模糊搜尋校正
    if (isAIEnabled) {
        finalWord = fixSpellingWithFuzzy(rawWord);
    } else {
        // 標準模式：直接使用原始輸入
        const aiDisplay = document.getElementById('aiResultDisplay');
        if (aiDisplay) aiDisplay.style.display = 'none';
    }

    if (!completedWords.includes(finalWord)) {
        completedWords.push(finalWord);
    } else {
        completedWords.push(finalWord);
    }

    letterBuffer = []; // 清空緩衝
    updateLetterBuffer();
    updateCompletedWords();

    // 🔊 語音播放
    speakWord(finalWord);
}

// ===== 智慧拼字校正 (Fuzzy Search) =====
function fixSpellingWithFuzzy(rawWord) {
    const aiDisplay = document.getElementById('aiResultDisplay');
    const aiOriginal = document.getElementById('aiOriginal');
    const aiFinal = document.getElementById('aiFinal');

    let corrected = null;
    let minDistance = Infinity;

    // 如果輸入本身就在字典裡，直接通過
    if (WORD_LIST.includes(rawWord)) {
        if (aiDisplay) aiDisplay.style.display = 'none';
        return rawWord;
    }

    // 模糊搜尋
    for (const dictWord of WORD_LIST) {
        // 優化1：只檢查長度差異在 2 以內的單字
        if (Math.abs(dictWord.length - rawWord.length) > 2) continue;

        const distance = levenshteinDistance(rawWord, dictWord);

        // 優化2：動態閾值 (長度越長容錯越高)
        let threshold = 2;
        if (rawWord.length > 5) threshold = 3;
        if (rawWord.length < 3) threshold = 1;

        if (distance <= threshold && distance < minDistance) {
            minDistance = distance;
            corrected = dictWord;
        }
    }

    if (corrected) {
        // 顯示校正結果
        console.log(`🤖 AI 校正: ${rawWord} -> ${corrected}`);
        if (aiOriginal && aiFinal && aiDisplay) {
            aiOriginal.textContent = rawWord;
            aiFinal.textContent = corrected;
            aiDisplay.style.display = 'flex';
        }
        return corrected;
    } else {
        // 找不到合適的，顯示原始輸入
        if (aiDisplay) aiDisplay.style.display = 'none';
        return rawWord;
    }
}

// ===== 語音播放功能（ResponsiveVoice 優先 + Web Speech API 備援）=====
function speakWord(word) {
    if (!word) return;

    // 1. 優先嘗試 ResponsiveVoice
    if (typeof responsiveVoice !== 'undefined') {
        try {
            console.log(`🔊 ResponsiveVoice 播放: ${word}`);
            responsiveVoice.cancel();
            responsiveVoice.speak(word, "US English Female", {
                pitch: 1,
                rate: 0.9,
                volume: 1,
                onerror: (e) => {
                    console.warn('ResponsiveVoice 播放錯誤，切換至備援:', e);
                    speakFallback(word);
                }
            });
            return;
        } catch (e) {
            console.warn('ResponsiveVoice 呼叫失敗:', e);
        }
    }

    // 2. 失敗時使用備援方案
    speakFallback(word);
}

// 備援：原生 Web Speech API
function speakFallback(word) {
    if (!('speechSynthesis' in window)) return;

    console.log(`⚠️ 使用 Web Speech API 備援: ${word}`);
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    const voices = window.speechSynthesis.getVoices();

    // 嘗試尋找自然語音
    let selectedVoice = voices.find(v => v.name.includes('Google US English')) ||
        voices.find(v => v.name.includes('Zira')) ||
        voices.find(v => v.lang.startsWith('en'));

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.lang = 'en-US';
    utterance.rate = 1.0;

    window.speechSynthesis.speak(utterance);
}

// ===== 更新已完成單字顯示 =====
function updateCompletedWords() {
    if (completedWords.length === 0) {
        completedWordsDisplay.innerHTML = '<span class="placeholder">比出手語字母開始拼字</span>';
    } else {
        completedWordsDisplay.innerHTML = completedWords
            .map(word => `<span class="word">${word}</span>`)
            .join(' ');
    }
}

// ===== 更新狀態顯示 =====
function updateStatus(text, ready = false) {
    statusText.textContent = text;
    if (ready) {
        statusIndicator.classList.add('ready');
    } else {
        statusIndicator.classList.remove('ready');
    }
}

// ===== 事件監聽 =====
clearBtn.addEventListener('click', () => {
    letterBuffer = [];
    completedWords = [];
    updateLetterBuffer();
    updateCompletedWords();
});

spaceBtn.addEventListener('click', () => {
    confirmWord();
});

backspaceBtn.addEventListener('click', () => {
    if (letterBuffer.length > 0) {
        letterBuffer.pop();
        updateLetterBuffer();
    }
});

// 鍵盤快捷鍵
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
        confirmWord();
    } else if (e.key === 'Backspace') {
        if (letterBuffer.length > 0) {
            letterBuffer.pop();
            updateLetterBuffer();
        }
    } else if (e.key === 'Escape') {
        letterBuffer = [];
        completedWords = [];
        updateLetterBuffer();
        updateCompletedWords();
    }
});

// ===== 啟動應用 =====
init();
