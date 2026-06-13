import { useState, useCallback, useEffect } from "react";
import { userPrefs } from "@/lib/userPrefs";

export interface TourStep {
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right" | "center";
}

export const tourSteps: TourStep[] = [
  {
    target: "tour-home",
    title: "Welcome to MedStudent",
    content: "This is your feed where you can see posts from the community, discussions, and announcements.",
    position: "bottom",
  },
  {
    target: "tour-news",
    title: "Latest News & Updates",
    content: "Stay updated with the latest medical news, research, and community announcements.",
    position: "bottom",
  },
  {
    target: "tour-create",
    title: "Share Your Thoughts",
    content: "Post questions, findings, or start discussions with fellow medical students.",
    position: "bottom",
  },
  {
    target: "tour-communities",
    title: "Join Communities",
    content: "Discover and join study groups focused on specific subjects and topics.",
    position: "bottom",
  },
  {
    target: "tour-sidebar",
    title: "Sidebar Navigation",
    content: "Access your dashboard, saved posts, AI chatbot, and more from here.",
    position: "right",
  },
];

export function useAppTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(userPrefs.isTourCompleted());

  useEffect(() => {
    setIsCompleted(userPrefs.isTourCompleted());
  }, []);

  const startTour = useCallback(() => {
    setIsOpen(true);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    endTour();
  }, []);

  const endTour = useCallback(() => {
    setIsOpen(false);
    setIsCompleted(true);
    userPrefs.setTourCompleted(true);
  }, []);

  return {
    isOpen,
    currentStep,
    isCompleted,
    tourSteps,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    endTour,
  };
}
