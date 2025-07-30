const { ipcRenderer } = require('electron');

class StealthAssistantUI {
    constructor() {
        this.isListening = false;
        this.isStealthMode = false;
        this.currentProvider = 'claude';
        this.messages = [];
        this.settings = {};
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
        this.setupVoiceRecognition();
    }

    initializeElements() {
        this.elements = {
            messages: document.getElementById('messages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            voiceBtn: document.getElementById('voiceBtn'),
            screenBtn: document.getElementById('screenBtn'),
            stealthBtn: document.getElementById('stealthBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            minimizeBtn: document.getElementById('minimizeBtn'),
            stealthIndicator: document.getElementById('stealthIndicator'),
            statusText: document.getElementById('statusText'),
            providerText: document.getElementById('providerText'),
            quickActions: document.querySelectorAll('.quick-action')
        };
    }

    setupEventListeners() {
        // Send message
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Voice input
        this.elements.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());

        // Screen capture
        this.elements.screenBtn.addEventListener('click', () => this.captureScreen());

        // Stealth mode
        this.elements.stealthBtn.addEventListener('click', () => this.toggleStealthMode());

        // Settings
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());

        // Minimize
        this.elements.minimizeBtn.addEventListener('click', () => this.hideWindow());

        // Quick actions
        this.elements.quickActions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Global shortcuts (handled by main process)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'a':
                        e.preventDefault();
                        // Toggle assistant window (handled by main process)
                        break;
                    case 's':
                        e.preventDefault();
                        this.toggleStealthMode();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.toggleVoiceInput();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.captureScreen();
                        break;
                }
            }
        });
    }

    async loadSettings() {
        try {
            this.settings = await ipcRenderer.invoke('get-settings');
            this.applySettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    applySettings() {
        // Apply theme, opacity, position, etc.
        if (this.settings.opacity) {
            document.body.style.opacity = this.settings.opacity;
        }
        
        if (this.settings.theme === 'light') {
            document.body.classList.add('light-theme');
        }

        this.elements.providerText.textContent = this.settings.defaultProvider || 'Claude';
        this.currentProvider = this.settings.defaultProvider || 'claude';
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.elements.messageInput.value = '';
        this.updateStatus('Thinking...');

        try {
            const response = await ipcRenderer.invoke('send-to-llm', {
                provider: this.currentProvider,
                message: message,
                context: this.getContext()
            });

            this.addMessage(response.response, 'assistant');
            this.updateStatus('Ready');
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
            this.updateStatus('Error');
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = this.formatMessage(content);
        
        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        
        this.messages.push({ content, sender, timestamp: new Date() });
    }

    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    getContext() {
        return {
            recentMessages: this.messages.slice(-5),
            timestamp: new Date().toISOString(),
            settings: this.settings
        };
    }

    async toggleVoiceInput() {
        if (!this.isListening) {
            await this.startVoiceInput();
        } else {
            this.stopVoiceInput();
        }
    }

    async startVoiceInput() {
        try {
            const hasPermission = await ipcRenderer.invoke('request-permission', 'audioCapture');
            if (!hasPermission) {
                this.updateStatus('Microphone permission denied');
                return;
            }

            this.isListening = true;
            this.elements.voiceBtn.classList.add('listening');
            this.updateStatus('Listening...');

            if (this.recognition) {
                this.recognition.start();
            }
        } catch (error) {
            console.error('Failed to start voice input:', error);
            this.updateStatus('Voice input failed');
        }
    }

    stopVoiceInput() {
        this.isListening = false;
        this.elements.voiceBtn.classList.remove('listening');
        this.updateStatus('Ready');

        if (this.recognition) {
            this.recognition.stop();
        }
    }

    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.elements.messageInput.value = transcript;
                this.stopVoiceInput();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceInput();
                this.updateStatus('Voice input error');
            };

            this.recognition.onend = () => {
                this.stopVoiceInput();
            };
        }
    }

    async captureScreen() {
        try {
            const hasPermission = await ipcRenderer.invoke('request-permission', 'screenCapture');
            if (!hasPermission) {
                this.updateStatus('Screen capture permission denied');
                return;
            }

            this.updateStatus('Capturing screen...');
            const screenshot = await ipcRenderer.invoke('capture-screen');
            
            this.addMessage('📷 Screen captured. What would you like me to analyze?', 'assistant');
            this.updateStatus('Ready');
            
            // Store screenshot for context
            this.lastScreenshot = screenshot;
        } catch (error) {
            console.error('Failed to capture screen:', error);
            this.updateStatus('Screen capture failed');
        }
    }

    async toggleStealthMode() {
        try {
            this.isStealthMode = await ipcRenderer.invoke('toggle-stealth');
            this.updateStealthIndicator();
            this.updateStatus(this.isStealthMode ? 'Stealth mode ON' : 'Stealth mode OFF');
        } catch (error) {
            console.error('Failed to toggle stealth mode:', error);
        }
    }

    updateStealthIndicator() {
        if (this.isStealthMode) {
            this.elements.stealthIndicator.classList.add('active');
        } else {
            this.elements.stealthIndicator.classList.remove('active');
        }
    }

    handleQuickAction(action) {
        const quickMessages = {
            help: 'Can you help me with coding? I need assistance with my current task.',
            learn: 'Can you explain a concept to me? I want to learn something new.',
            summarize: 'Please analyze my current screen and summarize what you see.',
            interview: 'I need help preparing for an interview. Can you assist me?'
        };

        if (quickMessages[action]) {
            this.elements.messageInput.value = quickMessages[action];
            
            if (action === 'summarize') {
                this.captureScreen().then(() => {
                    setTimeout(() => this.sendMessage(), 1000);
                });
            }
        }
    }

    openSettings() {
        // This would typically open a settings modal or window
        console.log('Opening settings...');
        // For now, just show available providers
        this.addMessage('Settings: Available providers - Claude, GPT-4, Gemini, Grok. Use voice commands or type to switch.', 'assistant');
    }

    hideWindow() {
        // Hide the main window
        window.close();
    }

    updateStatus(status) {
        this.elements.statusText.textContent = status;
        
        // Auto-clear status after 3 seconds if it's not "Ready"
        if (status !== 'Ready') {
            setTimeout(() => {
                if (this.elements.statusText.textContent === status) {
                    this.elements.statusText.textContent = 'Ready';
                }
            }, 3000);
        }
    }

    // Provider switching
    switchProvider(provider) {
        const providers = ['claude', 'gpt-4', 'gemini', 'grok'];
        if (providers.includes(provider.toLowerCase())) {
            this.currentProvider = provider.toLowerCase();
            this.elements.providerText.textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
            this.addMessage(`Switched to ${provider}`, 'assistant');
        }
    }

    // Handle natural language commands
    processCommand(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('switch to') || lowerMessage.includes('use')) {
            if (lowerMessage.includes('claude')) this.switchProvider('claude');
            else if (lowerMessage.includes('gpt') || lowerMessage.includes('chatgpt')) this.switchProvider('gpt-4');
            else if (lowerMessage.includes('gemini')) this.switchProvider('gemini');
            else if (lowerMessage.includes('grok')) this.switchProvider('grok');
        }
        
        if (lowerMessage.includes('stealth mode')) {
            this.toggleStealthMode();
        }
        
        if (lowerMessage.includes('capture screen') || lowerMessage.includes('screenshot')) {
            this.captureScreen();
        }
    }
}

// Initialize the UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.assistantUI = new StealthAssistantUI();
});

// Handle window focus/blur for stealth behavior
window.addEventListener('blur', () => {
    if (window.assistantUI && window.assistantUI.settings.autoHide) {
        setTimeout(() => {
            if (!document.hasFocus()) {
                window.close();
            }
        }, 2000);
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StealthAssistantUI;
}