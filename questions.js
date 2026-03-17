var questions = [];
var count = 0;
var score = 0;
var Ansgiven = []; // Store answers given by the user
var topicName = ''; // Variable to store the topic name
const submitSound = document.getElementById("submit-sound");
let timeLeft = 50 * 60; // 50 minutes in seconds
let timerId = null;

const uniqueKey = "G10M2Eng_assessment_writing";

// Helper functions for localStorage
function saveToLocalStorage(key, value) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {};
  storageData[key] = value;
  localStorage.setItem(uniqueKey, JSON.stringify(storageData));
}

function getFromLocalStorage(key) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {};
  return storageData[key];
}

// Fetch the questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    const urlParams = new URLSearchParams(window.location.search);
    topicName = urlParams.get('topic');
    const selectedTopic = data.topics.find(t => t.heading === topicName);

    if (selectedTopic) {
      questions = selectedTopic.questions;
      count = questions.length;
      
      saveToLocalStorage(topicName + '_totalQuestions', count);
      document.getElementById('heading').innerText = topicName || 'PS';
      
      // Load all questions at once
      loadAllQuestions();
      
      // Start the timer
      startTimer();

      // Store topics in local storage
      const topics = JSON.parse(localStorage.getItem('topics')) || [];
      if (!topics.find(t => t.heading === topicName)) {
        topics.push(selectedTopic);
        saveToLocalStorage('topics', topics);
      }
    } else {
      document.getElementById('heading').innerText = 'Topic not found';
      document.getElementById('questiondiv').innerHTML = 'No questions available for this topic.';
    }
  });

function loadAllQuestions() {
  const questionDiv = document.getElementById('questiondiv');
  questionDiv.innerHTML = '';
  
  const allQuestionsContainer = document.createElement('div');
  allQuestionsContainer.className = 'all-questions-container';

  questions.forEach((question, index) => {
    const singleQuestionContainer = document.createElement('div');
    singleQuestionContainer.className = 'question-container';
    singleQuestionContainer.style.marginBottom = '30px';
    singleQuestionContainer.style.padding = '20px';
    singleQuestionContainer.style.border = '1px solid #ddd';
    singleQuestionContainer.style.borderRadius = '8px';
    singleQuestionContainer.style.fontSize = '2.4rem';

    // Question number and text
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.innerHTML = `<strong>Question ${index + 1}:</strong> ${question.question}`;
    singleQuestionContainer.appendChild(questionText);

    // Check question type and render accordingly
    // Check question type and render accordingly
if (question.text_area !== undefined) {
  // Handle text area questions
  const textAreaContainer = createTextAreaQuestion(question, index);
  singleQuestionContainer.appendChild(textAreaContainer);
} 
else if (question.type === "table" && question.table) {
  // Handle table-type questions
  const tableContainer = createTableQuestion(question, index);
  singleQuestionContainer.appendChild(tableContainer);
}
else if (question.input) {
  // Handle regular input questions
  const inputContainer = createInputQuestion(question, index);
  singleQuestionContainer.appendChild(inputContainer);
}
else if (question.options && Array.isArray(question.options)) {
  // Handle radio button questions
  const optionsContainer = createRadioQuestion(question, index);
  singleQuestionContainer.appendChild(optionsContainer);
}
else {
  console.warn("Question has no recognizable type:", question);
}



    allQuestionsContainer.appendChild(singleQuestionContainer);
  });

  questionDiv.appendChild(allQuestionsContainer);

  // Add submit button
 const submitButton = document.createElement('button');
submitButton.className = 'submit-btn-centered';
submitButton.textContent = 'Submit Answers';
submitButton.onclick = submitAllAnswers;
questionDiv.appendChild(submitButton);
}

// Create text area question
function createTextAreaQuestion(question, questionIndex) {
  const textAreaContainer = document.createElement('div');
  textAreaContainer.className = 'textarea-container';
  textAreaContainer.style.marginTop = '20px';

  const textArea = document.createElement('textarea');
  textArea.className = 'answer-textarea';
  textArea.style.width = '100%';
  textArea.style.minHeight = '300px';
  textArea.style.padding = '10px';
  textArea.style.fontSize = '18px';
  textArea.style.border = '2px solid #D6B65B';
  textArea.style.borderRadius = '4px';
  textArea.style.resize = 'vertical';
  textArea.placeholder = 'Enter your answer here...';

  // Load saved answer if exists
  if (Ansgiven[questionIndex]) {
    textArea.value = Ansgiven[questionIndex];
  }

  // Save answer when input changes
  textArea.oninput = (e) => {
    saveAnswer(questionIndex, e.target.value);
  };

  textAreaContainer.appendChild(textArea);
  return textAreaContainer;
}

// Create table-type question
function createTableQuestion(question, questionIndex) {
  const tableContainer = document.createElement('div');
  tableContainer.style.marginTop = '20px';

  const table = document.createElement('table');
  table.style.border = '2px solid #D6B65B';
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';

  const headerRow = document.createElement('tr');
  question.table.columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    th.style.border = '1px solid #D6B65B';
    th.style.padding = '10px';
    th.style.backgroundColor = '#f0f0f0';
    th.style.fontSize = '20px';
    th.style.textAlign = 'center';
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  question.table.rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');

    row.forEach((cellValue, colIndex) => {
      const td = document.createElement('td');
      td.style.border = '1px solid #D6B65B';
      td.style.padding = '10px';
      td.style.fontSize = '18px';
      td.style.textAlign = 'center';

      // If cell has pre-filled data → show as label (NOT editable)
      if (cellValue && cellValue.trim() !== "") {
        td.innerHTML = `<span style="font-size:18px;">${cellValue}</span>`;
      } else {
        // Editable input for empty cells
        const input = document.createElement('input');
        input.type = 'text';
        input.style.width = '100%';
        input.style.textAlign = 'center';
        input.style.fontSize = '18px';
        input.style.border = 'none';
        input.style.backgroundColor = '#f9f9f9';

        // Load saved answers
        if (Ansgiven[questionIndex]?.[rowIndex]?.[colIndex]) {
          input.value = Ansgiven[questionIndex][rowIndex][colIndex];
        }

        // Save new answer
        input.oninput = (e) => {
          if (!Ansgiven[questionIndex]) Ansgiven[questionIndex] = [];
          if (!Ansgiven[questionIndex][rowIndex]) Ansgiven[questionIndex][rowIndex] = [];

          Ansgiven[questionIndex][rowIndex][colIndex] = e.target.value;
          saveToLocalStorage('Ansgiven', Ansgiven);
        };

        td.appendChild(input);
      }

      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  tableContainer.appendChild(table);
  return tableContainer;
}



// Create regular input question
function createInputQuestion(question, questionIndex) {
  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  inputContainer.style.marginTop = '20px';
  inputContainer.style.display = 'flex';
  inputContainer.style.gap = '10px';
  inputContainer.style.alignItems = 'center';

  // Initialize answers array with fixed operands
  const answers = Ansgiven[questionIndex] || [];
  question.input.forEach((field, idx) => {
    if (field.operand !== "") {
      answers[idx] = field.operand;
    }
  });
  Ansgiven[questionIndex] = answers;
  saveAnswer(questionIndex, answers);

  question.input.forEach((field, fieldIndex) => {
    if (field.operand !== "") {
      // For fixed operands, create a disabled input
      const fixedInput = document.createElement('input');
      fixedInput.type = 'text';
      fixedInput.className = 'numeric-input';
      fixedInput.value = field.operand;
      fixedInput.disabled = true;
      fixedInput.style.width = '50px';
      fixedInput.style.height = '50px';
      fixedInput.style.fontSize = '24px';
      fixedInput.style.textAlign = 'center';
      fixedInput.style.border = 'none';
      inputContainer.appendChild(fixedInput);
    } else {
      // For empty operands, create an editable input
      const inputField = document.createElement('input');
      inputField.type = 'text';
      inputField.className = 'numeric-input';
      inputField.style.width = '70px';
      inputField.style.height = '50px';
      inputField.style.fontSize = '24px';
      inputField.style.textAlign = 'center';
      inputField.style.border = '2px solid #D6B65B';
      inputField.style.borderRadius = '4px';
      
      // Save answer when input changes
      inputField.oninput = (e) => {
        const currentAnswers = Ansgiven[questionIndex] || [];
        currentAnswers[fieldIndex] = e.target.value;
        saveAnswer(questionIndex, currentAnswers);
      };
      
      inputContainer.appendChild(inputField);
    }
  });

  return inputContainer;
}

// Create radio button question
function createRadioQuestion(question, questionIndex) {
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'options-container';
  const hasImageOptions = question.options?.some(opt => opt.image) || false;
  
  if (hasImageOptions) {
    optionsContainer.style.display = 'grid';
    optionsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    optionsContainer.style.gap = '1rem';
  } else {
    optionsContainer.style.display = 'flex';
    optionsContainer.style.flexDirection = 'column';
    optionsContainer.style.gap = '10px';
  }

  question.options.forEach((option, optIndex) => {
    const optionWrapper = createOptionElement(option, questionIndex, optIndex);
    optionsContainer.appendChild(optionWrapper);
  });

  return optionsContainer;
}

// Helper function to create option elements
function createOptionElement(option, questionIndex, optionIndex) {
  const optionWrapper = document.createElement('div');
  optionWrapper.className = 'option-wrapper';
  optionWrapper.style.position = 'relative';
  optionWrapper.style.display = 'flex';
  optionWrapper.style.alignItems = 'center';
  optionWrapper.style.gap = '10px';
  optionWrapper.style.cursor = 'pointer';
  
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = `question${questionIndex}`;
  radio.value = optionIndex;
  radio.style.marginRight = '10px';
  
  if (option.image) {
    const img = document.createElement('img');
    img.src = option.image;
    img.alt = 'Option Image';
    img.style.height = '150px';
    img.style.borderRadius = '12px';
    img.style.cursor = 'pointer';
    
    if (option.sound) {
      img.onmouseover = () => playOptionSound(option.sound);
    }
    
    optionWrapper.appendChild(radio);
    optionWrapper.appendChild(img);
  } else {
    const textSpan = document.createElement('span');
    textSpan.innerHTML = option.text;
    textSpan.style.flex = '1';
    
    optionWrapper.appendChild(radio);
    optionWrapper.appendChild(textSpan);
  }

  optionWrapper.addEventListener('click', () => {
    radio.checked = true;
    saveAnswer(questionIndex, optionIndex);
  });

  return optionWrapper;
}

function saveAnswer(questionIndex, answer) {
  Ansgiven[questionIndex] = answer;
  saveToLocalStorage('Ansgiven', Ansgiven);
}

function submitAllAnswers() {
  try {
    // Clear timer
    if (timerId) {
      clearInterval(timerId);
      const timerDiv = document.getElementById('timer');
      if (timerDiv) {
        timerDiv.remove();
      }
    }

    // Validate required data exists
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error('No questions available');
    }

    if (!Ansgiven) {
      Ansgiven = []; // Initialize if undefined
    }

    // Play submit sound with error handling
    const sound1 = new Audio('./assests/sounds/submit.mp3');
    sound1.onerror = () => console.warn('Submit sound failed to load');
    sound1.play().catch(err => console.warn('Submit sound failed to play:', err));

    // Validate topic name
    if (!topicName) {
      topicName = 'default_topic';
    }

    // Save results with error handling
    try {
      saveToLocalStorage(topicName + '_completed', 'true');
    } catch (storageError) {
      console.error('Failed to save results:', storageError);
    }

    // Generate results content
    const home = "<a href='./graph.html'><b class='btn btn-success next-btn-progress'>Click here to View Report</b></a><br>";
    
    try {
      saveToLocalStorage(topicName + '_results_content', home);
    } catch (storageError) {
      console.error('Failed to save results content:', storageError);
    }

    // Generate question review
    let questionContent = generateQuestionReview();
    
    try {
      saveToLocalStorage(topicName + '_question_content', questionContent);
    } catch (storageError) {
      console.error('Failed to save question content:', storageError);
    }

    // Hide quiz elements
    const questionDiv = document.getElementById("questiondiv");
    if (questionDiv) {
      questionDiv.style.display = "none";
    }

    // Play completion animation and sound
    try {
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (confettiError) {
      console.warn('Confetti animation failed:', confettiError);
    }

    try {
      const sound = new Audio('./assests/sounds/well-done.mp3');
      sound.onerror = () => console.warn('Completion sound failed to load');
      sound.play().catch(err => console.warn('Completion sound failed to play:', err));
    } catch (soundError) {
      console.warn('Failed to play completion sound:', soundError);
    }

    // Redirect to results
    window.location.href = "./graph.html";
  } catch (error) {
    console.error('Error in submitAllAnswers:', error);
    alert('There was an error submitting your answers. Please try again or contact support.');
  }
}

// Helper function to generate question review
function generateQuestionReview() {
  try {
    let pages = [];
    let shortQuestions = [];

    // 1️⃣ Separate questions
    questions.forEach((q, index) => {
      if (q.type === "short") {
        shortQuestions.push({ q, index });
      } else if (q.type === "long") {
        pages.push([{ q, index }]); // each long question = one page
      }
    });

    // 2️⃣ Add all short questions as first page (if any)
    if (shortQuestions.length > 0) {
      pages.unshift(shortQuestions);
    }

    // 3️⃣ Build HTML pages
    let questionContent = "";

    pages.forEach((pageQuestions, pageIndex) => {
      let pageDiv = `
        <div class="question-page" 
             style="display:${pageIndex === 0 ? "block" : "none"};">
          <h2>Page ${pageIndex + 1}</h2>
      `;

      pageQuestions.forEach(({ q, index }) => {
        pageDiv += generateQuestionReviewItem(q, index);
      });

      pageDiv += "</div>";
      questionContent += pageDiv;
    });

    return questionContent;
  } catch (error) {
    console.error("Error generating question review:", error);
    return "<div>Error generating question review</div>";
  }
}

// Helper function to generate single question review item
// Helper function to generate single question review item
function generateQuestionReviewItem(question, index) {
  try {
    const ques = question.question || 'Question not available';

    // ============================================================
    // 1️⃣ TABLE-TYPE QUESTIONS (FIXED VERSION)
    // ============================================================
    if (question.type === "table" && question.table) {

      const userAns = Ansgiven[index] || [];
      const smeAns = question.answer || [];
      const baseRows = question.table.rows;

      // USER TABLE (now includes prefilled inputs from JSON rows)
      let userTable = `
        <table class="review-table" style="width:100%; border-collapse:collapse; border:1px solid #ccc; margin-top:10px;">
          <tr>
            ${question.table.columns.map(c => `
              <th style="border:1px solid #ccc; padding:8px; background:#f5f5f5;">${c}</th>`
            ).join("")}
          </tr>
      `;

      baseRows.forEach((row, rIndex) => {
        userTable += "<tr>";
        row.forEach((originalCell, cIndex) => {

          let finalValue = "";

          // CASE 1: Prefilled from original table.rows
          if (originalCell && originalCell.trim() !== "") {
            finalValue = originalCell;
          }

          // CASE 2: User-entered value overrides prefilled
          if (userAns?.[rIndex]?.[cIndex]) {
            finalValue = userAns[rIndex][cIndex];
          }

          userTable += `
            <td style="border:1px solid #ccc; padding:8px; text-align:center;">
              ${finalValue.trim() === "" ? "<span style='color:red'>__</span>" : finalValue}
            </td>
          `;
        });
        userTable += "</tr>";
      });

      userTable += "</table>";


      // SME TABLE
      let smeTable = `
        <table class="review-table" style="width:100%; border-collapse:collapse; border:1px solid #ccc; margin-top:10px;">
          <tr>
            ${question.table.columns.map(c => `
              <th style="border:1px solid #ccc; padding:8px; background:#f5f5f5;">${c}</th>`
            ).join("")}
          </tr>
      `;

      smeAns.forEach(row => {
        smeTable += "<tr>";
        row.forEach(col => {
          smeTable += `
            <td style="border:1px solid #ccc; padding:8px; text-align:center;">
              ${col}
            </td>
          `;
        });
        smeTable += "</tr>";
      });

      smeTable += "</table>";

      return `
        <div style="padding:15px; border:1px solid #ddd; border-radius:8px; margin-bottom:25px;">
          <strong>Q.${index + 1}:</strong> ${ques}<br><br>

          <strong>Your Answer:</strong><br>
          ${userTable}

          <br><strong>SME's Answer:</strong><br>
          ${smeTable}
        </div>
      `;
    }

    // ============================================================
    // 2️⃣ TEXT AREA QUESTIONS
    // ============================================================
    if (question.text_area !== undefined) {

  // Normalize SME answer
  const smeAnswer =
    Array.isArray(question.answer)
      ? (question.answer[0] || "")
      : (question.answer || "");

  const showSME = smeAnswer.trim() !== "";

  const formattedCorrect = smeAnswer.replace(/\n/g, "<br>");

  return `
    <div style="padding:15px; border:none; border-radius:8px; margin-bottom:20px;font-size:1.4rem;">
      <strong>Q.${index + 1}:</strong> ${ques}<br><br>

      <strong>Your Answer:</strong><br>
      <div style="padding:10px; font-size:1rem; white-space: pre-wrap; font-family: inherit; text-align: left;">
        ${Ansgiven[index] || "<span style='color:gray'>Not Answered</span>"}
      </div>

      ${
        showSME
          ? `
            <br><strong>SME's Answer:</strong><br>
            <div style="padding:10px; font-size:1.3rem;">
              ${formattedCorrect}
            </div>
          `
          : ""
      }
    </div>
  `;
}



    // ============================================================
    // 3️⃣ INPUT-TYPE QUESTIONS
    // ============================================================
    if (question.input && Array.isArray(question.answer)) {
      const userAnswers = Ansgiven[index] || [];

      const formatted = question.input.map((field, idx) => {
        let val = field.operand !== "" ? field.operand : userAnswers[idx] || "";
        if (String(val) === String(question.answer[idx])) {
          return val;
        }
        return `<span style="color:red">${val || "__"}</span>`;
      });

      return `
        <strong>Q.${index + 1}:</strong> ${ques}<br>
        SME's Answer: ${question.answer.join(", ")}<br>
        Your Answer: ${formatted.join(", ")}<br><br>
      `;
    }

    // ============================================================
    // 4️⃣ RADIO QUESTIONS
    // ============================================================
    const ans = question.options?.[question.answer];
    const given = Ansgiven[index] !== undefined ? question.options?.[Ansgiven[index]] : null;

    let correctHtml = ans?.image
      ? `<img src="${ans.image}" style="width:60px; height:60px;">`
      : ans.text || ans;

    let givenHtml = "";

    if (!given) {
      givenHtml = `<span style="color:red">Not Answered</span>`;
    } else {
      const isCorrect = Ansgiven[index] === question.answer;
      givenHtml = given.image
        ? `<img src="${given.image}" style="width:60px; height:60px; border:${isCorrect ? 'none' : '2px solid red'};">`
        : `<span style="color:${isCorrect ? 'black' : 'red'}">${given.text || given}</span>`;
    }

    return `
      <strong>Q.${index + 1}:</strong> ${ques}<br>
      SME's Answer: ${correctHtml}<br>
      Your Answer: ${givenHtml}<br><br>
    `;

  } catch (err) {
    console.error("Review generation error:", err);
    return `<div>Error in review</div>`;
  }
}



function showPage(pageNumber) {
  var pages = document.getElementsByClassName('question-page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].style.display = "none";
  }
  pages[pageNumber].style.display = "block";
}

function playOptionSound(soundPath) {
  const sound = new Audio(soundPath);
  sound.play();
}

function getOptionLabel(option) {
  return typeof option === 'string' ? option : option.text || '';
}

function startTimer() {
  // Timer function placeholder - implement as needed
}