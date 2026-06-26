/*
  A320 Type Rating Trainer - verschlüsselte Browser-Version

  Datenschutz:
  - Die Fragen liegen NICHT als Klartext im Code.
  - questions.enc.json wird erst nach Passworteingabe lokal im Browser entschlüsselt.
  - Das Passwort wird nicht gespeichert.
  - Fortschritt und Statistik liegen nur im localStorage dieses Browsers.
*/

const APP_VERSION = "v5-autocheck-fix";

const STORAGE_KEYS = {
  ATTEMPTS: "a320_trainer_attempts_v3_encrypted"
};

let questions = [];
let importWarnings = [];
let attempts = loadAttemptsFromStorage();
let session = null;

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  setAppVersion();
  registerServiceWorker();
  showUnlock();
});

function $(id) {
  return document.getElementById(id);
}

function setAppVersion() {
  const versionElement = $("app-version");
  if (versionElement) {
    versionElement.textContent = `App-Version: ${APP_VERSION}`;
  }
}

function normalizeAnswerLetter(value) {
  const text = String(value ?? "").trim().toUpperCase();
  const match = text.match(/[ABCD]/);
  return match ? match[0] : "";
}

function getCorrectLetter(question) {
  return normalizeAnswerLetter(question?.correct);
}

function isCorrectAnswer(question, selectedLetter) {
  return normalizeAnswerLetter(selectedLetter) === getCorrectLetter(question);
}

function getAnswerText(question, letter) {
  return question?.answers?.[letter] || question?.answers?.[letter.toLowerCase()] || "";
}

function bindEvents() {
  $("unlock-btn").addEventListener("click", unlockQuestions);
  $("unlock-password").addEventListener("keydown", (event) => {
    if (event.key === "Enter") unlockQuestions();
  });
  $("show-password").addEventListener("change", () => {
    $("unlock-password").type = $("show-password").checked ? "text" : "password";
  });

  $("open-question-list-btn").addEventListener("click", showQuestionList);
  $("back-from-list-btn").addEventListener("click", showDashboard);
  $("question-search").addEventListener("input", renderQuestionList);
  $("export-questions-btn").addEventListener("click", exportQuestionsAsJson);

  $("range-type").addEventListener("change", () => {
    const isCustom = $("range-type").value === "custom";
    $("range-custom").classList.toggle("hidden", !isCustom);
  });

  $("start-learn-btn").addEventListener("click", startLearnMode);
  $("start-test-btn").addEventListener("click", startTestMode);

  $("check-answer-btn").addEventListener("click", checkAnswer);
  $("next-question-btn").addEventListener("click", nextQuestion);

  $("quit-session-btn").addEventListener("click", () => {
    const confirmQuit = confirm("Willst du diese Runde wirklich abbrechen?");
    if (confirmQuit) {
      clearAutoAdvanceTimer();
      session = null;
      showDashboard();
    }
  });

  $("back-dashboard-btn").addEventListener("click", showDashboard);
  $("reset-stats-btn").addEventListener("click", resetStats);
}

/* -----------------------------
   Entschlüsselung
----------------------------- */

async function unlockQuestions() {
  const password = $("unlock-password").value;

  if (!password) {
    setUnlockStatus("Bitte Passwort eingeben.", "bad");
    return;
  }

  if (!window.crypto?.subtle) {
    setUnlockStatus(
      "Dieser Browser-Kontext unterstützt keine sichere Entschlüsselung. Öffne die App über HTTPS oder auf dem Computer über http://localhost:8000.",
      "bad"
    );
    return;
  }

  $("unlock-btn").disabled = true;
  setUnlockStatus("Fragen werden entschlüsselt …", "info");

  try {
    const encryptedPayload = await fetchEncryptedQuestions();
    const decryptedPayload = await decryptQuestionsPayload(encryptedPayload, password);

    if (!Array.isArray(decryptedPayload.questions)) {
      throw new Error("Die entschlüsselte Datei enthält keine gültige Fragenliste.");
    }

    questions = decryptedPayload.questions;
    importWarnings = Array.isArray(decryptedPayload.warnings)
      ? decryptedPayload.warnings
      : [];

    $("unlock-password").value = "";
    setUnlockStatus("Entsperrt.", "good");
    showDashboard();
  } catch (error) {
    console.error(error);
    setUnlockStatus(
      "Entsperren fehlgeschlagen. Prüfe Passwort, Datei questions.enc.json und ob du die App über einen Webserver geöffnet hast.",
      "bad"
    );
  } finally {
    $("unlock-btn").disabled = false;
  }
}

async function fetchEncryptedQuestions() {
  const response = await fetch(`questions.enc.json?v=${Date.now()}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`questions.enc.json konnte nicht geladen werden: ${response.status}`);
  }

  return response.json();
}

async function decryptQuestionsPayload(encryptedData, password) {
  const salt = base64ToBytes(encryptedData.salt);
  const iv = base64ToBytes(encryptedData.iv);
  const ciphertext = base64ToBytes(encryptedData.ciphertext);
  const iterations = Number(encryptedData.iterations || 250000);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["decrypt"]
  );

  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintextBuffer));
}

function base64ToBytes(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return bytes;
}

function setUnlockStatus(message, type) {
  const status = $("unlock-status");
  status.className = `status-message ${type || "info"}`;
  status.textContent = message;
}

function registerServiceWorker() {
  const isSafeContext = location.protocol === "https:" || location.hostname === "localhost";

  if (!("serviceWorker" in navigator) || !isSafeContext) return;

  navigator.serviceWorker.register("service-worker.js").catch((error) => {
    console.warn("Service Worker konnte nicht registriert werden:", error);
  });
}

/* -----------------------------
   Navigation
----------------------------- */

function hideAllScreens() {
  $("unlock-section").classList.add("hidden");
  $("dashboard-section").classList.add("hidden");
  $("question-list-section").classList.add("hidden");
  $("quiz-section").classList.add("hidden");
  $("result-section").classList.add("hidden");
}


function showUnlock() {
  hideAllScreens();
  $("unlock-section").classList.remove("hidden");
  $("unlock-password").focus();
}

function showDashboard() {
  hideAllScreens();
  $("dashboard-section").classList.remove("hidden");
  renderDashboard();
}

function showQuestionList() {
  hideAllScreens();
  $("question-list-section").classList.remove("hidden");
  $("question-search").value = "";
  renderQuestionList();
}

function showQuiz() {
  hideAllScreens();
  $("quiz-section").classList.remove("hidden");
}

function showResult() {
  hideAllScreens();
  $("result-section").classList.remove("hidden");
}

/* -----------------------------
   Storage
----------------------------- */

function loadAttemptsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Statistik konnte nicht geladen werden:", error);
    return [];
  }
}

function saveAttemptsToStorage() {
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
}

function resetStats() {
  const confirmed = confirm("Wirklich alle gespeicherten Versuche und Statistikdaten löschen?");
  if (!confirmed) return;

  attempts = [];
  localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
  renderDashboard();
}

/* -----------------------------
   Dashboard
----------------------------- */

function renderDashboard() {
  $("question-count").textContent = questions.length;
  $("question-count-hero").textContent = questions.length;
  $("attempts-count").textContent = attempts.length;

  const maxQuestionNumber = questions.length;
  $("range-start").max = maxQuestionNumber;
  $("range-end").max = maxQuestionNumber;

  if (attempts.length === 0) {
    $("best-score").textContent = "–";
    $("avg-score").textContent = "–";
  } else {
    const percentages = attempts.map((attempt) => attempt.percent);
    const best = Math.max(...percentages);
    const average =
      percentages.reduce((sum, value) => sum + value, 0) / percentages.length;

    $("best-score").textContent = `${best.toFixed(0)} %`;
    $("avg-score").textContent = `${average.toFixed(0)} %`;
  }

  renderDataWarnings();
  renderHistory();
  renderFrequentWrongQuestions();
}

function renderDataWarnings() {
  const card = $("data-warning-card");
  const list = $("data-warning-list");

  const missingAnswerWarnings = questions
    .filter((question) => ["A", "B", "C", "D"].some((letter) => !question.answers?.[letter]))
    .map((question) => `Frage ${question.id}: Mindestens eine Antwortoption fehlt.`);

  const allWarnings = [
    ...importWarnings.map((warning) => `Frage ${warning.questionId}: ${warning.message}`),
    ...missingAnswerWarnings
  ];

  const uniqueWarnings = Array.from(new Set(allWarnings));

  if (uniqueWarnings.length === 0) {
    card.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  card.classList.remove("hidden");

  list.innerHTML = `
    <p>
      Der Fragenkatalog wurde geladen, aber es gibt ${uniqueWarnings.length}
      Datenhinweis(e). Es wurde nichts erfunden oder ergänzt.
    </p>
    <ul>
      ${uniqueWarnings.slice(0, 6).map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}
    </ul>
  `;
}

function renderHistory() {
  const historyList = $("history-list");

  if (attempts.length === 0) {
    historyList.className = "history-list empty";
    historyList.textContent = "Noch keine Versuche gespeichert.";
    return;
  }

  historyList.className = "history-list";
  historyList.innerHTML = "";

  attempts.slice(0, 8).forEach((attempt) => {
    const item = document.createElement("div");
    item.className = "history-item";

    const date = new Date(attempt.date).toLocaleString("de-CH", {
      dateStyle: "short",
      timeStyle: "short"
    });

    const modeLabel = attempt.mode === "test" ? "Testprüfung" : "Lernmodus";
    const passInfo = attempt.mode === "test" && attempt.passingScore > 0
      ? ` · ${attempt.passed ? "bestanden" : "nicht bestanden"}`
      : "";

    item.innerHTML = `
      <strong>${escapeHtml(modeLabel)} · ${escapeHtml(attempt.rangeLabel)}</strong>
      <p class="muted">${escapeHtml(date)}${escapeHtml(passInfo)}</p>
      <p>
        ${attempt.correctCount}/${attempt.total} richtig ·
        <strong>${attempt.percent.toFixed(0)} %</strong>
      </p>
    `;

    historyList.appendChild(item);
  });
}

function renderFrequentWrongQuestions() {
  const list = $("frequent-wrong-list");
  const counter = new Map();

  attempts.forEach((attempt) => {
    attempt.wrongAnswers.forEach((wrong) => {
      const key = String(wrong.questionId);

      if (!counter.has(key)) {
        counter.set(key, {
          questionId: wrong.questionId,
          question: wrong.question,
          count: 0
        });
      }

      counter.get(key).count += 1;
    });
  });

  const sorted = Array.from(counter.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (sorted.length === 0) {
    list.className = "history-list empty";
    list.textContent = "Noch keine falschen Antworten vorhanden.";
    return;
  }

  list.className = "history-list";
  list.innerHTML = "";

  sorted.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "history-item";

    item.innerHTML = `
      <strong>Frage ${escapeHtml(entry.questionId)} · ${entry.count}x falsch</strong>
      <p>${escapeHtml(entry.question)}</p>
    `;

    list.appendChild(item);
  });
}

/* -----------------------------
   Fragenliste
----------------------------- */

function renderQuestionList() {
  const query = $("question-search").value.trim().toLowerCase();
  const list = $("question-list");

  const filtered = questions.filter((question) => {
    if (!query) return true;

    const haystack = [
      question.id,
      question.question,
      question.answers?.A,
      question.answers?.B,
      question.answers?.C,
      question.answers?.D,
      question.correct
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  $("question-list-count").textContent = `${filtered.length} von ${questions.length} Fragen`;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="history-item empty">Keine Frage gefunden.</div>`;
    return;
  }

  list.innerHTML = "";

  filtered.forEach((question) => {
    const item = document.createElement("article");
    item.className = "list-question-item";

    const answersHtml = ["A", "B", "C", "D"].map((letter) => {
      const answer = question.answers?.[letter] || "[Antwort fehlt]";
      const correctClass = getCorrectLetter(question) === letter ? "correct-mini" : "";

      return `
        <div class="answer-mini ${correctClass}">
          <strong>${letter}</strong> · ${escapeHtml(answer)}
        </div>
      `;
    }).join("");

    item.innerHTML = `
      <div class="question-meta">
        <span class="pill">Frage ${escapeHtml(question.id)}</span>
        <span class="pill">Korrekt: ${escapeHtml(getCorrectLetter(question) || "–")}</span>
      </div>
      <p><strong>${escapeHtml(question.question)}</strong></p>
      <div class="answer-list-mini">${answersHtml}</div>
    `;

    list.appendChild(item);
  });
}

function exportQuestionsAsJson() {
  const data = JSON.stringify(questions, null, 2);
  downloadTextFile("a320-fragen-export.json", data, "application/json");
}

/* -----------------------------
   Session starten
----------------------------- */

function startLearnMode() {
  const { selectedQuestions, label, error } = getSelectedRangeQuestions();

  if (error) {
    alert(error);
    return;
  }

  if (selectedQuestions.length === 0) {
    alert("In diesem Bereich wurden keine Fragen gefunden.");
    return;
  }

  const shouldShuffle = $("learn-shuffle").checked;
  const preparedQuestions = shouldShuffle ? shuffleArray([...selectedQuestions]) : [...selectedQuestions];

  startSession("learn", preparedQuestions, label);
}

function startTestMode() {
  if (questions.length === 0) {
    alert("Es sind keine Fragen geladen.");
    return;
  }

  const shuffled = shuffleArray([...questions]);
  const testSize = Math.min(40, shuffled.length);
  const selectedQuestions = shuffled.slice(0, testSize);

  const label = testSize === 40
    ? "40 zufällige Fragen"
    : `${testSize} zufällige Fragen`;

  startSession("test", selectedQuestions, label);
}

function getSelectedRangeQuestions() {
  const type = $("range-type").value;

  if (type === "all") {
    return {
      selectedQuestions: [...questions],
      label: "Alle Fragen",
      error: null
    };
  }

  if (type === "wrong") {
    const wrongIds = getFrequentlyWrongQuestionIds();

    if (wrongIds.length === 0) {
      return {
        selectedQuestions: [],
        label: "Falsch beantwortete Fragen",
        error: "Du hast noch keine falsch beantworteten Fragen in der Statistik."
      };
    }

    return {
      selectedQuestions: questions.filter((question) => wrongIds.includes(String(question.id))),
      label: "Falsch beantwortete Fragen",
      error: null
    };
  }

  const start = Number($("range-start").value);
  const end = Number($("range-end").value);

  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return {
      selectedQuestions: [],
      label: "",
      error: "Bitte gib gültige Zahlen für den Fragenbereich ein."
    };
  }

  if (start < 1 || end < 1) {
    return {
      selectedQuestions: [],
      label: "",
      error: "Der Fragenbereich muss bei mindestens 1 beginnen."
    };
  }

  if (end < start) {
    return {
      selectedQuestions: [],
      label: "",
      error: "Die Endfrage darf nicht kleiner als die Startfrage sein."
    };
  }

  const selectedQuestions = questions.filter((_, index) => {
    const position = index + 1;
    return position >= start && position <= end;
  });

  return {
    selectedQuestions,
    label: `Fragen ${start}–${end}`,
    error: null
  };
}

function getFrequentlyWrongQuestionIds() {
  const counter = new Map();

  attempts.forEach((attempt) => {
    attempt.wrongAnswers.forEach((wrong) => {
      const key = String(wrong.questionId);
      counter.set(key, (counter.get(key) || 0) + 1);
    });
  });

  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([questionId]) => questionId);
}

function startSession(mode, selectedQuestions, rangeLabel) {
  const passingScore = Number($("passing-score").value);

  session = {
    mode,
    rangeLabel,
    passingScore,
    questions: selectedQuestions,
    currentIndex: 0,
    selectedAnswer: null,
    checked: false,
    autoAdvanceTimer: null,
    userAnswers: new Array(selectedQuestions.length).fill(null)
  };

  showQuiz();
  renderCurrentQuestion();
}

/* -----------------------------
   Quiz
----------------------------- */

function renderCurrentQuestion() {
  if (!session) return;

  const currentQuestion = session.questions[session.currentIndex];
  const questionNumber = session.currentIndex + 1;
  const total = session.questions.length;
  const progress = (questionNumber / total) * 100;

  $("quiz-mode-title").textContent =
    session.mode === "test"
      ? `Testprüfung · ${session.rangeLabel}`
      : `Lernmodus · ${session.rangeLabel}`;

  $("quiz-progress").textContent = `Frage ${questionNumber} von ${total}`;
  $("progress-bar").style.width = `${progress}%`;

  $("question-card").innerHTML = `
    <div class="question-meta">
      <span class="pill">Frage ${escapeHtml(currentQuestion.id)}</span>
      ${currentQuestion.category ? `<span class="pill">${escapeHtml(currentQuestion.category)}</span>` : ""}
    </div>
    <h2>${escapeHtml(currentQuestion.question)}</h2>
  `;

  renderAnswers(currentQuestion);
  renderFeedback(currentQuestion);
  renderQuizButtons();
}

function renderAnswers(currentQuestion) {
  const answerList = $("answer-list");
  answerList.innerHTML = "";

  ["A", "B", "C", "D"].forEach((letter) => {
    const answerText = currentQuestion.answers?.[letter];

    if (!answerText) return;

    const button = document.createElement("button");
    button.className = "answer-btn";
    button.type = "button";

    const isSelected = session.selectedAnswer === letter;
    const isCorrect = getCorrectLetter(currentQuestion) === letter;
    const isWrongSelection = session.checked && isSelected && !isCorrect;

    if (isSelected) button.classList.add("selected");

    if (session.mode === "learn" && session.checked && isCorrect) {
      button.classList.add("correct");
    }

    if (session.mode === "learn" && isWrongSelection) {
      button.classList.add("wrong");
    }

    button.innerHTML = `
      <span class="answer-letter">${letter}</span>
      ${escapeHtml(answerText)}
    `;

    button.addEventListener("click", () => {
      if (!session) return;

      // Im Lernmodus wird die Antwort direkt beim Klick geprüft.
      // Nach einer richtigen Antwort geht es nach ca. 1 Sekunde automatisch weiter.
      if (session.mode === "learn") {
        if (session.checked) return;

        selectAnswer(letter);
        autoCheckLearnAnswer();
        return;
      }

      // Im Testmodus wird nur ausgewählt. Die Auswertung kommt erst am Ende.
      selectAnswer(letter);
      renderCurrentQuestion();
    });

    answerList.appendChild(button);
  });
}

function selectAnswer(letter) {
  if (!session) return;

  session.selectedAnswer = letter;
  session.userAnswers[session.currentIndex] = letter;
}

function autoCheckLearnAnswer() {
  if (!session || session.mode !== "learn" || !session.selectedAnswer) return;

  session.checked = true;
  renderCurrentQuestion();

  const currentQuestion = session.questions[session.currentIndex];
  const isCorrect = isCorrectAnswer(currentQuestion, session.selectedAnswer);

  if (isCorrect) {
    scheduleAutoAdvance();
  }
}

function scheduleAutoAdvance() {
  if (!session) return;

  clearAutoAdvanceTimer();

  session.autoAdvanceTimer = window.setTimeout(() => {
    if (!session) return;
    nextQuestion();
  }, 1000);
}

function clearAutoAdvanceTimer() {
  if (!session?.autoAdvanceTimer) return;

  window.clearTimeout(session.autoAdvanceTimer);
  session.autoAdvanceTimer = null;
}

function renderFeedback(currentQuestion) {
  const box = $("feedback-box");

  if (session.mode !== "learn" || !session.checked) {
    box.className = "feedback-box hidden";
    box.innerHTML = "";
    return;
  }

  const isCorrect = isCorrectAnswer(currentQuestion, session.selectedAnswer);

  box.className = `feedback-box ${isCorrect ? "good" : "bad"}`;
  box.innerHTML = isCorrect
    ? "Richtig. Weiter geht es automatisch …"
    : `Falsch. Richtige Antwort: ${escapeHtml(getCorrectLetter(currentQuestion))}. Klicke auf „Nächste Frage“, wenn du weiter möchtest.`;
}

function renderQuizButtons() {
  const isLastQuestion = session.currentIndex === session.questions.length - 1;

  if (session.mode === "test") {
    $("check-answer-btn").classList.add("hidden");

    $("next-question-btn").textContent = isLastQuestion
      ? "Prüfung auswerten"
      : "Nächste Frage";

    $("next-question-btn").disabled = !session.selectedAnswer;
    return;
  }

  // Im Lernmodus gibt es keinen separaten Prüfen-Button mehr:
  // Der Klick auf A/B/C/D prüft sofort.
  $("check-answer-btn").classList.add("hidden");

  const currentQuestion = session.questions[session.currentIndex];
  const selectedIsCorrect = isCorrectAnswer(currentQuestion, session.selectedAnswer);

  if (session.checked && selectedIsCorrect) {
    $("next-question-btn").textContent = isLastQuestion
      ? "Zusammenfassung in 1 Sekunde …"
      : "Weiter in 1 Sekunde …";
    $("next-question-btn").disabled = true;
    return;
  }

  $("next-question-btn").textContent = isLastQuestion
    ? "Zusammenfassung anzeigen"
    : "Nächste Frage";

  $("next-question-btn").disabled = !session.checked;
}

function checkAnswer() {
  // Fallback, falls der Button in einer alten gecachten HTML-Version noch sichtbar wäre.
  if (!session || session.mode !== "learn") return;

  if (!session.selectedAnswer) {
    alert("Bitte zuerst eine Antwort auswählen.");
    return;
  }

  autoCheckLearnAnswer();
}

function nextQuestion() {
  if (!session) return;

  clearAutoAdvanceTimer();

  if (!session.selectedAnswer) {
    alert("Bitte zuerst eine Antwort auswählen.");
    return;
  }

  if (session.mode === "learn" && !session.checked) {
    alert("Bitte zuerst eine Antwort auswählen. Sie wird automatisch geprüft.");
    return;
  }

  const isLastQuestion = session.currentIndex === session.questions.length - 1;

  if (isLastQuestion) {
    finishSession();
    return;
  }

  session.currentIndex += 1;
  session.selectedAnswer = session.userAnswers[session.currentIndex];
  session.checked = false;

  renderCurrentQuestion();
}

/* -----------------------------
   Resultate
----------------------------- */

function finishSession() {
  clearAutoAdvanceTimer();

  const results = session.questions.map((question, index) => {
    const userAnswer = session.userAnswers[index];
    const isCorrect = isCorrectAnswer(question, userAnswer);

    return {
      questionId: question.id,
      question: question.question,
      userAnswer,
      correctAnswer: getCorrectLetter(question),
      correctAnswerText: getAnswerText(question, getCorrectLetter(question)) || "",
      explanation: question.explanation || "",
      isCorrect
    };
  });

  const correctCount = results.filter((result) => result.isCorrect).length;
  const wrongCount = results.length - correctCount;
  const percent = results.length > 0 ? (correctCount / results.length) * 100 : 0;
  const passingScore = session.mode === "test" ? session.passingScore : 0;
  const passed = passingScore > 0 ? percent >= passingScore : null;

  const attempt = {
    id: Date.now(),
    date: new Date().toISOString(),
    mode: session.mode,
    rangeLabel: session.rangeLabel,
    total: results.length,
    correctCount,
    wrongCount,
    percent,
    passingScore,
    passed,
    wrongAnswers: results.filter((result) => !result.isCorrect)
  };

  attempts.unshift(attempt);
  attempts = attempts.slice(0, 150);
  saveAttemptsToStorage();

  session = null;

  renderResult(attempt);
  showResult();
}

function renderResult(attempt) {
  const modeLabel = attempt.mode === "test" ? "Testprüfung" : "Lernmodus";
  $("result-title").textContent = `${modeLabel} abgeschlossen`;

  const passBox = attempt.mode === "test" && attempt.passingScore > 0
    ? `
      <div class="result-box ${attempt.passed ? "pass" : "fail"}">
        <span>Status</span>
        <strong>${attempt.passed ? "Bestanden" : "Nicht bestanden"}</strong>
      </div>
    `
    : `
      <div class="result-box">
        <span>Status</span>
        <strong>–</strong>
      </div>
    `;

  $("result-summary").innerHTML = `
    <div class="result-box">
      <span>Fragen</span>
      <strong>${attempt.total}</strong>
    </div>

    <div class="result-box">
      <span>Richtig</span>
      <strong>${attempt.correctCount}</strong>
    </div>

    <div class="result-box">
      <span>Falsch</span>
      <strong>${attempt.wrongCount}</strong>
    </div>

    <div class="result-box">
      <span>Score</span>
      <strong>${attempt.percent.toFixed(0)} %</strong>
    </div>

    ${passBox}
  `;

  renderWrongAnswers(attempt.wrongAnswers);
}

function renderWrongAnswers(wrongAnswers) {
  const list = $("result-wrong-list");

  if (wrongAnswers.length === 0) {
    list.innerHTML = `
      <div class="wrong-item">
        <span class="tag tag-success">Alles richtig</span>
        <p class="muted">Keine falsch beantworteten Fragen.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = "";

  wrongAnswers.forEach((wrong) => {
    const item = document.createElement("div");
    item.className = "wrong-item";

    item.innerHTML = `
      <span class="tag tag-danger">Falsch</span>
      <h3>Frage ${escapeHtml(wrong.questionId)}</h3>
      <p>${escapeHtml(wrong.question)}</p>

      <p>
        Deine Antwort:
        <strong>${escapeHtml(wrong.userAnswer || "Keine Antwort")}</strong>
      </p>

      <p>
        Richtige Antwort:
        <strong>${escapeHtml(wrong.correctAnswer)}</strong>
        ${wrong.correctAnswerText ? `· ${escapeHtml(wrong.correctAnswerText)}` : ""}
      </p>

      ${
        wrong.explanation
          ? `<p class="muted">Erklärung: ${escapeHtml(wrong.explanation)}</p>`
          : ""
      }
    `;

    list.appendChild(item);
  });
}

/* -----------------------------
   Hilfsfunktionen
----------------------------- */

function shuffleArray(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }

  return array;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
