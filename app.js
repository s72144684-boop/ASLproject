import { WORD_LIST } from './dictionary.js';

let model = null;
let hands = null;
let camera = null;
let isModelLoaded = false;
let isHandsLoaded = false;

let letterBuffer = [];
let completedWords = [];

const CONFIG = {
    CONFIRMATION_THRESHOLD: 4,      // 連續 4 禎確認
    CONFIDENCE_THRESHOLD: 0.6,
    NO_HAND_THRESHOLD: 20,          // 手離開 20 禎後自動確認單字
    PROCESS_INTERVAL: 100           // 偵測間隔 (ms)，降低負載避免卡頓
};

let lastConfirmedLetter = null;
let confirmationCount = 0;
let noHandCount = 0;
let isAIEnabled = false;
let letterJustAdded = false;
let cooldownCount = 0;

const LABELS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

// DOM
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

async function init() {
    updateStatus('Initializing camera...');

    if (aiToggle) {
        aiToggle.addEventListener('change', (e) => {
            isAIEnabled = e.target.checked;
            console.log(`AI Assistance is ${isAIEnabled ? 'ON' : 'OFF'}`);
            const aiDisplay = document.getElementById('aiResultDisplay');
            if (!isAIEnabled && aiDisplay) {
                aiDisplay.style.display = 'none';
            }
        });
    }

    try {
        hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
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

        await loadModel();
        await setupCamera();

        updateStatus('Ready', true);
        console.log(`Dictionary loaded, total ${WORD_LIST.length} words`);

    } catch (error) {
        console.error('Initialization Failed:', error);
        updateStatus('Init Failed: ' + error.message);
    }
}

async function loadModel() {
    try {
        console.log('Attempting to load default model...');
        const pathsToTry = [
            './model/model.json',
            'model/model.json',
            window.location.href.replace(/\/[^/]*$/, '/model/model.json')
        ];

        let loaded = false;
        for (const path of pathsToTry) {
            try {
                model = await tf.loadLayersModel(path);
                loaded = true;
                console.log(`Successfully loaded from ${path}`);
                break;
            } catch (err) {
                console.warn(`Failed to load from ${path}:`, err);
            }
        }

        if (loaded) {
            isModelLoaded = true;
            updateStatus('Ready', true);
        } else {
            throw new Error('All model paths failed');
        }

    } catch (error) {
        updateStatus('Model Load Failed');
        isModelLoaded = false;
    }
}

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
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
}

let lastProcessTime = 0;

function startCameraLoop() {
    async function renderFrame() {
        const now = performance.now();
        if (isHandsLoaded &&
            videoElement.readyState >= 2 &&
            (now - lastProcessTime >= CONFIG.PROCESS_INTERVAL)) {

            lastProcessTime = now;
            try {
                await hands.send({ image: videoElement });
            } catch (error) {
                console.error('MediaPipe Send Error:', error);
            }
        }
        requestAnimationFrame(renderFrame);
    }
    renderFrame();
}

function onHandResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        noHandCount = 0;
        const landmarks = results.multiHandLandmarks[0];
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });

        if (isModelLoaded) {
            predictLetter(landmarks);
        }
    } else {
        handleNoHand();
    }
    canvasCtx.restore();
}

function predictLetter(landmarks) {
    // 使用 tf.tidy 自動管理 Tensor 記憶體
    const result = tf.tidy(() => {
        const features = extractFeatures(landmarks);
        const input = tf.tensor2d([features]);
        const output = model.predict(input);
        const probabilities = output.dataSync();
        const maxIndex = probabilities.indexOf(Math.max(...probabilities));
        
        return {
            prediction: LABELS[maxIndex] || '?',
            confidence: probabilities[maxIndex]
        };
    });

    currentLetterDisplay.textContent = result.prediction;
    confidenceDisplay.textContent = `Confidence: ${(result.confidence * 100).toFixed(1)}%`;

    handleLetterConfirmation(result.prediction, result.confidence);
}

function extractFeatures(landmarks) {
    const wrist = landmarks[0];
    const relativePoints = [];
    let maxDist = 0;

    landmarks.forEach(point => {
        const dx = point.x - wrist.x;
        const dy = point.y - wrist.y;
        relativePoints.push({ x: dx, y: dy });
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) maxDist = dist;
    });

    if (maxDist < 1e-6) maxDist = 1.0;

    const features = [];
    relativePoints.forEach(p => {
        features.push(p.x / maxDist);
        features.push(p.y / maxDist);
    });

    return features;
}

function handleLetterConfirmation(prediction, confidence) {
    if (confidence < CONFIG.CONFIDENCE_THRESHOLD) {
        confirmationCount = 0;
        return;
    }

    if (cooldownCount > 0) {
        cooldownCount--;
        return;
    }

    if (prediction === lastConfirmedLetter) {
        confirmationCount++;
    } else {
        lastConfirmedLetter = prediction;
        confirmationCount = 1;
        letterJustAdded = false;
    }

    if (confirmationCount >= CONFIG.CONFIRMATION_THRESHOLD && !letterJustAdded) {
        performAction(prediction); // 修正：呼叫動作處理函式，而非直接 push

        // UI 動畫
        currentLetterDisplay.classList.add('confirmed');
        setTimeout(() => currentLetterDisplay.classList.remove('confirmed'), 300);

        letterJustAdded = true;
        cooldownCount = 10; // 約 1 秒冷卻 (基於 PROCESS_INTERVAL 100ms)
        confirmationCount = 0;
    }
}

// 新增：處理動作與字母的邏輯
function performAction(prediction) {
    if (prediction === 'nothing') return; // 忽略 nothing
    
    if (prediction === 'space') {
        confirmWord();
        return;
    }
    
    if (prediction === 'del') {
        if (letterBuffer.length > 0) {
            letterBuffer.pop();
            updateLetterBuffer();
        }
        return;
    }

    // 一般字母才加入 Buffer
    letterBuffer.push(prediction);
    updateLetterBuffer();
}

function handleNoHand() {
    noHandCount++;
    currentLetterDisplay.textContent = '-';
    confidenceDisplay.textContent = 'Confidence: --%';

    if (noHandCount >= 10) { // 稍微放寬重置條件
        letterJustAdded = false;
        lastConfirmedLetter = null;
        confirmationCount = 0;
    }

    if (noHandCount >= CONFIG.NO_HAND_THRESHOLD && letterBuffer.length > 0) {
        confirmWord();
        noHandCount = 0; // 重置計數，避免重複提交
    }
}

function updateLetterBuffer() {
    if (letterBuffer.length === 0) {
        letterBufferDisplay.textContent = '...';
    } else {
        letterBufferDisplay.textContent = letterBuffer.join('');
    }
}

// 補回遺失的核心函式：確認單字
function confirmWord() {
    if (letterBuffer.length === 0) return;

    const rawWord = letterBuffer.join('');
    let finalWord = rawWord;

    if (isAIEnabled) {
        finalWord = fixSpellingWithFuzzy(rawWord);
    } else {
        const aiDisplay = document.getElementById('aiResultDisplay');
        if (aiDisplay) aiDisplay.style.display = 'none';
    }

    completedWords.push(finalWord);
    
    // 清空緩衝並更新 UI
    letterBuffer = [];
    updateLetterBuffer();
    updateCompletedWords();
    speakWord(finalWord);
}

function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function fixSpellingWithFuzzy(rawWord) {
    const aiDisplay = document.getElementById('aiResultDisplay');
    const aiOriginal = document.getElementById('aiOriginal');
    const aiFinal = document.getElementById('aiFinal');

    if (WORD_LIST.includes(rawWord)) {
        if (aiDisplay) aiDisplay.style.display = 'none';
        return rawWord;
    }

    let corrected = null;
    let minDistance = Infinity;

    for (const dictWord of WORD_LIST) {
        if (Math.abs(dictWord.length - rawWord.length) > 2) continue;
        const distance = levenshteinDistance(rawWord, dictWord);
        let threshold = 2;
        if (rawWord.length > 5) threshold = 3;
        if (rawWord.length < 3) threshold = 1;

        if (distance <= threshold && distance < minDistance) {
            minDistance = distance;
            corrected = dictWord;
        }
    }

    if (corrected && aiOriginal && aiFinal && aiDisplay) {
        aiOriginal.textContent = rawWord;
        aiFinal.textContent = corrected;
        aiDisplay.style.display = 'flex';
        return corrected;
    } else {
        if (aiDisplay) aiDisplay.style.display = 'none';
        return rawWord;
    }
}

function speakWord(word) {
    if (!word) return;
    if (typeof responsiveVoice !== 'undefined') {
        try {
            console.log(`🔊 ResponsiveVoice 播放: ${word}`);
            responsiveVoice.cancel();
            responsiveVoice.speak(word, "US English Female", {
                pitch: 1,
                rate: 0.9,
                volume: 1,
                // 修正：僅記錄錯誤，不呼叫不存在的備援函式
                onerror: (e) => console.warn('ResponsiveVoice 播放失敗:', e)
            });
        } catch (e) {
            console.warn('ResponsiveVoice 呼叫異常:', e);
        }
    }
}

function updateCompletedWords() {
    if (completedWords.length === 0) {
        completedWordsDisplay.innerHTML = '<span class="placeholder">Waiting for words...</span>';
    } else {
        completedWordsDisplay.innerHTML = completedWords
            .map(word => `<span class="word">${word}</span>`)
            .join(' ');
    }
}

function updateStatus(text, ready = false) {
    statusText.textContent = text;
    if (ready) {
        statusIndicator.classList.add('ready');
    } else {
        statusIndicator.classList.remove('ready');
    }
}

clearBtn.addEventListener('click', () => {
    letterBuffer = [];
    completedWords = [];
    updateLetterBuffer();
    updateCompletedWords();
    const aiDisplay = document.getElementById('aiResultDisplay');
    if (aiDisplay) aiDisplay.style.display = 'none';
});

spaceBtn.addEventListener('click', confirmWord);

backspaceBtn.addEventListener('click', () => {
    if (letterBuffer.length > 0) {
        letterBuffer.pop();
        updateLetterBuffer();
    }
});

init();
