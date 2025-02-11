const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesList = document.getElementById('messages');
const clearButton = document.getElementById('c-button');

sendButton.addEventListener('click', sendMessage);
document.addEventListener('DOMContentLoaded', loadMessages);
clearButton.addEventListener('click', clearMessages);

messageInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const messageText = messageInput.value;
    if (messageText.trim() !== '') {
        const messageItem = document.createElement('li');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
        const fullMessage = `${messageText} (${timestamp})`;
        messageItem.textContent = fullMessage;
        messagesList.appendChild(messageItem);
        messageInput.value = '';
        messagesList.scrollTop = messagesList.scrollHeight;
        saveMessage(fullMessage);
    }
}

function saveMessage(message) {
    let chatLogs = localStorage.getItem('chatLogs') ? JSON.parse(localStorage.getItem('chatLogs')) : [];
    chatLogs.push(message);
    localStorage.setItem('chatLogs', JSON.stringify(chatLogs));
}

function loadMessages() {
    let chatLogs = localStorage.getItem('chatLogs') ? JSON.parse(localStorage.getItem('chatLogs')) : [];
    chatLogs.forEach(msg => {
        const messageItem = document.createElement('li');
        messageItem.textContent = msg;
        messagesList.appendChild(messageItem);
    });
    messagesList.scrollTop = messagesList.scrollHeight;
}

function clearMessages() {
    localStorage.removeItem('chatLogs');
    messagesList.innerHTML = '';
}
