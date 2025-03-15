import {
  FileImage,
  Mic,
  Paperclip,
  PlusCircle,
  SendHorizontal,
  ThumbsUp,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Message, loggedInUserData } from "@/data/data";
import { EmojiPicker } from "./emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChatInput } from "./ui/ui/chat/chat-input";
import useChatStore from "@/hooks/useChatStore";
import { Input } from "@/components/ui/input";

interface ChatBottombarProps {
  isMobile: boolean;
}

export const BottombarIcons = [{ icon: FileImage }, { icon: Paperclip }];

type MessageType = 'sms' | 'email';

export default function ChatBottombar({ isMobile }: ChatBottombarProps) {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>('sms');
  const [subject, setSubject] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const setMessages = useChatStore((state) => state.setMessages);
  const hasInitialResponse = useChatStore((state) => state.hasInitialResponse);
  const setHasInitialResponse = useChatStore(
    (state) => state.setHasInitialResponse,
  );
  const [isLoading, setisLoading] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleSubjectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSubject(event.target.value);
  };

  const sendMessage = (newMessage: Message) => {
    useChatStore.setState((state) => ({
      messages: [...state.messages, newMessage],
    }));
  };

  const handleThumbsUp = () => {
    const newMessage: Message = {
      id: message.length + 1,
      name: loggedInUserData.name,
      avatar: loggedInUserData.avatar,
      message: "👍",
    };
    sendMessage(newMessage);
    setMessage("");
  };

  const handleSend = () => {
    if (message.trim()) {
      let finalMessage = message.trim();
      
      if (messageType === 'email') {
        const subjectText = subject.trim() ? subject.trim() : "No Subject";
        finalMessage = `[Email] Subject: ${subjectText}\n${finalMessage}`;
      } else {
        finalMessage = `[SMS] ${finalMessage}`;
      }
      
      const newMessage: Message = {
        id: message.length + 1,
        name: loggedInUserData.name,
        avatar: loggedInUserData.avatar,
        message: finalMessage,
      };
      
      sendMessage(newMessage);
      setMessage("");
      if (messageType === 'email') {
        setSubject("");
      }

      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    if (!hasInitialResponse) {
      setisLoading(true);
      setTimeout(() => {
        setMessages((messages) => [
          ...messages.slice(0, messages.length - 1),
          {
            id: messages.length + 1,
            avatar:
              "https://images.freeimages.com/images/large-previews/971/basic-shape-avatar-1632968.jpg?fmt=webp&h=350",
            name: "Jane Doe",
            message: "Awesome! I am just chilling outside.",
            timestamp: formattedTime,
          },
        ]);
        setisLoading(false);
        setHasInitialResponse(true);
      }, 2500);
    }
  }, []);

  // When message type changes, focus on the appropriate input
  useEffect(() => {
    if (messageType === 'email' && subjectRef.current) {
      subjectRef.current.focus();
    } else if (messageType === 'sms' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messageType]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }

    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      setMessage((prev) => prev + "\n");
    }
  };

  const getTypeStyles = (type: MessageType) => {
    if (type === 'sms') {
      return messageType === 'sms' 
        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200" 
        : "text-muted-foreground";
    } else {
      return messageType === 'email'
        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200"
        : "text-muted-foreground";
    }
  };

  return (
    <div className="px-4 py-2 bg-white dark:bg-gray-950 w-full border-t">
      {/* Message Type Selector */}
      <div className="flex items-center justify-center mb-2">
        <div className="flex space-x-1 p-1 bg-muted/20 rounded-full">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium transition-colors",
              messageType === 'sms' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200" : "bg-transparent border-transparent"
            )}
            onClick={() => setMessageType('sms')}
          >
            <MessageSquare size={14} className="mr-1.5" /> 
            <span>SMS</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium transition-colors",
              messageType === 'email' ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200" : "bg-transparent border-transparent"
            )}
            onClick={() => setMessageType('email')}
          >
            <Mail size={14} className="mr-1.5" /> 
            <span>Email</span>
          </Button>
        </div>
      </div>

      {messageType === 'email' && (
        <div className="mb-2">
          <Input
            ref={subjectRef}
            placeholder="Subject"
            value={subject}
            onChange={handleSubjectChange}
            className="h-8 text-sm bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30 focus-visible:ring-blue-500/30"
          />
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <Popover>
            <PopoverTrigger asChild>
              <Link
                to="#"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-9 w-9",
                  "shrink-0",
                )}
              >
                <PlusCircle size={20} className="text-muted-foreground" />
              </Link>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-full p-2">
              {message.trim() || isMobile ? (
                <div className="flex gap-2">
                  <Link
                    to="#"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "h-9 w-9",
                      "shrink-0",
                    )}
                  >
                    <Mic size={20} className="text-muted-foreground" />
                  </Link>
                  {BottombarIcons.map((icon, index) => (
                    <Link
                      key={index}
                      to="#"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-9 w-9",
                        "shrink-0",
                      )}
                    >
                      <icon.icon size={20} className="text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  to="#"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-9 w-9",
                    "shrink-0",
                  )}
                >
                  <Mic size={20} className="text-muted-foreground" />
                </Link>
              )}
            </PopoverContent>
          </Popover>
          {!message.trim() && !isMobile && (
            <div className="flex">
              {BottombarIcons.map((icon, index) => (
                <Link
                  key={index}
                  to="#"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-9 w-9",
                    "shrink-0",
                  )}
                >
                  <icon.icon size={20} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence initial={false}>
          <motion.div
            key="input"
            className="w-full relative"
            layout
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{
              opacity: { duration: 0.05 },
              layout: {
                type: "spring",
                bounce: 0.15,
              },
            }}
          >
            <div className="relative w-full">
              <ChatInput
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={`Type ${messageType === 'email' ? 'an email' : 'a message'}...`}
                ref={inputRef}
                className={cn(
                  "rounded-full shadow-sm border bg-white dark:bg-gray-950",
                  messageType === 'email' 
                    ? "border-blue-200 dark:border-blue-800/30" 
                    : "border-green-200 dark:border-green-800/30"
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <EmojiPicker
                  onChange={(value) => {
                    setMessage(message + value);
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {message.trim() ? (
          <Button
            className={cn(
              "h-9 w-9 shrink-0",
              messageType === 'email' ? "text-blue-500 hover:text-blue-600" : "text-green-500 hover:text-green-600"
            )}
            onClick={handleSend}
            disabled={isLoading}
            variant="ghost"
            size="icon"
          >
            <SendHorizontal size={20} />
          </Button>
        ) : (
          <Button
            className="h-9 w-9 shrink-0"
            onClick={handleThumbsUp}
            disabled={isLoading}
            variant="ghost"
            size="icon"
          >
            <ThumbsUp size={20} className="text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
