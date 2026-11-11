"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionResultEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type UseSpeechRecognitionOptions = {
  value: string;
  onValueChange: (value: string) => void;
  lang?: string;
};

function appendSpeechText(base: string, speech: string) {
  const separator = base && speech ? " " : "";
  return `${base}${separator}${speech}`;
}

export function useSpeechRecognition({
  value,
  onValueChange,
  lang = "en-US",
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const constructorRef = useRef<SpeechRecognitionConstructor | null>(null);
  const baseValueRef = useRef(value);
  const finalSpeechRef = useRef("");
  const transcriptRef = useRef("");
  const onValueChangeRef = useRef(onValueChange);
  const recordingRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = constructorRef.current;
    if (!SpeechRecognition || !recordingRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      console.info("[speech] recognition started");
      setIsRecording(true);
    };
    recognition.onresult = (event) => {
      let interimSpeech = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index++
      ) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalSpeechRef.current += `${transcript} `;
        } else {
          interimSpeech += transcript;
        }
      }

      transcriptRef.current =
        `${finalSpeechRef.current}${interimSpeech}`.trim();
      onValueChangeRef.current(
        appendSpeechText(baseValueRef.current, transcriptRef.current),
      );
      console.info("[speech] recognized:", transcriptRef.current);
    };
    recognition.onerror = (event) => {
      console.error("[speech] recognition error:", event.error);
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed" ||
        event.error === "network"
      ) {
        recordingRef.current = false;
        setIsRecording(false);
        if (event.error === "network") {
          console.error(
            "[speech] Chrome could not reach its speech recognition service. " +
              "Check internet/VPN/firewall settings and use localhost or HTTPS.",
          );
        }
      }
    };
    recognition.onend = () => {
      console.info("[speech] recognition ended");
      recognitionRef.current = null;
      if (!recordingRef.current) return;

      restartTimeoutRef.current = setTimeout(() => {
        restartTimeoutRef.current = null;
        startRecognition();
      }, 100);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      console.error("[speech] failed to start recognition:", error);
      recognitionRef.current = null;
      if (recordingRef.current) {
        restartTimeoutRef.current = setTimeout(startRecognition, 100);
      }
    }
  }, [lang]);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    constructorRef.current =
      speechWindow.SpeechRecognition ??
      speechWindow.webkitSpeechRecognition ??
      null;
    setIsSupported(Boolean(constructorRef.current));

    return () => {
      recordingRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!constructorRef.current || recordingRef.current) return;

    baseValueRef.current = value;
    finalSpeechRef.current = "";
    transcriptRef.current = "";
    recordingRef.current = true;
    setIsRecording(true);
    startRecognition();
  }, [startRecognition, value]);

  const stop = useCallback(() => {
    console.log(
      "Transformed speech text:",
      appendSpeechText(baseValueRef.current, transcriptRef.current),
    );
    recordingRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }, []);

  return {
    isSupported,
    isListening: isRecording,
    isPaused: false,
    status: isRecording ? "listening" : "idle",
    start,
    pause: stop,
    resume: start,
    stop,
    toggle: isRecording ? stop : start,
  };
}
