const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const Store = require('electron-store');

class LLMService {
    constructor() {
        this.store = new Store();
        this.clients = {};
        this.initializeClients();
    }

    initializeClients() {
        const apiKeys = this.store.get('apiKeys', {});
        
        // Initialize Anthropic (Claude)
        if (apiKeys.anthropic) {
            this.clients.claude = new Anthropic({
                apiKey: apiKeys.anthropic
            });
        }

        // Initialize OpenAI (GPT)
        if (apiKeys.openai) {
            this.clients.openai = new OpenAI({
                apiKey: apiKeys.openai
            });
        }

        // Initialize Google (Gemini)
        if (apiKeys.google) {
            this.clients.gemini = new GoogleGenerativeAI(apiKeys.google);
        }

        // Grok would be initialized similarly when API is available
        if (apiKeys.grok) {
            this.clients.grok = {
                apiKey: apiKeys.grok,
                baseURL: 'https://api.x.ai/v1' // Placeholder URL
            };
        }
    }

    async sendMessage(provider, message, context = {}) {
        try {
            switch (provider.toLowerCase()) {
                case 'claude':
                    return await this.sendToClaude(message, context);
                case 'gpt-4':
                case 'openai':
                    return await this.sendToGPT(message, context);
                case 'gemini':
                    return await this.sendToGemini(message, context);
                case 'grok':
                    return await this.sendToGrok(message, context);
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        } catch (error) {
            console.error(`Error with ${provider}:`, error);
            return {
                response: `Sorry, I encountered an error with ${provider}. Please try again or switch to a different provider.`,
                provider,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async sendToClaude(message, context) {
        if (!this.clients.claude) {
            throw new Error('Claude API key not configured');
        }

        const systemPrompt = this.buildSystemPrompt(context);
        const messages = this.buildMessageHistory(context.recentMessages || []);
        
        messages.push({
            role: 'user',
            content: message
        });

        const response = await this.clients.claude.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            system: systemPrompt,
            messages: messages
        });

        return {
            response: response.content[0].text,
            provider: 'Claude',
            model: 'claude-3-sonnet',
            timestamp: new Date().toISOString(),
            usage: response.usage
        };
    }

    async sendToGPT(message, context) {
        if (!this.clients.openai) {
            throw new Error('OpenAI API key not configured');
        }

        const systemPrompt = this.buildSystemPrompt(context);
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.buildMessageHistory(context.recentMessages || []),
            { role: 'user', content: message }
        ];

        const response = await this.clients.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        });

        return {
            response: response.choices[0].message.content,
            provider: 'GPT-4',
            model: 'gpt-4-turbo',
            timestamp: new Date().toISOString(),
            usage: response.usage
        };
    }

    async sendToGemini(message, context) {
        if (!this.clients.gemini) {
            throw new Error('Google API key not configured');
        }

        const model = this.clients.gemini.getGenerativeModel({ model: 'gemini-pro' });
        const systemPrompt = this.buildSystemPrompt(context);
        
        const chat = model.startChat({
            history: this.buildGeminiHistory(context.recentMessages || []),
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7
            }
        });

        const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${message}`);
        const response = await result.response;

        return {
            response: response.text(),
            provider: 'Gemini',
            model: 'gemini-pro',
            timestamp: new Date().toISOString()
        };
    }

    async sendToGrok(message, context) {
        if (!this.clients.grok) {
            throw new Error('Grok API key not configured');
        }

        // Placeholder implementation for Grok
        // This would be updated when Grok API becomes available
        const systemPrompt = this.buildSystemPrompt(context);
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.buildMessageHistory(context.recentMessages || []),
            { role: 'user', content: message }
        ];

        try {
            const response = await axios.post(
                `${this.clients.grok.baseURL}/chat/completions`,
                {
                    model: 'grok-1',
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.7
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.clients.grok.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                response: response.data.choices[0].message.content,
                provider: 'Grok',
                model: 'grok-1',
                timestamp: new Date().toISOString(),
                usage: response.data.usage
            };
        } catch (error) {
            // Fallback to mock response since Grok API isn't publicly available yet
            return {
                response: `Grok says: "${message}" - I understand your request and I'm here to help with a witty and informative response! (Note: This is a mock response as Grok API isn't available yet)`,
                provider: 'Grok',
                model: 'grok-1-mock',
                timestamp: new Date().toISOString()
            };
        }
    }

    buildSystemPrompt(context) {
        const basePrompt = `You are a stealth AI assistant designed to help professionals, students, and everyday users. You should be:
- Concise and helpful
- Professional but friendly
- Adaptable to different contexts (work, study, personal)
- Capable of analyzing screens, helping with coding, interview prep, and general tasks
- Discreet and privacy-conscious`;

        let contextualPrompt = basePrompt;

        if (context.screenshot) {
            contextualPrompt += '\n\nYou have access to a screenshot of the user\'s screen. Analyze it to provide relevant assistance.';
        }

        if (context.settings?.mode === 'interview') {
            contextualPrompt += '\n\nThe user is in interview preparation mode. Focus on interview-related assistance.';
        }

        if (context.settings?.mode === 'coding') {
            contextualPrompt += '\n\nThe user is coding. Focus on programming assistance and code analysis.';
        }

        if (context.settings?.mode === 'learning') {
            contextualPrompt += '\n\nThe user is in learning mode. Focus on educational explanations and concept clarification.';
        }

        return contextualPrompt;
    }

    buildMessageHistory(recentMessages) {
        return recentMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    }

    buildGeminiHistory(recentMessages) {
        return recentMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
    }

    // Subscription and usage tracking
    async checkUsageLimits(provider) {
        const usage = this.store.get('usage', {});
        const subscription = this.store.get('subscription', { tier: 'free' });
        
        const limits = {
            free: { daily: 10, monthly: 100 },
            basic: { daily: 100, monthly: 1000 },
            pro: { daily: 1000, monthly: 10000 },
            unlimited: { daily: Infinity, monthly: Infinity }
        };

        const currentUsage = usage[provider] || { daily: 0, monthly: 0 };
        const tierLimits = limits[subscription.tier] || limits.free;

        if (currentUsage.daily >= tierLimits.daily) {
            throw new Error(`Daily limit reached for ${provider}. Upgrade your subscription for more usage.`);
        }

        if (currentUsage.monthly >= tierLimits.monthly) {
            throw new Error(`Monthly limit reached for ${provider}. Upgrade your subscription for more usage.`);
        }

        return true;
    }

    async trackUsage(provider) {
        const usage = this.store.get('usage', {});
        const today = new Date().toDateString();
        const currentMonth = new Date().toISOString().slice(0, 7);

        if (!usage[provider]) {
            usage[provider] = { daily: 0, monthly: 0, lastDaily: today, lastMonthly: currentMonth };
        }

        // Reset daily counter if it's a new day
        if (usage[provider].lastDaily !== today) {
            usage[provider].daily = 0;
            usage[provider].lastDaily = today;
        }

        // Reset monthly counter if it's a new month
        if (usage[provider].lastMonthly !== currentMonth) {
            usage[provider].monthly = 0;
            usage[provider].lastMonthly = currentMonth;
        }

        usage[provider].daily++;
        usage[provider].monthly++;

        this.store.set('usage', usage);
    }

    // Configuration methods
    setApiKey(provider, apiKey) {
        const apiKeys = this.store.get('apiKeys', {});
        apiKeys[provider] = apiKey;
        this.store.set('apiKeys', apiKeys);
        this.initializeClients();
    }

    getAvailableProviders() {
        const apiKeys = this.store.get('apiKeys', {});
        const providers = [];

        if (apiKeys.anthropic) providers.push('Claude');
        if (apiKeys.openai) providers.push('GPT-4');
        if (apiKeys.google) providers.push('Gemini');
        if (apiKeys.grok) providers.push('Grok');

        return providers;
    }

    // Image analysis for screen captures
    async analyzeImage(provider, imageBase64, question) {
        try {
            switch (provider.toLowerCase()) {
                case 'claude':
                    return await this.analyzeImageWithClaude(imageBase64, question);
                case 'gpt-4':
                    return await this.analyzeImageWithGPT(imageBase64, question);
                case 'gemini':
                    return await this.analyzeImageWithGemini(imageBase64, question);
                default:
                    throw new Error(`Image analysis not supported for ${provider}`);
            }
        } catch (error) {
            console.error(`Image analysis error with ${provider}:`, error);
            throw error;
        }
    }

    async analyzeImageWithClaude(imageBase64, question) {
        if (!this.clients.claude) {
            throw new Error('Claude API key not configured');
        }

        const response = await this.clients.claude.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: question || 'What do you see in this image?'
                    },
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/png',
                            data: imageBase64
                        }
                    }
                ]
            }]
        });

        return {
            response: response.content[0].text,
            provider: 'Claude',
            timestamp: new Date().toISOString()
        };
    }

    async analyzeImageWithGPT(imageBase64, question) {
        if (!this.clients.openai) {
            throw new Error('OpenAI API key not configured');
        }

        const response = await this.clients.openai.chat.completions.create({
            model: 'gpt-4-vision-preview',
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: question || 'What do you see in this image?'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/png;base64,${imageBase64}`
                        }
                    }
                ]
            }],
            max_tokens: 1000
        });

        return {
            response: response.choices[0].message.content,
            provider: 'GPT-4 Vision',
            timestamp: new Date().toISOString()
        };
    }

    async analyzeImageWithGemini(imageBase64, question) {
        if (!this.clients.gemini) {
            throw new Error('Google API key not configured');
        }

        const model = this.clients.gemini.getGenerativeModel({ model: 'gemini-pro-vision' });
        
        const result = await model.generateContent([
            question || 'What do you see in this image?',
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: 'image/png'
                }
            }
        ]);

        const response = await result.response;

        return {
            response: response.text(),
            provider: 'Gemini Vision',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = LLMService;