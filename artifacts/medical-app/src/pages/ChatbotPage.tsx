import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonAvatar,
  IonFooter,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonChip,
  IonLabel,
  IonToast,
  IonBadge,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import {
  send,
  person,
  sparkles,
  flask,
  heartPulse,
  brain,
  bookOpen,
  alertCircle,
  refreshCw,
  lightbulb,
  shieldAlert,
  info,
} from 'ionicons/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import AnimatedPage from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface SuggestedPrompt {
  icon: string;
  text: string;
  category: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { icon: flask, text: 'Help me structure a literature review on malaria in pregnancy', category: 'Research' },
  { icon: heartPulse, text: 'Explain the pathophysiology of heart failure in simple terms', category: 'Study' },
  { icon: brain, text: 'I\'m feeling overwhelmed with exams. Any coping strategies?', category: 'Wellness' },
  { icon: bookOpen, text: 'What are the best free research databases for Nigerian medical students?', category: 'Resources' },
  { icon: lightbulb, text: 'How do I choose a research topic for my final year project?', category: 'Research' },
  { icon: alertCircle, text: 'Walk me through writing a case report step by step', category: 'Research' },
];

const DAILY_MESSAGE_LIMIT = 50;

const ChatbotPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('docu');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [dailyCount, setDailyCount] = useState(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [modelStatus, setModelStatus] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLIonInputElement>(null);

  const models = [
    { value: 'docu', label: 'Docu', icon: bookOpen, desc: 'Research & Study' },
    { value: 'pulse', label: 'Pulse', icon: heartPulse, desc: 'Clinical Cases' },
    { value: 'scrub', label: 'Scrub', icon: flask, desc: 'Procedural Skills' },
  ];

  // Load messages and daily count on mount
  useEffect(() => {
    loadMessages();
    checkDailyCount();
    checkModelStatus();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      setMessages(
        data.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          model: msg.model,
        }))
      );
    }
  };

  const checkDailyCount = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    setDailyCount(count || 0);
    if ((count || 0) >= DAILY_MESSAGE_LIMIT * 0.8) {
      setShowLimitWarning(true);
    }
  };

  const checkModelStatus = async () => {
    const { data } = await supabase
      .from('ai_model_settings')
      .select('model_name, enabled');

    if (data) {
      const status: Record<string, boolean> = {};
      data.forEach((s) => {
        status[s.model_name] = s.enabled;
      });
      setModelStatus(status);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!user) return;
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role,
      content,
      model: selectedModel,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    // Check daily limit
    if (dailyCount >= DAILY_MESSAGE_LIMIT) {
      setToastMessage(`You've reached your daily limit of ${DAILY_MESSAGE_LIMIT} messages. Try again tomorrow!`);
      setShowToast(true);
      return;
    }

    // Check if model is disabled
    if (modelStatus[selectedModel] === false) {
      setToastMessage(`${selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)} is temporarily unavailable. Try another model or check back later.`);
      setShowToast(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await saveMessage('user', userMessage.content);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        model: selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage('assistant', assistantMessage.content);
      setDailyCount((prev) => prev + 1);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.setFocus();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.setFocus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = async () => {
    if (!user) return;
    await supabase.from('chat_messages').delete().eq('user_id', user.id);
    setMessages([]);
    setToastMessage('Chat history cleared');
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gradient-to-r from-blue-600 to-indigo-700">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" className="text-white" />
          </IonButtons>
          <IonTitle className="text-white font-semibold">
            <div className="flex items-center gap-2">
              <IonIcon icon={sparkles} className="text-yellow-300" />
              Research Co-Pilot
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={clearChat} className="text-white">
              <IonIcon icon={refreshCw} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* Model Selector */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <IonItem lines="none" className="--padding-start: 0">
            <IonSelect
              value={selectedModel}
              onIonChange={(e) => setSelectedModel(e.detail.value)}
              interface="popover"
              className="w-full"
            >
              {models.map((m) => (
                <IonSelectOption key={m.value} value={m.value}>
                  <div className="flex items-center gap-2">
                    <IonIcon icon={m.icon} />
                    <span>{m.label}</span>
                    <span className="text-gray-400 text-sm">— {m.desc}</span>
                    {modelStatus[m.value] === false && (
                      <IonBadge color="medium">Offline</IonBadge>
                    )}
                  </div>
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </div>

        {/* Daily Limit Bar */}
        <div className="bg-gray-50 px-4 py-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Daily usage: {dailyCount}/{DAILY_MESSAGE_LIMIT}</span>
            <span>{Math.round((dailyCount / DAILY_MESSAGE_LIMIT) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <motion.div
              className={`h-1.5 rounded-full ${
                dailyCount >= DAILY_MESSAGE_LIMIT
                  ? 'bg-red-500'
                  : dailyCount >= DAILY_MESSAGE_LIMIT * 0.8
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${(dailyCount / DAILY_MESSAGE_LIMIT) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <AnimatedPage>
          {/* Limit Warning */}
          <AnimatePresence>
            {showLimitWarning && dailyCount < DAILY_MESSAGE_LIMIT && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mx-4 mt-2"
              >
                <IonCard className="m-0 bg-yellow-50 border border-yellow-200">
                  <IonCardContent className="flex items-start gap-2 py-3">
                    <IonIcon icon={alertCircle} className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Approaching daily limit</p>
                      <p>You've used {dailyCount} of {DAILY_MESSAGE_LIMIT} messages today. Use them wisely!</p>
                    </div>
                  </IonCardContent>
                </IonCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Research Co-Pilot Intro */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-8 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <IonIcon icon={sparkles} className="text-white text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Your Research Co-Pilot</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                Ask me anything about research, studies, or wellness. I'm here to help you learn, not replace your judgment.
              </p>

              {/* Suggested Prompts */}
              <div className="space-y-2 max-w-sm mx-auto">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handlePromptClick(prompt.text)}
                    className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <IonIcon icon={prompt.icon} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{prompt.text}</p>
                      <p className="text-xs text-gray-400">{prompt.category}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Disclaimer */}
              <div className="mt-6 flex items-start gap-2 text-xs text-gray-400 max-w-xs mx-auto">
                <IonIcon icon={info} className="flex-shrink-0 mt-0.5" />
                <p>
                  This AI provides educational support only. Always verify critical information and consult supervisors for clinical decisions.
                </p>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <div className="px-4 py-4 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <IonAvatar className="w-8 h-8 flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
                        <IonIcon icon={person} className="text-gray-600" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <IonIcon icon={sparkles} className="text-white text-sm" />
                      </div>
                    )}
                  </IonAvatar>

                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.model && message.role === 'assistant' && (
                      <div className="mt-1 text-xs opacity-50 flex items-center gap-1">
                        <IonIcon icon={flask} />
                        {message.model}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <IonIcon icon={sparkles} className="text-white text-sm" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <IonSpinner name="dots" color="medium" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </AnimatedPage>
      </IonContent>

      {/* Input Footer */}
      <IonFooter className="ion-no-border">
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <IonInput
              ref={inputRef}
              value={input}
              onIonInput={(e) => setInput(e.detail.value || '')}
              onKeyDown={handleKeyDown}
              placeholder={
                dailyCount >= DAILY_MESSAGE_LIMIT
                  ? 'Daily limit reached'
                  : 'Ask your research co-pilot...'
              }
              disabled={isLoading || dailyCount >= DAILY_MESSAGE_LIMIT}
              className="flex-1 bg-gray-100 rounded-full px-4"
              style={{ '--padding-start': '16px', '--padding-end': '16px' }}
            />
            <IonButton
              onClick={handleSend}
              disabled={!input.trim() || isLoading || dailyCount >= DAILY_MESSAGE_LIMIT}
              className="w-10 h-10 rounded-full"
              shape="round"
              color={dailyCount >= DAILY_MESSAGE_LIMIT ? 'medium' : 'primary'}
            >
              {isLoading ? (
                <IonSpinner name="crescent" color="light" />
              ) : (
                <IonIcon icon={send} />
              )}
            </IonButton>
          </div>
        </div>
      </IonFooter>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
        color="warning"
      />
    </IonPage>
  );
};

export default ChatbotPage;
