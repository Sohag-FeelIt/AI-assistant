# 🕵️ Stealth AI Assistant

A stealth AI assistant app for professionals, students, and everyday users to automate tasks, assist with learning, and provide real-time support in daily activities using natural language.

## ✨ Features

### 🔒 **Stealth Mode**
- **Invisible during screen sharing**: Automatically hides during screen sharing or exams
- **Ultra-minimalist UI**: Transparent, non-intrusive overlays
- **Permission-based access**: Only acts with explicit user permission
- **Global shortcuts**: Control the assistant without visible interface

### 🤖 **Multi-LLM Support**
- **Claude (Anthropic)**: Advanced reasoning and analysis
- **GPT-4 (OpenAI)**: Versatile language understanding
- **Gemini (Google)**: Multimodal capabilities
- **Grok (X.AI)**: Coming soon with witty responses

### 📱 **Core Capabilities**
- **Screen Analysis**: View and analyze your screen content
- **Voice Input**: Natural speech-to-text interaction
- **Coding Assistance**: Real-time programming help
- **Interview Support**: Practice and preparation assistance
- **Learning Aid**: Concept explanations and tutoring
- **Document Context**: Remember and contextualize any document
- **Task Automation**: Natural language task execution

### 🎯 **Smart Features**
- **Context Awareness**: Remembers conversation history
- **Quick Actions**: Pre-defined assistance templates
- **Subscription Tiers**: Usage limits based on subscription
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API keys for at least one LLM provider

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd stealth-ai-assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API Keys**
   - Launch the app and go to Settings → AI Providers
   - Add your API keys for desired providers:
     - **Claude**: Get from [console.anthropic.com](https://console.anthropic.com/)
     - **GPT-4**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
     - **Gemini**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. **Start Development**
```bash
npm run dev
```

5. **Build for Production**
```bash
npm run build
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Alt+A` | Toggle Assistant Window |
| `Ctrl+Shift+Alt+S` | Toggle Stealth Mode |
| `Ctrl+Shift+Alt+L` | Voice Input |
| `Ctrl+Shift+Alt+C` | Capture Screen |
| `Ctrl+Shift+Alt+H` | Hide Overlay |

## 🎨 UI Design Philosophy

### Ultra-Minimalist Approach
- **Transparency**: All windows use blur effects and transparency
- **Non-Intrusive**: Overlays don't interfere with work
- **Clean Typography**: System fonts for familiarity
- **Subtle Animations**: Smooth transitions without distraction

### Stealth Considerations
- **Screen Share Detection**: Automatically hides during sharing
- **Minimal Footprint**: Small memory and CPU usage
- **Quick Hide**: Instant hiding with shortcuts
- **Accessibility Hidden**: Invisible to screen readers when needed

## 🔧 Configuration

### Settings Categories

#### **General**
- Theme (Dark/Light/Auto)
- Opacity levels
- Window positioning
- Auto-hide behavior

#### **AI Providers**
- API key management
- Default provider selection
- Usage tracking
- Connection testing

#### **Shortcuts**
- Global hotkey configuration
- Custom key bindings
- Gesture controls

#### **Subscription**
- Usage limits monitoring
- Tier management
- Feature access control

## 📊 Subscription Tiers

| Tier | Daily Limit | Monthly Limit | Features |
|------|-------------|---------------|----------|
| **Free** | 10 | 100 | Basic assistance, Screen capture, Voice input |
| **Basic** | 100 | 1,000 | All Free features + Extended context |
| **Pro** | 1,000 | 10,000 | All Basic features + Advanced automation, Priority support |
| **Unlimited** | ∞ | ∞ | All features + Custom integrations, API access |

## 🛠️ Development

### Project Structure
```
stealth-ai-assistant/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.js     # Main application logic
│   │   └── llm-service.js # LLM integration service
│   ├── renderer/       # Electron renderer process
│   │   ├── index.html  # Main UI
│   │   ├── app.js      # Main UI logic
│   │   ├── overlay.html # Stealth overlay
│   │   └── settings.html # Settings window
│   └── assets/         # Icons and resources
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
└── README.md           # This file
```

### Available Scripts

```bash
# Development
npm run dev              # Start development with hot reload
npm run dev:main         # Start main process only
npm run dev:renderer     # Start renderer process only

# Production
npm run build            # Build for production
npm run build:renderer   # Build renderer only
npm run build:main       # Build main process only

# Distribution
npm start               # Start production build
npm test                # Run tests
```

### Adding New LLM Providers

1. **Update LLMService** (`src/main/llm-service.js`)
   - Add client initialization
   - Implement provider-specific methods
   - Add to switch statements

2. **Update Settings UI** (`src/renderer/settings.html`)
   - Add API key input field
   - Add to provider selection dropdown
   - Update connection testing

3. **Update Main Process** (`src/main/main.js`)
   - Add any provider-specific IPC handlers
   - Update permission system if needed

## 🔒 Privacy & Security

### Data Handling
- **Local Storage**: All settings stored locally using electron-store
- **No Data Collection**: No telemetry or usage analytics
- **API Keys**: Stored securely in encrypted local storage
- **Screen Captures**: Processed locally, not stored permanently

### Stealth Features
- **Screen Share Detection**: Uses browser APIs to detect sharing
- **Process Hiding**: Minimal system footprint
- **Memory Management**: Efficient resource usage
- **Quick Exit**: Emergency hide functionality

## 🐛 Troubleshooting

### Common Issues

**App won't start**
- Check Node.js version (18+ required)
- Verify all dependencies are installed: `npm install`
- Check for port conflicts (default: 5173)

**LLM not responding**
- Verify API keys in Settings → AI Providers
- Test connection using "Test Connections" button
- Check internet connectivity
- Verify subscription/usage limits

**Screen capture not working**
- Grant screen recording permissions (macOS)
- Check if running in secure context
- Verify camera/screen permissions

**Stealth mode issues**
- Update graphics drivers
- Check transparency support
- Verify overlay permissions

### Debug Mode
```bash
# Enable debug logging
DEBUG=stealth-ai:* npm run dev

# Open developer tools
# Main window: F12 or Ctrl+Shift+I
# Settings: Built-in dev tools button
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Test on multiple platforms
- Ensure stealth mode compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Electron** - Cross-platform desktop app framework
- **Anthropic** - Claude AI API
- **OpenAI** - GPT-4 API
- **Google** - Gemini AI API
- **Vite** - Fast build tool
- **Contributors** - Everyone who helps improve this project

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/stealth-ai-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/stealth-ai-assistant/discussions)
- **Email**: support@stealth-ai-assistant.com

---

**⚠️ Disclaimer**: This tool is designed for legitimate productivity and learning purposes. Users are responsible for ensuring compliance with their organization's policies and local laws regarding AI assistance and screen monitoring tools.

**🔐 Privacy First**: Your conversations and data never leave your device except for API calls to your chosen LLM providers. No telemetry, no tracking, no data collection.