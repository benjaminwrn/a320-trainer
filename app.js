{\rtf1\ansi\ansicpg1252\cocoartf2759
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 /*\
  A320 Type Rating Trainer\
  Version 1: Lokale Demo-Version ohne XLS/XLSX-Import.\
\
  Wichtig:\
  - Die Demo-Fragen sind Platzhalter.\
  - Sp\'e4ter ersetzen wir sie durch echte Fragen aus deiner XLS/XLSX-Datei.\
  - Testversuche werden lokal im Browser gespeichert.\
*/\
\
const STORAGE_KEYS = \{\
  QUESTIONS: "a320_trainer_questions",\
  ATTEMPTS: "a320_trainer_attempts"\
\};\
\
/*\
  Demo-Fragen:\
  Das sind bewusst neutrale Platzhalter und keine echten A320-Testfragen.\
*/\
const demoQuestions = [\
  \{\
    id: 1,\
    question: "Demo-Frage 1: Welche Antwort ist als korrekt markiert?",\
    answers: \{\
      A: "Antwort A",\
      B: "Antwort B",\
      C: "Antwort C",\
      D: "Antwort D"\
    \},\
    correct: "B",\
    explanation: "Dies ist nur eine Demo-Erkl\'e4rung.",\
    category: "Demo"\
  \},\
  \{\
    id: 2,\
    question: "Demo-Frage 2: Welche Antwort ist hier korrekt?",\
    answers: \{\
      A: "Option A",\
      B: "Option B",\
      C: "Option C",\
      D: "Option D"\
    \},\
    correct: "D",\
    explanation: "In dieser Demo-Frage ist D korrekt.",\
    category: "Demo"\
  \},\
  \{\
    id: 3,\
    question: "Demo-Frage 3: W\'e4hle die richtige Antwort.",\
    answers: \{\
      A: "M\'f6glichkeit A",\
      B: "M\'f6glichkeit B",\
      C: "M\'f6glichkeit C",\
      D: "M\'f6glichkeit D"\
    \},\
    correct: "A",\
    explanation: "In dieser Demo-Frage ist A korrekt.",\
    category: "Demo"\
  \},\
  \{\
    id: 4,\
    question: "Demo-Frage 4: Welche Auswahl soll gr\'fcn werden?",\
    answers: \{\
      A: "Auswahl A",\
      B: "Auswahl B",\
      C: "Auswahl C",\
      D: "Auswahl D"\
    \},\
    correct: "C",\
    explanation: "In dieser Demo-Frage ist C korrekt.",\
    category: "Demo"\
  \},\
  \{\
    id: 5,\
    question: "Demo-Frage 5: Welche Antwort ist richtig?",\
    answers: \{\
      A: "Erste Antwort",\
      B: "Zweite Antwort",\
      C: "Dritte Antwort",\
      D: "Vierte Antwort"\
    \},\
    correct: "B",\
    explanation: "In dieser Demo-Frage ist B korrekt.",\
    category: "Demo"\
  \},\
  \{\
    id: 6,\
    question: "Demo-Frage 6: Teste hier die Auswertung.",\
    answers: \{\
      A: "Antwort 1",\
      B: "Antwort 2",\
      C: "Antwort 3",\
      D: "Antwort 4"\
    \},\
    correct: "A",\
    explanation: "Diese Frage dient nur zum Testen der App.",\
    category: "Demo"\
  \},\
  \{\
    id: 7,\
    question: "Demo-Frage 7: Welche Antwort wurde intern als korrekt hinterlegt?",\
    answers: \{\
      A: "Alpha",\
      B: "Bravo",\
      C: "Charlie",\
      D: "Delta"\
    \},\
    correct: "D",\
    explanation: "In dieser Demo-Frage ist D korrekt.",\
    category: "Demo"\
  \},\
  \{\
    id: 8,\
    question: "Demo-Frage 8: Letzte Demo-Frage f\'fcr den Bereichstest.",\
    answers: \{\
      A: "Variante A",\
      B: "Variante B",\
      C: "Variante C",\
      D: "Variante D"\
    \},\
    correct: "C",\
    explanation: "In dieser Demo-Frage ist C korrekt.",\
    category: "Demo"\
  \}\
];\
\
let questions = loadQuestionsFromStorage() || demoQuestions;\
let attempts = loadAttemptsFromStorage();\
\
let session = null;\
\
document.addEventListener("DOMContentLoaded", () => \{\
  bindEvents();\
  showDashboard();\
\});\
\
/* -----------------------------\
   Grundfunktionen\
----------------------------- */\
\
function $(id) \{\
  return document.getElementById(id);\
\}\
\
function bindEvents() \{\
  $("import-btn").addEventListener("click", () => \{\
    alert("Der XLS/XLSX-Import kommt im n\'e4chsten Schritt. Aktuell nutzt die App Demo-Fragen.");\
  \});\
\
  $("range-type").addEventListener("change", () => \{\
    const isCustom = $("range-type").value === "custom";\
    $("range-custom").classList.toggle("hidden", !isCustom);\
  \});\
\
  $("start-learn-btn").addEventListener("click", startLearnMode);\
  $("start-test-btn").addEventListener("click", startTestMode);\
\
  $("check-answer-btn").addEventListener("click", checkAnswer);\
  $("next-question-btn").addEventListener("click", nextQuestion);\
\
  $("quit-session-btn").addEventListener("click", () => \{\
    const confirmQuit = confirm("Willst du diese Runde wirklich abbrechen?");\
    if (confirmQuit) \{\
      session = null;\
      showDashboard();\
    \}\
  \});\
\
  $("back-dashboard-btn").addEventListener("click", showDashboard);\
\
  $("reset-data-btn").addEventListener("click", resetLocalData);\
\}\
\
function showDashboard() \{\
  $("dashboard-section").classList.remove("hidden");\
  $("quiz-section").classList.add("hidden");\
  $("result-section").classList.add("hidden");\
\
  renderDashboard();\
\}\
\
function showQuiz() \{\
  $("dashboard-section").classList.add("hidden");\
  $("quiz-section").classList.remove("hidden");\
  $("result-section").classList.add("hidden");\
\}\
\
function showResult() \{\
  $("dashboard-section").classList.add("hidden");\
  $("quiz-section").classList.add("hidden");\
  $("result-section").classList.remove("hidden");\
\}\
\
function escapeHtml(value) \{\
  return String(value ?? "")\
    .replaceAll("&", "&amp;")\
    .replaceAll("<", "&lt;")\
    .replaceAll(">", "&gt;")\
    .replaceAll('"', "&quot;")\
    .replaceAll("'", "&#039;");\
\}\
\
/* -----------------------------\
   Lokale Speicherung\
----------------------------- */\
\
function loadQuestionsFromStorage() \{\
  try \{\
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);\
    if (!raw) return null;\
\
    const parsed = JSON.parse(raw);\
    if (!Array.isArray(parsed)) return null;\
\
    return parsed;\
  \} catch (error) \{\
    console.error("Fragen konnten nicht geladen werden:", error);\
    return null;\
  \}\
\}\
\
function loadAttemptsFromStorage() \{\
  try \{\
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);\
    if (!raw) return [];\
\
    const parsed = JSON.parse(raw);\
    if (!Array.isArray(parsed)) return [];\
\
    return parsed;\
  \} catch (error) \{\
    console.error("Versuche konnten nicht geladen werden:", error);\
    return [];\
  \}\
\}\
\
function saveAttemptsToStorage() \{\
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));\
\}\
\
function resetLocalData() \{\
  const confirmed = confirm(\
    "Wirklich alle lokal gespeicherten Daten l\'f6schen? Das betrifft Versuche und sp\'e4ter auch importierte Fragen."\
  );\
\
  if (!confirmed) return;\
\
  localStorage.removeItem(STORAGE_KEYS.QUESTIONS);\
  localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);\
\
  questions = demoQuestions;\
  attempts = [];\
  session = null;\
\
  showDashboard();\
\}\
\
/* -----------------------------\
   Dashboard und Statistik\
----------------------------- */\
\
function renderDashboard() \{\
  $("question-count").textContent = questions.length;\
\
  $("attempts-count").textContent = attempts.length;\
\
  if (attempts.length === 0) \{\
    $("best-score").textContent = "\'96";\
    $("avg-score").textContent = "\'96";\
  \} else \{\
    const percentages = attempts.map((attempt) => attempt.percent);\
    const best = Math.max(...percentages);\
    const average =\
      percentages.reduce((sum, value) => sum + value, 0) / percentages.length;\
\
    $("best-score").textContent = `$\{best.toFixed(0)\} %`;\
    $("avg-score").textContent = `$\{average.toFixed(0)\} %`;\
  \}\
\
  renderHistory();\
  renderFrequentWrongQuestions();\
\}\
\
function renderHistory() \{\
  const historyList = $("history-list");\
\
  if (attempts.length === 0) \{\
    historyList.className = "history-list empty";\
    historyList.textContent = "Noch keine Versuche gespeichert.";\
    return;\
  \}\
\
  historyList.className = "history-list";\
  historyList.innerHTML = "";\
\
  attempts.slice(0, 5).forEach((attempt) => \{\
    const item = document.createElement("div");\
    item.className = "history-item";\
\
    const date = new Date(attempt.date).toLocaleString("de-CH", \{\
      dateStyle: "short",\
      timeStyle: "short"\
    \});\
\
    const modeLabel =\
      attempt.mode === "test" ? "Testpr\'fcfung" : "Lernmodus";\
\
    item.innerHTML = `\
      <strong>$\{escapeHtml(modeLabel)\} \'b7 $\{escapeHtml(attempt.rangeLabel)\}</strong>\
      <p class="muted">$\{escapeHtml(date)\}</p>\
      <p>\
        $\{attempt.correctCount\}/$\{attempt.total\} richtig \'b7\
        <strong>$\{attempt.percent.toFixed(0)\} %</strong>\
      </p>\
    `;\
\
    historyList.appendChild(item);\
  \});\
\}\
\
function renderFrequentWrongQuestions() \{\
  const list = $("frequent-wrong-list");\
\
  const counter = new Map();\
\
  attempts.forEach((attempt) => \{\
    attempt.wrongAnswers.forEach((wrong) => \{\
      const key = String(wrong.questionId);\
\
      if (!counter.has(key)) \{\
        counter.set(key, \{\
          questionId: wrong.questionId,\
          question: wrong.question,\
          count: 0\
        \});\
      \}\
\
      counter.get(key).count += 1;\
    \});\
  \});\
\
  const sorted = Array.from(counter.values())\
    .sort((a, b) => b.count - a.count)\
    .slice(0, 5);\
\
  if (sorted.length === 0) \{\
    list.className = "history-list empty";\
    list.textContent = "Noch keine falschen Antworten vorhanden.";\
    return;\
  \}\
\
  list.className = "history-list";\
  list.innerHTML = "";\
\
  sorted.forEach((entry) => \{\
    const item = document.createElement("div");\
    item.className = "history-item";\
\
    item.innerHTML = `\
      <strong>Frage $\{escapeHtml(entry.questionId)\} \'b7 $\{entry.count\}x falsch</strong>\
      <p>$\{escapeHtml(entry.question)\}</p>\
    `;\
\
    list.appendChild(item);\
  \});\
\}\
\
/* -----------------------------\
   Modus starten\
----------------------------- */\
\
function startLearnMode() \{\
  const \{ selectedQuestions, label, error \} = getSelectedRangeQuestions();\
\
  if (error) \{\
    alert(error);\
    return;\
  \}\
\
  if (selectedQuestions.length === 0) \{\
    alert("In diesem Bereich wurden keine Fragen gefunden.");\
    return;\
  \}\
\
  startSession("learn", selectedQuestions, label);\
\}\
\
function startTestMode() \{\
  if (questions.length === 0) \{\
    alert("Es sind keine Fragen geladen.");\
    return;\
  \}\
\
  const shuffled = shuffleArray([...questions]);\
  const testSize = Math.min(40, shuffled.length);\
  const selectedQuestions = shuffled.slice(0, testSize);\
\
  const label =\
    testSize === 40\
      ? "40 zuf\'e4llige Fragen"\
      : `$\{testSize\} zuf\'e4llige Fragen`;\
\
  startSession("test", selectedQuestions, label);\
\}\
\
function getSelectedRangeQuestions() \{\
  const type = $("range-type").value;\
\
  if (type === "all") \{\
    return \{\
      selectedQuestions: [...questions],\
      label: "Alle Fragen",\
      error: null\
    \};\
  \}\
\
  const start = Number($("range-start").value);\
  const end = Number($("range-end").value);\
\
  if (!Number.isInteger(start) || !Number.isInteger(end)) \{\
    return \{\
      selectedQuestions: [],\
      label: "",\
      error: "Bitte gib g\'fcltige Zahlen f\'fcr den Fragenbereich ein."\
    \};\
  \}\
\
  if (start < 1 || end < 1) \{\
    return \{\
      selectedQuestions: [],\
      label: "",\
      error: "Der Fragenbereich muss bei mindestens 1 beginnen."\
    \};\
  \}\
\
  if (end < start) \{\
    return \{\
      selectedQuestions: [],\
      label: "",\
      error: "Die Endfrage darf nicht kleiner als die Startfrage sein."\
    \};\
  \}\
\
  /*\
    Bereich bezieht sich aktuell auf die Position in der geladenen Liste.\
    Beispiel: 1\'9650 = erste bis f\'fcnfzigste Frage.\
  */\
  const selectedQuestions = questions.filter((_, index) => \{\
    const position = index + 1;\
    return position >= start && position <= end;\
  \});\
\
  return \{\
    selectedQuestions,\
    label: `Fragen $\{start\}\'96$\{end\}`,\
    error: null\
  \};\
\}\
\
function startSession(mode, selectedQuestions, rangeLabel) \{\
  session = \{\
    mode,\
    rangeLabel,\
    questions: selectedQuestions,\
    currentIndex: 0,\
    selectedAnswer: null,\
    checked: false,\
    userAnswers: new Array(selectedQuestions.length).fill(null)\
  \};\
\
  showQuiz();\
  renderCurrentQuestion();\
\}\
\
/* -----------------------------\
   Quiz-Logik\
----------------------------- */\
\
function renderCurrentQuestion() \{\
  if (!session) return;\
\
  const currentQuestion = session.questions[session.currentIndex];\
  const questionNumber = session.currentIndex + 1;\
  const total = session.questions.length;\
\
  $("quiz-mode-title").textContent =\
    session.mode === "test"\
      ? `Testpr\'fcfung \'b7 $\{session.rangeLabel\}`\
      : `Lernmodus \'b7 $\{session.rangeLabel\}`;\
\
  $("quiz-progress").textContent = `Frage $\{questionNumber\} von $\{total\}`;\
\
  const categoryText = currentQuestion.category\
    ? ` \'b7 $\{escapeHtml(currentQuestion.category)\}`\
    : "";\
\
  $("question-card").innerHTML = `\
    <div class="question-meta">\
      <span>Frage $\{escapeHtml(currentQuestion.id)\}</span>\
      <span>$\{categoryText\}</span>\
    </div>\
    <h2>$\{escapeHtml(currentQuestion.question)\}</h2>\
  `;\
\
  renderAnswers(currentQuestion);\
  renderQuizButtons();\
\}\
\
function renderAnswers(currentQuestion) \{\
  const answerList = $("answer-list");\
  answerList.innerHTML = "";\
\
  const letters = ["A", "B", "C", "D"];\
\
  letters.forEach((letter) => \{\
    const answerText = currentQuestion.answers[letter];\
\
    if (!answerText) return;\
\
    const button = document.createElement("button");\
    button.className = "answer-btn";\
    button.type = "button";\
\
    const isSelected = session.selectedAnswer === letter;\
    const isCorrect = currentQuestion.correct === letter;\
    const isWrongSelection =\
      session.checked && isSelected && !isCorrect;\
\
    if (isSelected) \{\
      button.classList.add("selected");\
    \}\
\
    if (session.mode === "learn" && session.checked && isCorrect) \{\
      button.classList.add("correct");\
    \}\
\
    if (session.mode === "learn" && isWrongSelection) \{\
      button.classList.add("wrong");\
    \}\
\
    button.innerHTML = `\
      <span class="answer-letter">$\{letter\}</span>\
      $\{escapeHtml(answerText)\}\
    `;\
\
    button.addEventListener("click", () => \{\
      if (session.mode === "learn" && session.checked) \{\
        return;\
      \}\
\
      session.selectedAnswer = letter;\
      session.userAnswers[session.currentIndex] = letter;\
\
      renderCurrentQuestion();\
    \});\
\
    answerList.appendChild(button);\
  \});\
\}\
\
function renderQuizButtons() \{\
  const isLastQuestion =\
    session.currentIndex === session.questions.length - 1;\
\
  if (session.mode === "test") \{\
    $("check-answer-btn").classList.add("hidden");\
\
    $("next-question-btn").textContent = isLastQuestion\
      ? "Pr\'fcfung auswerten"\
      : "N\'e4chste Frage";\
\
    $("next-question-btn").disabled = !session.selectedAnswer;\
    return;\
  \}\
\
  $("check-answer-btn").classList.remove("hidden");\
  $("check-answer-btn").disabled =\
    !session.selectedAnswer || session.checked;\
\
  $("next-question-btn").textContent = isLastQuestion\
    ? "Zusammenfassung anzeigen"\
    : "N\'e4chste Frage";\
\
  $("next-question-btn").disabled = !session.checked;\
\}\
\
function checkAnswer() \{\
  if (!session || session.mode !== "learn") return;\
\
  if (!session.selectedAnswer) \{\
    alert("Bitte zuerst eine Antwort ausw\'e4hlen.");\
    return;\
  \}\
\
  session.checked = true;\
  renderCurrentQuestion();\
\}\
\
function nextQuestion() \{\
  if (!session) return;\
\
  if (!session.selectedAnswer) \{\
    alert("Bitte zuerst eine Antwort ausw\'e4hlen.");\
    return;\
  \}\
\
  if (session.mode === "learn" && !session.checked) \{\
    alert("Bitte zuerst auf \'84Antwort pr\'fcfen\'93 klicken.");\
    return;\
  \}\
\
  const isLastQuestion =\
    session.currentIndex === session.questions.length - 1;\
\
  if (isLastQuestion) \{\
    finishSession();\
    return;\
  \}\
\
  session.currentIndex += 1;\
  session.selectedAnswer = session.userAnswers[session.currentIndex];\
  session.checked = false;\
\
  renderCurrentQuestion();\
\}\
\
function finishSession() \{\
  const results = session.questions.map((question, index) => \{\
    const userAnswer = session.userAnswers[index];\
    const isCorrect = userAnswer === question.correct;\
\
    return \{\
      questionId: question.id,\
      question: question.question,\
      category: question.category || "",\
      userAnswer,\
      correctAnswer: question.correct,\
      explanation: question.explanation || "",\
      isCorrect\
    \};\
  \});\
\
  const correctCount = results.filter((result) => result.isCorrect).length;\
  const wrongCount = results.length - correctCount;\
  const percent = results.length > 0\
    ? (correctCount / results.length) * 100\
    : 0;\
\
  const attempt = \{\
    id: Date.now(),\
    date: new Date().toISOString(),\
    mode: session.mode,\
    rangeLabel: session.rangeLabel,\
    total: results.length,\
    correctCount,\
    wrongCount,\
    percent,\
    wrongAnswers: results.filter((result) => !result.isCorrect)\
  \};\
\
  attempts.unshift(attempt);\
\
  /*\
    Damit localStorage nicht unn\'f6tig riesig wird:\
    Wir speichern maximal die letzten 100 Versuche.\
  */\
  attempts = attempts.slice(0, 100);\
\
  saveAttemptsToStorage();\
\
  session = null;\
\
  renderResult(attempt);\
  showResult();\
\}\
\
/* -----------------------------\
   Resultat\
----------------------------- */\
\
function renderResult(attempt) \{\
  const modeLabel =\
    attempt.mode === "test" ? "Testpr\'fcfung" : "Lernmodus";\
\
  $("result-title").textContent = `$\{modeLabel\} abgeschlossen`;\
\
  $("result-summary").innerHTML = `\
    <div class="result-box">\
      <span>Fragen</span>\
      <strong>$\{attempt.total\}</strong>\
    </div>\
\
    <div class="result-box">\
      <span>Richtig</span>\
      <strong>$\{attempt.correctCount\}</strong>\
    </div>\
\
    <div class="result-box">\
      <span>Falsch</span>\
      <strong>$\{attempt.wrongCount\}</strong>\
    </div>\
\
    <div class="result-box">\
      <span>Score</span>\
      <strong>$\{attempt.percent.toFixed(0)\} %</strong>\
    </div>\
  `;\
\
  renderWrongAnswers(attempt.wrongAnswers);\
\
  if (attempt.mode === "test" && attempt.total < 40) \{\
    const note = document.createElement("div");\
    note.className = "note-box";\
    note.textContent =\
      "Hinweis: In dieser Demo-Version sind weniger als 40 Fragen vorhanden. Sobald du deinen echten Katalog importierst, kann die Testpr\'fcfung 40 Fragen ziehen.";\
\
    $("result-summary").after(note);\
  \}\
\}\
\
function renderWrongAnswers(wrongAnswers) \{\
  const list = $("result-wrong-list");\
\
  if (wrongAnswers.length === 0) \{\
    list.innerHTML = `\
      <div class="wrong-item">\
        <span class="tag tag-success">Alles richtig</span>\
        <p class="muted">Keine falsch beantworteten Fragen.</p>\
      </div>\
    `;\
    return;\
  \}\
\
  list.innerHTML = "";\
\
  wrongAnswers.forEach((wrong) => \{\
    const item = document.createElement("div");\
    item.className = "wrong-item";\
\
    item.innerHTML = `\
      <span class="tag tag-danger">Falsch</span>\
      <h3>Frage $\{escapeHtml(wrong.questionId)\}</h3>\
      <p>$\{escapeHtml(wrong.question)\}</p>\
\
      <p>\
        Deine Antwort:\
        <strong>$\{escapeHtml(wrong.userAnswer || "Keine Antwort")\}</strong>\
      </p>\
\
      <p>\
        Richtige Antwort:\
        <strong>$\{escapeHtml(wrong.correctAnswer)\}</strong>\
      </p>\
\
      $\{\
        wrong.explanation\
          ? `<p class="muted">Erkl\'e4rung: $\{escapeHtml(wrong.explanation)\}</p>`\
          : ""\
      \}\
    `;\
\
    list.appendChild(item);\
  \});\
\}\
\
/* -----------------------------\
   Hilfsfunktionen\
----------------------------- */\
\
function shuffleArray(array) \{\
  /*\
    Fisher-Yates-Shuffle:\
    Mischt ein Array zuf\'e4llig.\
  */\
  for (let index = array.length - 1; index > 0; index -= 1) \{\
    const randomIndex = Math.floor(Math.random() * (index + 1));\
\
    const temp = array[index];\
    array[index] = array[randomIndex];\
    array[randomIndex] = temp;\
  \}\
\
  return array;\
\}}