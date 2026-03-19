"use client";

import { useState } from "react";
import CreateForkModal from "./CreateForkModal";
import { type Fork } from "@/lib/types";

interface CreateForkButtonProps {
  onForkCreated: (fork: Fork) => void;
}

export default function CreateForkButton({ onForkCreated }: CreateForkButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (fork: Fork) => {
    onForkCreated(fork);
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={() => setIsModalOpen(true)}
        style={{
          width: "auto",
          padding: "0.625rem 1.25rem",
          fontSize: "0.9375rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
        aria-label="Create a new fork"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Create Fork
      </button>

      <CreateForkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
