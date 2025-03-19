// File: app/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Define types for the breath pattern
interface BreathCycle {
  inhale: number;
  exhale: number;
}

type PhaseType = "idle" | "countdown" | "inhale" | "exhale" | "complete";

export default function Home() {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<PhaseType>("idle");
  const [countdown, setCountdown] = useState<number>(3);
  const [progress, setProgress] = useState<number>(0);
  const [currentCycle, setCurrentCycle] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Reference to speech synthesis
  const synth = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Vortex Breath pattern (in seconds)
  const breathPattern: BreathCycle[] = [
    { inhale: 13, exhale: 13 },
    { inhale: 8, exhale: 8 },
    { inhale: 5, exhale: 5 },
    { inhale: 3, exhale: 3 },
    { inhale: 2, exhale: 2 },
    { inhale: 1, exhale: 1 },
  ];

  // Total duration of the meditation
  const totalDuration: number = breathPattern.reduce(
    (total, cycle) => total + cycle.inhale + cycle.exhale,
    0
  );

  // Initialize speech synthesis on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      synth.current = window.speechSynthesis;
    }

    return () => {
      // Cleanup on component unmount
      if (synth.current) {
        synth.current.cancel();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Speak function
  const speak = (text: string): void => {
    if (!synth.current) return;

    synth.current.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8; // Slightly slower speech
    utterance.pitch = 1;
    synth.current.speak(utterance);
  };

  // Start meditation
  const startMeditation = (): void => {
    setIsStarted(true);
    setCurrentPhase("countdown");
    setCountdown(3);
    setProgress(0);
    setCurrentCycle(0);

    // Initial countdown
    speak("Starting in 3");

    // Start countdown
    runCountdown();
  };

  // Run countdown
  const runCountdown = (): void => {
    let count = 3;

    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);

      if (count > 0) {
        speak(String(count));
      } else {
        clearInterval(countdownInterval);
        startBreathingCycles();
      }
    }, 1000);
  };

  // Start breathing cycles
  const startBreathingCycles = (): void => {
    let currentCycleIndex = 0;
    let phase: "inhale" | "exhale" = "inhale";
    let timeElapsed = 0;
    let phaseTimeRemaining = breathPattern[0].inhale;

    speak("Begin. Inhale deeply");
    setCurrentPhase("inhale");
    setTimeRemaining(breathPattern[0].inhale);

    const interval = setInterval(() => {
      const cycle = breathPattern[currentCycleIndex];

      // Update time remaining in the current phase
      phaseTimeRemaining--;
      setTimeRemaining(phaseTimeRemaining);

      // Advance time elapsed
      timeElapsed++;
      const totalProgress = (timeElapsed / totalDuration) * 100;
      setProgress(totalProgress);

      // Check if phase is complete
      if (phaseTimeRemaining <= 0) {
        // Switch phase
        if (phase === "inhale") {
          phase = "exhale";
          phaseTimeRemaining = cycle.exhale;
          speak("Exhale slowly");
          setCurrentPhase("exhale");
        } else {
          // Move to the next cycle
          currentCycleIndex++;
          setCurrentCycle(currentCycleIndex);

          // Check if meditation is complete
          if (currentCycleIndex >= breathPattern.length) {
            clearInterval(interval);
            setCurrentPhase("complete");
            speak(
              "Meditation complete. Take a moment to observe how you feel."
            );
            setIsStarted(false);
            return;
          }

          // Start new inhale phase
          phase = "inhale";
          phaseTimeRemaining = breathPattern[currentCycleIndex].inhale;
          speak(`Inhale deeply`);
          setCurrentPhase("inhale");
        }

        setTimeRemaining(phaseTimeRemaining);
      }
    }, 1000);

    timerRef.current = interval;
  };

  // Stop meditation
  const stopMeditation = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (synth.current) {
      synth.current.cancel();
    }
    setIsStarted(false);
    setCurrentPhase("idle");
    speak("Meditation ended");
  };

  // Get current instruction text
  const getInstructionText = (): string => {
    if (currentPhase === "countdown") {
      return `Starting in ${countdown}...`;
    } else if (currentPhase === "inhale") {
      return `Inhale (${timeRemaining}s)`;
    } else if (currentPhase === "exhale") {
      return `Exhale (${timeRemaining}s)`;
    } else if (currentPhase === "complete") {
      return "Meditation complete";
    } else {
      return "Press Start to begin";
    }
  };

  // Get current cycle info
  const getCycleInfo = (): string => {
    if (currentPhase === "idle" || currentPhase === "countdown") {
      return "Vortex Breath Meditation";
    }

    if (currentPhase === "complete") {
      return "Practice completed";
    }

    const currentPatternText = `Cycle ${currentCycle + 1} of ${
      breathPattern.length
    }: ${breathPattern[currentCycle].inhale}s inhale, ${
      breathPattern[currentCycle].exhale
    }s exhale`;
    return currentPatternText;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Vortex Breath Meditation
          </CardTitle>
          <CardDescription className="text-center">
            A phi ratio vortex breathing technique to instantly center your mind
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center py-8 text-3xl font-semibold text-indigo-700">
            {getInstructionText()}
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-gray-500">
              {getCycleInfo()}
            </p>
          </div>

          {!isStarted && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm">
                The Vortex Breath Pattern:
              </h3>
              <ul className="text-sm space-y-1 list-disc pl-4">
                {breathPattern.map((cycle, index) => (
                  <li key={index}>
                    Inhale {cycle.inhale}s, Exhale {cycle.exhale}s
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          {!isStarted ? (
            <Button
              onClick={startMeditation}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Start Meditation
            </Button>
          ) : (
            <Button onClick={stopMeditation} variant="destructive">
              End Session
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
