let wordsData = []; // Holds the pronunciation data

// Function to load words data from JSON file (unchanged)
function loadWordsData() {
  fetch('words.json')
    .then(response => response.json())
    .then(data => {
      wordsData = data;
      displayWordsList(data);
    })
    .catch(error => console.error("Failed to load words data:", error));
}

function processInputText() {
  const inputText = document.getElementById('textInput').value;
  // Split input text into words based on whitespace and remove punctuation
  const words = inputText.split(/\s+/).map(word => word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));

  const processedWordsData = words.map(word => {
    // Normalize the word by removing punctuation and converting to lowercase
    const normalizedWord = word.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ");
    // Try to find the normalized word in the database
    const pronunciationData = wordsData.find(data => data.word.toLowerCase() === normalizedWord);
    if (pronunciationData) {
      return pronunciationData; // Return the pronunciation data if found
    } else {
      // Return a default representation for words not found
      return {
        word: word,
        syllables: [{ text: word, stress: 'none', silent: false }]
      };
    }
  });

  processWords(processedWordsData); // Use the existing processWords function to render the words
}



function processWords(wordsData) {
  const container = document.getElementById('processedWords');
  container.innerHTML = ''; // Clear previous content

  wordsData.forEach(wordData => {
    const wordElement = document.createElement('span');
    wordElement.classList.add('word');

    wordData.syllables.forEach(syllable => {
      const syllableElement = document.createElement('span');
      syllableElement.textContent = syllable.text;
      syllableElement.classList.add('syllable');

      // Apply visual cues based on stress and silence
      if (syllable.silent) {
        syllableElement.classList.add('silent');
      } else if (syllable.stress === 'high') {
        syllableElement.classList.add('high-stress');
      } else if (syllable.stress === 'low') {
        syllableElement.classList.add('low-stress');
      } else {
        syllableElement.classList.add('no-stress');
      }

      wordElement.appendChild(syllableElement);
    });

    container.appendChild(wordElement);
    container.appendChild(document.createTextNode(' ')); // Add space between words
  });
}

function displayWordsList(wordsData) {
  const listContainer = document.getElementById('wordsList');
  listContainer.innerHTML = ''; // Clear existing content

  const list = document.createElement('ul');
  wordsData.forEach(wordData => {
    const listItem = document.createElement('li');
    listItem.textContent = wordData.word;
    listItem.addEventListener('click', function () {
      const textInput = document.getElementById('textInput');
      textInput.value += (textInput.value ? ' ' : '') + wordData.word; // Add the clicked word to the textarea
      processInputText(); // Recalculate the formatted text
    });
    list.appendChild(listItem);
  });

  listContainer.appendChild(list);
}


loadWordsData();
