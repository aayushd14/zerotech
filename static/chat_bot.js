/* =====================================================
   ROBOT HEAD MOVEMENT (Mouse-based Parallax Animation)
======================================================*/

const layers = [
	{ id: "hair", initialOffset: { x: 0, y: -18 }, maxOffset: 4, reverse: true },
	{ id: "head", initialOffset: { x: 0, y: 4 }, maxOffset: 4 },
	{ id: "face", initialOffset: { x: 0, y: 7 }, maxOffset: 8 },
	{ id: "expression", initialOffset: { x: 0, y: 7 }, maxOffset: 12 }
].map(layer => ({
	...layer,
	element: document.getElementById(layer.id)
}));

const container = document.getElementById("glits-chatbot");

let containerRect = container.getBoundingClientRect();
let maxDistance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2;

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Apply movement offsets
layers.forEach(layer => {
	layer.element.style.setProperty("--offset-x", `${layer.initialOffset.x}px`);
	layer.element.style.setProperty("--offset-y", `${layer.initialOffset.y}px`);
});

// Update animated robot head movement
function updateParallax() {
	const centerX = containerRect.left + containerRect.width / 2;
	const centerY = containerRect.top + containerRect.height / 2;

	const dx = mouseX - centerX;
	const dy = mouseY - centerY;
	const distance = Math.sqrt(dx * dx + dy * dy);
	if (distance === 0) return;

	const influence = Math.min(distance / maxDistance, 1);
	const dirX = dx / distance;
	const dirY = dy / distance;

	layers.forEach(layer => {
		const factor = layer.reverse ? -1 : 1;
		const offsetX = dirX * layer.maxOffset * influence * factor;
		const offsetY = dirY * layer.maxOffset * influence * factor;

		layer.element.style.setProperty("--offset-x", `${layer.initialOffset.x + offsetX}px`);
		layer.element.style.setProperty("--offset-y", `${layer.initialOffset.y + offsetY}px`);
	});
}

// Animation loop
function animateHead() {
	updateParallax();
	requestAnimationFrame(animateHead);
}
animateHead();

// Track mouse for movement
document.addEventListener("mousemove", e => {
	mouseX = e.clientX;
	mouseY = e.clientY;
});

// Recalculate on resize
window.addEventListener("resize", () => {
	containerRect = container.getBoundingClientRect();
	maxDistance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) / 2;
});

/* =====================================================
   BLINKING ANIMATION
======================================================*/

const blinkConfig = {
	minInterval: 1500,
	maxInterval: 1500,
	closeSpeed: 100,
	closedDuration: 150,
	openSpeed: 150
};

const leftEye = document.getElementById("eye-l");
const rightEye = document.getElementById("eye-r");

/**
 * Blink animation for robot eyes
 */
function blink() {
	const leftBox = leftEye.getBBox();
	const rightBox = rightEye.getBBox();

	leftEye.style.transformOrigin = `${leftBox.x + leftBox.width / 2}px ${leftBox.y + leftBox.height / 2}px`;
	rightEye.style.transformOrigin = `${rightBox.x + rightBox.width / 2}px ${rightBox.y + rightBox.height / 2}px`;

	leftEye.style.transition = `transform ${blinkConfig.closeSpeed}ms ease-out`;
	rightEye.style.transition = `transform ${blinkConfig.closeSpeed}ms ease-out`;

	leftEye.style.transform = "scaleY(0.1)";
	rightEye.style.transform = "scaleY(0.1)";

	setTimeout(() => {
		leftEye.style.transition = `transform ${blinkConfig.openSpeed}ms ease-out`;
		rightEye.style.transition = `transform ${blinkConfig.openSpeed}ms ease-out`;
		leftEye.style.transform = "scaleY(1)";
		rightEye.style.transform = "scaleY(1)";
	}, blinkConfig.closeSpeed + blinkConfig.closedDuration);
}

// Loop blinking
function blinkLoop() {
	const delay = Math.random() * (blinkConfig.maxInterval - blinkConfig.minInterval) + blinkConfig.minInterval;
	setTimeout(() => {
		blink();
		blinkLoop();
	}, delay);
}
blinkLoop();

/* =====================================================
   CHAT SYSTEM LOGIC
======================================================*/

const aiResponses = [
	"Hello! How can I help you today?",
	"This item is very popular!",
	"I'm checking stock availability now.",
	"Thanks! I'm happy to assist!",
	"We support multiple payment methods.",
	"I'm here if you need more help.",
	"Our team will follow up shortly."
];

let chatHistory = [];
let isExpanded = false;
let lastMessageType = null;

// UI elements
const chatButton = document.getElementById("glits-chatbot");
const greetingBubble = document.getElementById("glitsBubble");
const chatWindow = document.getElementById("glits-chatWindow");
const expandButton = document.getElementById("expandButton");
const closeButton = document.getElementById("closeButton");
const chatMessages = document.getElementById("glits-chatMessages");
const chatInput = document.getElementById("glits-chatInput");
const sendButton = document.getElementById("sendButton");

/**
 * Save chat messages
 */
function saveMessage(text, type) {
	chatHistory.push({ text, type, timestamp: Date.now() });
}

function showSuggestions(list) {
  const container = document.getElementById("glitsSuggestions");
  if (!container) return;

  container.innerHTML = "";

  list.forEach(text => {
    const pill = document.createElement("div");
	pill.className = "suggestion-pill";
    pill.textContent = text;

    pill.onclick = () => {
      container.innerHTML = "";
      addMessageToUI(text, "user");
      handleSuggestion(text);
    };

    container.appendChild(pill);
  });
}

async function handleSuggestion(text) {
  showTypingIndicator();
  const aiText = await queryBackend(text);
  removeTypingIndicator();
  addMessageToUI(aiText, "ai");
}

/**
 * Create chat UI messages with avatars
 */
function addMessageToUI(text, type, shouldSave = true) {
	const msg = document.createElement("div");
	msg.className = `message ${type}`;

	const avatar = document.createElement("div");
	avatar.className = type === "ai" ? "ai-avatar" : "user-avatar";
	avatar.innerHTML = type === "ai"
		? `<i class="fa-solid fa-robot"></i>`
		: `<i class="fa-solid fa-user"></i>`;
	msg.appendChild(avatar);

	const bubble = document.createElement("div");
	bubble.className = "message-bubble";

	// Use textContent for safety (prevents XSS), but preserve newlines
	const preElement = document.createElement("pre");
	preElement.className = "help-doc";
	preElement.textContent = text;
	bubble.appendChild(preElement);

	msg.appendChild(bubble);
	chatMessages.appendChild(msg);
	
	if (shouldSave) {
		saveMessage(text, type);
	}
	
	scrollToBottom();
}

/**
 * Typing animation
 */
function showTypingIndicator() {
	const typingDiv = document.createElement("div");
	typingDiv.className = "message ai";
	typingDiv.id = "typingIndicator";

	const avatar = document.createElement("div");
	avatar.className = "ai-avatar";
	avatar.innerHTML = `<i class="fa-solid fa-robot"></i>`;
	typingDiv.appendChild(avatar);

	const bubble = document.createElement("div");
	bubble.className = "message-bubble";
	bubble.innerHTML = `<div class="typing-indicator d-flex"><span></span><span></span><span></span></div>`;
	typingDiv.appendChild(bubble);

	chatMessages.appendChild(typingDiv);
	scrollToBottom();
}

// Remove typing animation
function removeTypingIndicator() {
	const typingDiv = document.getElementById("typingIndicator");
	if (typingDiv) typingDiv.remove();
}

// Random AI reply selection
function getRandomAIResponses() {
	const count = Math.floor(Math.random() * 2) + 1;
	return [...aiResponses].sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Scroll to bottom after new message
 */
function scrollToBottom() {
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Update expand/collapse button icon
 */
function updateExpandButton() {
	expandButton.innerHTML = isExpanded
		? `<i class="fa-solid fa-minimize"></i>`
		: `<i class="fa-solid fa-maximize"></i>`;
}

/* =====================================================
   EVENT HANDLERS
======================================================*/

// Open chat
chatButton.addEventListener("click", () => {
	chatWindow.classList.add("active");
	chatButton.classList.add("hidden");

	if (chatHistory.length === 0) {
		setTimeout(() => {
			addMessageToUI("How can we help?", "ai");
			showSuggestions(defaultSuggestions);
		}, 300);
}
});

// Close chat
closeButton.addEventListener("click", () => {
	chatWindow.classList.remove("active", "expanded");
	chatButton.classList.remove("hidden");
	isExpanded = false;
	updateExpandButton();
});

// Resize chat window
expandButton.addEventListener("click", () => {
	isExpanded = !isExpanded;
	chatWindow.classList.toggle("expanded", isExpanded);
	updateExpandButton();
	setTimeout(scrollToBottom, 100);
});

// Send message button
sendButton.addEventListener("click", sendMessage);

// Send with Enter key
chatInput.addEventListener("keypress", e => {
	if (e.key === "Enter") sendMessage();
});
/**
 * Query the Groq API via Flask backend
 */
async function queryBackend(userText) {
  try {
    console.log("📤 Sending message to backend:", userText);
    
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });
    
    console.log("📥 Response status:", resp.status);
    
    let data;
    try {
      data = await resp.json();
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return "❌ Error: Server response was invalid. Please check the terminal.";
    }
    
    // Handle API errors
    if (data.error) {
      console.error("❌ Backend Error:", data.error);
      return `❌ Error: ${data.error}`;
    }
    
    // Handle successful response
    if (data.response) {
      console.log("✅ Response received");
      return data.response;
    }
    
    // Fallback
    console.error("No response or error field in data:", data);
    return "❌ Sorry, I couldn't generate a response. Please try again.";
    
  } catch (err) {
    console.error("❌ Network Error:", err);
    return `❌ Network error: ${err.message}. Please check your connection.`;
  }
}

/**
 * Send message handler
 */
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) {
    console.warn("⚠️ Empty message, ignoring");
    return;
  }
  
  console.log("📨 User sent:", text);
  addMessageToUI(text, "user");
  chatInput.value = "";
  chatInput.focus();

  showTypingIndicator();
  const aiText = await queryBackend(text);
  removeTypingIndicator();
  addMessageToUI(aiText, "ai");
}
