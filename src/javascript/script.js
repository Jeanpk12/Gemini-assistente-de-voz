import { GoogleGenerativeAI } from "@google/generative-ai";

let currentUtterance = null;
let API_KEY = localStorage.getItem("API_KEY");
const genAI = new GoogleGenerativeAI(API_KEY);
let chat = null;

// Funções relacionadas ao envio de mensagem
async function sendMessage(message) {
  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const textResponse = await response.text();
    speakText(textResponse);
  } catch (error) {
    console.error("Erro:", error);
  }
}

document
  .querySelector(".submit-button")
  .addEventListener("click", submitQuestion);

document
  .getElementById("question")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitQuestion();
    }
  });

function submitQuestion() {
  const questionInput = document.getElementById("question");
  const question = questionInput.value.trim();
  const submitButton = document.querySelector(".submit-button");
  const loaderIcon = '<i class="ri-loader-4-line"></i>';
  const sendSound = document.getElementById("send-sound");

  if (question !== "") {
    if (!chat) {
      startChat();
    }
    sendSound.play();
    submitButton.innerHTML = loaderIcon;
    submitButton.style.animation = "rotate 2s linear infinite";

    sendMessage(question).then(() => {
      submitButton.innerHTML = '<i class="ri-search-2-line"></i>';
      submitButton.style.animation = "none";
    });

    questionInput.value = "";
  }
}

// Funções relacionadas à conversão de texto em voz
function removeMarkdown(text) {
  text = text.replace(/\*/g, "");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/#{1,6}\s?/g, "");
  text = text.replace(/^\s*([-+*])\s*/gm, "");
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  text = text.replace(/!\[([^\]]+)\]\([^\)]+\)/g, "");
  return text;
}

function speakText(text) {
  if ("speechSynthesis" in window) {
    var synth = window.speechSynthesis;
    var sentences = text.match(/[^\.!\?]+[\.!\?]+/g); // Divide o texto em frases
    if (sentences) {
      var numSentences = sentences.length; // Número total de frases
      var sentencesSpoken = 0; // Contador de frases já sintetizadas em voz
      sentences.forEach(function (sentence) {
        var utterance = new SpeechSynthesisUtterance(
          removeMarkdown(sentence.trim())
        );
        utterance.lang = "pt-BR";
        utterance.onstart = function () {
          // Mudar icone
          const icon = document.querySelector(".speak-icon lord-icon");
          icon.setAttribute("trigger", "loop");
          icon.setAttribute("state", "loop-recording");
          icon.setAttribute("delay", 0);
          currentUtterance = utterance;
          // Exibir o botão stop-button
          document.querySelector(".stop-button").classList.remove("hidden");
        };
        utterance.onend = function () {
          sentencesSpoken++; // Incrementa o contador de frases sintetizadas em voz
          if (sentencesSpoken === numSentences) {
            // Verifica se todas as frases foram sintetizadas
            // Ocultar o botão stop-button após todas as frases serem sintetizadas
            document.querySelector(".stop-button").classList.add("hidden");
            // Voltar icone inicial após todas as frases serem sintetizadas
            const icon = document.querySelector(".speak-icon lord-icon");
            icon.setAttribute("trigger", "hover");
            icon.setAttribute("state", "recording");
          }
        };
        synth.speak(utterance);
      });
    } else {
      console.error("Texto vazio ou não reconhecido");
    }
  } else {
    console.error("API de Síntese de Fala não suportada");
  }
}

// Funções de inicialização do chat
async function startChat() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });
    chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1500,
      },
    });
  } catch (error) {
    console.error("Erro:", error);
  }
}

function stopChat() {
  if (currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    const icon = document.querySelector(".speak-icon lord-icon");
    icon.setAttribute("trigger", "in");
    icon.setAttribute("state", "in-reveal");
    document.querySelector(".stop-button").classList.add("hidden");
  }
}

// Listeners de eventos

document.querySelector(".stop-button").addEventListener("click", stopChat);
